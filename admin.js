document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginBtn = document.getElementById('loginBtn');
    const adminPassword = document.getElementById('adminPassword');
    const loginMessage = document.getElementById('loginMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const pendingCount = document.getElementById('pendingCount');
    const confirmedCount = document.getElementById('confirmedCount');
    const completedCount = document.getElementById('completedCount');
    const totalCount = document.getElementById('totalCount');
    
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchFilter = document.getElementById('searchFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    
    const requestsTable = document.getElementById('requestsTable');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
    
    // Login functionality
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const password = adminPassword.value;
            
            // For demo purposes, using a simple password check
            // In a real application, you should implement proper authentication
            if (password === 'admin123') {
                localStorage.setItem('adminLoggedIn', 'true');
                showDashboard();
                loadDashboardData();
            } else {
                loginMessage.innerHTML = '<div class="alert error">Incorrect password. Try again.</div>';
            }
        });
    }
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('adminLoggedIn');
            showLogin();
        });
    }
    
    // Filter functionality
    if (statusFilter) {
        statusFilter.addEventListener('change', loadServiceRequests);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', loadServiceRequests);
    }
    
    if (searchFilter) {
        searchFilter.addEventListener('input', function() {
            // Debounce the search
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                loadServiceRequests();
            }, 500);
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // Modal close functionality
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // Edit form submission
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const id = document.getElementById('editId').value;
            const updates = {
                fullName: document.getElementById('editFullName').value,
                phone: document.getElementById('editPhone').value,
                email: document.getElementById('editEmail').value,
                address: document.getElementById('editAddress').value,
                serviceType: document.getElementById('editServiceType').value,
                bedrooms: document.getElementById('editBedrooms').value,
                cleaningDate: document.getElementById('editCleaningDate').value,
                cleaningTime: document.getElementById('editCleaningTime').value,
                description: document.getElementById('editDescription').value,
                status: document.getElementById('editStatus').value
            };
            
            try {
                const result = await window.supabaseClient.updateServiceRequest(id, updates);
                
                if (result.error) {
                    alert('Error updating service request: ' + result.error.message);
                } else {
                    editModal.style.display = 'none';
                    loadDashboardData();
                    alert('Service request updated successfully!');
                }
            } catch (error) {
                alert('An error occurred: ' + error.message);
            }
        });
    }
    
    // Functions
    function showLogin() {
        if (adminLogin) adminLogin.style.display = 'flex';
        if (adminDashboard) adminDashboard.style.display = 'none';
    }
    
    function showDashboard() {
        if (adminLogin) adminLogin.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
    }
    
    async function loadDashboardData() {
        // Load stats
        const statsResult = await window.supabaseClient.getDashboardStats();
        
        if (statsResult.data) {
            pendingCount.textContent = statsResult.data.pending;
            confirmedCount.textContent = statsResult.data.confirmed;
            completedCount.textContent = statsResult.data.completed;
            totalCount.textContent = statsResult.data.total;
        }
        
        // Load service requests
        loadServiceRequests();
    }
    
    async function loadServiceRequests() {
        if (!requestsTable) return;
        
        const filters = {
            status: statusFilter ? statusFilter.value : 'all',
            date: dateFilter ? dateFilter.value : 'all',
            search: searchFilter ? searchFilter.value : ''
        };
        
        const result = await window.supabaseClient.getServiceRequests(filters);
        
        if (result.error) {
            requestsTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Error loading service requests: ${result.error.message}</td></tr>`;
            return;
        }
        
        if (!result.data || result.data.length === 0) {
            requestsTable.innerHTML = '<tr><td colspan="6" style="text-align: center;">No service requests found.</td></tr>';
            return;
        }
        
        let tableHTML = '';
        
        result.data.forEach(request => {
            // Format date
            const cleaningDate = new Date(request.cleaningDate);
            const formattedDate = cleaningDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Format time
            let timeText = '';
            switch(request.cleaningTime) {
                case 'morning': timeText = '8 AM - 12 PM'; break;
                case 'afternoon': timeText = '1 PM - 5 PM'; break;
                case 'evening': timeText = '6 PM - 8 PM'; break;
                default: timeText = request.cleaningTime;
            }
            
            // Status badge
            let statusClass = '';
            let statusText = '';
            
            switch(request.status) {
                case 'pending':
                    statusClass = 'status-pending';
                    statusText = 'Pending';
                    break;
                case 'confirmed':
                    statusClass = 'status-confirmed';
                    statusText = 'Confirmed';
                    break;
                case 'completed':
                    statusClass = 'status-completed';
                    statusText = 'Completed';
                    break;
                case 'cancelled':
                    statusClass = 'status-cancelled';
                    statusText = 'Cancelled';
                    break;
                default:
                    statusClass = 'status-pending';
                    statusText = request.status;
            }
            
            tableHTML += `
                <tr>
                    <td>${request.fullName}</td>
                    <td>
                        <div>${request.phone}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">${request.email}</div>
                    </td>
                    <td>
                        <div>${formatServiceType(request.serviceType)}</div>
                        ${request.bedrooms > 0 ? `<div style="font-size: 0.85rem; color: #7f8c8d;">${request.bedrooms} bedroom(s)</div>` : ''}
                    </td>
                    <td>
                        <div>${formattedDate}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">${timeText}</div>
                    </td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-small edit-btn" data-id="${request.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-secondary btn-small delete-btn" data-id="${request.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        requestsTable.innerHTML = tableHTML;
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editServiceRequest(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this service request?')) {
                    deleteServiceRequest(id);
                }
            });
        });
    }
    
    async function editServiceRequest(id) {
        // Get the service request data
        const result = await window.supabaseClient.getServiceRequests();
        
        if (result.error) {
            alert('Error loading service request: ' + result.error.message);
            return;
        }
        
        const request = result.data.find(item => item.id == id);
        
        if (!request) {
            alert('Service request not found.');
            return;
        }
        
        // Populate the form
        document.getElementById('editId').value = request.id;
        document.getElementById('editFullName').value = request.fullName;
        document.getElementById('editPhone').value = request.phone;
        document.getElementById('editEmail').value = request.email;
        document.getElementById('editAddress').value = request.address;
        document.getElementById('editServiceType').value = request.serviceType;
        document.getElementById('editBedrooms').value = request.bedrooms || '0';
        document.getElementById('editCleaningDate').value = request.cleaningDate;
        document.getElementById('editCleaningTime').value = request.cleaningTime;
        document.getElementById('editDescription').value = request.description || '';
        document.getElementById('editStatus').value = request.status;
        
        // Show the modal
        editModal.style.display = 'flex';
    }
    
    async function deleteServiceRequest(id) {
        try {
            const result = await window.supabaseClient.deleteServiceRequest(id);
            
            if (result.error) {
                alert('Error deleting service request: ' + result.error.message);
            } else {
                loadDashboardData();
                alert('Service request deleted successfully!');
            }
        } catch (error) {
            alert('An error occurred: ' + error.message);
        }
    }
    
    function formatServiceType(type) {
        const types = {
            'house': 'House Cleaning',
            'church': 'Church Cleaning',
            'upholstery': 'Upholstery Cleaning',
            'commercial': 'Commercial Cleaning',
            'other': 'Other Service'
        };
        
        return types[type] || type;
    }
});