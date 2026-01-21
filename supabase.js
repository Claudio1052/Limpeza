// Supabase configuration
const SUPABASE_URL = 'https://nekbbkenxcukoortusge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5la2Jia2VueGN1a29vcnR1c2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTU5MDIsImV4cCI6MjA3ODk3MTkwMn0.D72914Vyz1du1ZDKoNDdwT7YI-D8WPgZe38LbBV2bfc';

// Initialize Supabase client
const supabaseClient = (function() {
    // Create Supabase client
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Table name
    const TABLE_NAME = 'service_requests';
    
    // Check if Supabase is properly initialized
    if (!window.supabase) {
        console.error('Supabase library not loaded. Make sure to include the Supabase CDN in your HTML.');
        return null;
    }
    
    return {
        // Add a new service request
        async addServiceRequest(data) {
            try {
                const { data: result, error } = await client
                    .from(TABLE_NAME)
                    .insert([data])
                    .select();
                    
                if (error) throw error;
                return { data: result, error: null };
            } catch (error) {
                console.error('Error adding service request:', error);
                return { data: null, error };
            }
        },
        
        // Get all service requests
        async getServiceRequests(filters = {}) {
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
                        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
                        startDate = new Date(now.setDate(diff));
                    } else if (filters.date === 'month') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    }
                    
                    if (startDate) {
                        query = query.gte('cleaningDate', startDate.toISOString().split('T')[0]);
                    }
                }
                
                if (filters.search) {
                    query = query.or(`fullName.ilike.%${filters.search}%,email.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
                }
                
                // Order by date (newest first)
                query = query.order('createdAt', { ascending: false });
                
                const { data, error } = await query;
                
                if (error) throw error;
                return { data, error: null };
            } catch (error) {
                console.error('Error fetching service requests:', error);
                return { data: null, error };
            }
        },
        
        // Update a service request
        async updateServiceRequest(id, updates) {
            try {
                const { data, error } = await client
                    .from(TABLE_NAME)
                    .update(updates)
                    .eq('id', id)
                    .select();
                    
                if (error) throw error;
                return { data, error: null };
            } catch (error) {
                console.error('Error updating service request:', error);
                return { data: null, error };
            }
        },
        
        // Delete a service request
        async deleteServiceRequest(id) {
            try {
                const { data, error } = await client
                    .from(TABLE_NAME)
                    .delete()
                    .eq('id', id)
                    .select();
                    
                if (error) throw error;
                return { data, error: null };
            } catch (error) {
                console.error('Error deleting service request:', error);
                return { data: null, error };
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
                    .gte('createdAt', startOfMonthStr);
                    
                if (allError) throw allError;
                
                // Count by status
                const stats = {
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    total: allData ? allData.length : 0
                };
                
                if (allData) {
                    allData.forEach(item => {
                        if (stats[item.status] !== undefined) {
                            stats[item.status]++;
                        }
                    });
                }
                
                return { data: stats, error: null };
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                return { data: null, error };
            }
        }
    };
})();

// Make supabaseClient available globally
window.supabaseClient = supabaseClient;