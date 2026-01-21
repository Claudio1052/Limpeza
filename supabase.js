// Supabase configuration for Rio Cleaning
const SUPABASE_CONFIG = {
    url: 'https://nekbbkenxcukoortusge.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5la2Jia2VueGN1a29vcnR1c2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTU5MDIsImV4cCI6MjA3ODk3MTkwMn0.D72914Vyz1du1ZDKoNDdwT7YI-D8WPgZe38LbBV2bfc'
};

// Initialize Supabase client
const supabaseClient = (function() {
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Please include the Supabase CDN.');
        return null;
    }
    
    // Create Supabase client
    const client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'X-Client-Info': 'rio-cleaning-web'
            }
        }
    });
    
    // Table name
    const TABLE_NAME = 'service_requests';
    
    // Cache for better performance
    const cache = {
        data: null,
        timestamp: null,
        ttl: 30000 // 30 seconds
    };
    
    // Check cache validity
    function isCacheValid() {
        return cache.data && cache.timestamp && (Date.now() - cache.timestamp < cache.ttl);
    }
    
    // Update cache
    function updateCache(data) {
        cache.data = data;
        cache.timestamp = Date.now();
    }
    
    // Clear cache
    function clearCache() {
        cache.data = null;
        cache.timestamp = null;
    }
    
    return {
        // Add a new service request
        async addServiceRequest(data) {
            try {
                // Validate required fields
                const requiredFields = ['fullName', 'phone', 'email', 'address', 'serviceType', 'cleaningDate', 'cleaningTime', 'description'];
                for (const field of requiredFields) {
                    if (!data[field]) {
                        throw new Error(`Missing required field: ${field}`);
                    }
                }
                
                // Prepare data for Supabase
                const supabaseData = {
                    full_name: data.fullName,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    service_type: data.serviceType,
                    bedrooms: parseInt(data.bedrooms) || 0,
                    cleaning_date: data.cleaningDate,
                    cleaning_time: data.cleaningTime,
                    description: data.description,
                    status: data.status || 'pending',
                    created_at: data.createdAt || new Date().toISOString()
                };
                
                const { data: result, error } = await client
                    .from(TABLE_NAME)
                    .insert([supabaseData])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase insert error:', error);
                    throw new Error(error.message || 'Failed to submit service request');
                }
                
                // Clear cache since data changed
                clearCache();
                
                return { 
                    success: true, 
                    data: result, 
                    error: null,
                    message: 'Service request submitted successfully'
                };
            } catch (error) {
                console.error('Error adding service request:', error);
                return { 
                    success: false, 
                    data: null, 
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Get all service requests with filters and pagination
        async getServiceRequests(filters = {}, page = 1, pageSize = 10) {
            try {
                // Check cache first
                const cacheKey = JSON.stringify({ filters, page, pageSize });
                if (isCacheValid() && cache.data && cache.data.cacheKey === cacheKey) {
                    return { 
                        success: true, 
                        data: cache.data.data,
                        count: cache.data.count,
                        page: cache.data.page,
                        pageSize: cache.data.pageSize,
                        totalPages: cache.data.totalPages,
                        fromCache: true
                    };
                }
                
                let query = client.from(TABLE_NAME).select('*', { count: 'exact' });
                
                // Apply filters
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                
                if (filters.date) {
                    const now = new Date();
                    let startDate;
                    
                    switch(filters.date) {
                        case 'today':
                            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            break;
                        case 'week':
                            const dayOfWeek = now.getDay();
                            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                            startDate = new Date(now.getFullYear(), now.getMonth(), diff);
                            break;
                        case 'month':
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                            break;
                    }
                    
                    if (startDate) {
                        query = query.gte('cleaning_date', startDate.toISOString().split('T')[0]);
                    }
                }
                
                if (filters.search) {
                    const searchTerm = `%${filters.search}%`;
                    query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},address.ilike.${searchTerm},phone.ilike.${searchTerm}`);
                }
                
                // Apply sorting (newest first)
                query = query.order('created_at', { ascending: false });
                
                // Apply pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);
                
                const { data, error, count } = await query;
                
                if (error) {
                    console.error('Supabase query error:', error);
                    throw new Error(error.message || 'Failed to fetch service requests');
                }
                
                // Calculate pagination info
                const totalPages = Math.ceil(count / pageSize);
                
                const result = {
                    data: data || [],
                    count: count || 0,
                    page,
                    pageSize,
                    totalPages
                };
                
                // Update cache
                updateCache({
                    cacheKey,
                    ...result
                });
                
                return { 
                    success: true, 
                    ...result,
                    fromCache: false
                };
            } catch (error) {
                console.error('Error fetching service requests:', error);
                return { 
                    success: false, 
                    data: [], 
                    count: 0,
                    page: 1,
                    pageSize: 10,
                    totalPages: 0,
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Update a service request
        async updateServiceRequest(id, updates) {
            try {
                if (!id) {
                    throw new Error('Service request ID is required');
                }
                
                // Map field names if needed
                const supabaseUpdates = {};
                const fieldMap = {
                    fullName: 'full_name',
                    phone: 'phone',
                    email: 'email',
                    address: 'address',
                    serviceType: 'service_type',
                    bedrooms: 'bedrooms',
                    cleaningDate: 'cleaning_date',
                    cleaningTime: 'cleaning_time',
                    description: 'description',
                    status: 'status'
                };
                
                Object.keys(updates).forEach(key => {
                    const supabaseKey = fieldMap[key] || key;
                    supabaseUpdates[supabaseKey] = updates[key];
                });
                
                supabaseUpdates.updated_at = new Date().toISOString();
                
                const { data, error } = await client
                    .from(TABLE_NAME)
                    .update(supabaseUpdates)
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase update error:', error);
                    throw new Error(error.message || 'Failed to update service request');
                }
                
                // Clear cache since data changed
                clearCache();
                
                return { 
                    success: true, 
                    data, 
                    error: null,
                    message: 'Service request updated successfully'
                };
            } catch (error) {
                console.error('Error updating service request:', error);
                return { 
                    success: false, 
                    data: null, 
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Delete a service request
        async deleteServiceRequest(id) {
            try {
                if (!id) {
                    throw new Error('Service request ID is required');
                }
                
                const { data, error } = await client
                    .from(TABLE_NAME)
                    .delete()
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase delete error:', error);
                    throw new Error(error.message || 'Failed to delete service request');
                }
                
                // Clear cache since data changed
                clearCache();
                
                return { 
                    success: true, 
                    data, 
                    error: null,
                    message: 'Service request deleted successfully'
                };
            } catch (error) {
                console.error('Error deleting service request:', error);
                return { 
                    success: false, 
                    data: null, 
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Get dashboard statistics
        async getDashboardStats() {
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
                
                // Get all requests for this month
                const { data: allData, error: allError } = await client
                    .from(TABLE_NAME)
                    .select('status')
                    .gte('created_at', startOfMonthStr);
                
                if (allError) {
                    throw new Error(allError.message || 'Failed to fetch statistics');
                }
                
                // Count by status
                const stats = {
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                    total: allData ? allData.length : 0
                };
                
                if (allData) {
                    allData.forEach(item => {
                        if (stats[item.status] !== undefined) {
                            stats[item.status]++;
                        }
                    });
                }
                
                // Get today's appointments
                const todayStr = now.toISOString().split('T')[0];
                const { data: todayData } = await client
                    .from(TABLE_NAME)
                    .select('*')
                    .eq('cleaning_date', todayStr)
                    .eq('status', 'confirmed');
                
                stats.todayAppointments = todayData ? todayData.length : 0;
                
                // Get upcoming appointments (next 7 days)
                const nextWeek = new Date(now);
                nextWeek.setDate(now.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];
                
                const { data: upcomingData } = await client
                    .from(TABLE_NAME)
                    .select('*')
                    .gte('cleaning_date', todayStr)
                    .lte('cleaning_date', nextWeekStr)
                    .eq('status', 'confirmed');
                
                stats.upcomingAppointments = upcomingData ? upcomingData.length : 0;
                
                return { 
                    success: true, 
                    data: stats, 
                    error: null 
                };
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                return { 
                    success: false, 
                    data: null, 
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Get service request by ID
        async getServiceRequestById(id) {
            try {
                if (!id) {
                    throw new Error('Service request ID is required');
                }
                
                const { data, error } = await client
                    .from(TABLE_NAME)
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    throw new Error(error.message || 'Service request not found');
                }
                
                return { 
                    success: true, 
                    data, 
                    error: null 
                };
            } catch (error) {
                console.error('Error fetching service request by ID:', error);
                return { 
                    success: false, 
                    data: null, 
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Export data to CSV
        async exportToCSV(filters = {}) {
            try {
                let query = client.from(TABLE_NAME).select('*');
                
                // Apply filters
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                
                if (filters.date) {
                    const now = new Date();
                    let startDate;
                    
                    if (filters.date === 'today') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    } else if (filters.date === 'week') {
                        const dayOfWeek = now.getDay();
                        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
                    } else if (filters.date === 'month') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    }
                    
                    if (startDate) {
                        query = query.gte('cleaning_date', startDate.toISOString().split('T')[0]);
                    }
                }
                
                const { data, error } = await query;
                
                if (error) {
                    throw new Error(error.message || 'Failed to export data');
                }
                
                // Convert to CSV
                const csv = this.convertToCSV(data);
                
                return { 
                    success: true, 
                    data: csv, 
                    error: null 
                };
            } catch (error) {
                console.error('Error exporting data:', error);
                return { 
                    success: false, 
                    data: null, 
                    error: error.message || 'An unexpected error occurred'
                };
            }
        },
        
        // Convert data to CSV format
        convertToCSV(data) {
            if (!data || data.length === 0) {
                return '';
            }
            
            const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Service Type', 'Bedrooms', 'Cleaning Date', 'Cleaning Time', 'Status', 'Created At'];
            const rows = data.map(item => [
                item.id,
                `"${item.full_name}"`,
                `"${item.phone}"`,
                `"${item.email}"`,
                `"${item.address}"`,
                `"${item.service_type}"`,
                item.bedrooms,
                item.cleaning_date,
                item.cleaning_time,
                item.status,
                item.created_at
            ]);
            
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
            
            return csvContent;
        },
        
        // Clear cache manually
        clearCache
    };
})();

// Make supabaseClient available globally
window.supabaseClient = supabaseClient;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.supabaseClient) {
        console.log('Supabase client initialized successfully');
        
        // Test connection
        window.supabaseClient.getDashboardStats()
            .then(result => {
                if (result.success) {
                    console.log('Supabase connection successful');
                } else {
                    console.warn('Supabase connection test failed:', result.error);
                }
            })
            .catch(error => {
                console.error('Supabase connection error:', error);
            });
    }
});
