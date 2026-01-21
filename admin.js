// Admin Dashboard JavaScript for Rio Cleaning

class AdminDashboard {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.totalItems = 0;
        this.currentFilters = {
            status: 'all',
            date: 'all',
            search: ''
        };
        this.currentData = [];
        this.selectedId = null;
        
        this.init();
    }
    
    async init() {
        this.cacheElements();
        this.bindEvents();
        this.checkAuth();
        this.loadDashboardData();
        
        // Initialize mobile view
        this.initMobileView();
        
        // Add service worker for offline support
        this.initServiceWorker();
    }
    
    cacheElements() {
        // Login elements
        this.adminLogin = document.getElementById('adminLogin');
        this.adminDashboard = document.getElementById('adminDashboard');
        this.loginBtn = document.getElementById('loginBtn');
        this.adminPassword = document.getElementById('adminPassword');
        this.loginMessage = document.getElementById('loginMessage');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Stats elements
        this.pendingCount = document.getElementById('pendingCount');
        this.confirmedCount = document.getElementById('confirmedCount');
        this.completedCount = document.getElementById('completedCount');
        this.totalCount = document.getElementById('totalCount');
        
        // Filter elements
        this.statusFilter = document.getElementById('statusFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.searchFilter = document.getElementById('searchFilter');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        
        // Table elements
        this.requestsTableBody = document.getElementById('requestsTableBody');
        this.tableInfo = document.getElementById('tableInfo');
        this.pagination = document.getElementById('pagination');
        this.loadingState = document.getElementById('loadingState');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.editForm = document.getElementById('editForm');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        
        // Close modal buttons
        this.closeModalBtns = document.querySelectorAll('.close-modal');
    }
    
    bindEvents() {
        // Login
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.handleLogin());
            this.adminPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        
        // Logout
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        // Filters
        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', () => this.handleFilterChange());
        }
        
        if (this.dateFilter) {
            this.dateFilter.addEventListener('change', () => this.handleFilterChange());
        }
        
        if (this.searchFilter) {
            this.searchFilter.addEventListener('input', 
                window.RioCleaning.debounce(() => this.handleFilterChange(), 500)
            );
        }
        
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }
        
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Modal close buttons
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Edit form submission
        if (this.editForm) {
            this.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }
        
        // Delete confirmation
        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', () => this.handleDeleteConfirm());
        }
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeAllModals();
            if (e.target === this.deleteModal) this.closeAllModals();
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
        
        // Handle window resize for mobile adjustments
        window.addEventListener('resize', 
            window.RioCleaning.throttle(() => this.handleResize(), 200)
        );
    }
    
    checkAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        
        if (isLoggedIn) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }
    
    async handleLogin() {
        const password = this.adminPassword.value.trim();
        
        // For demo purposes - in production, use proper authentication
        if (password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
            this.loadDashboardData();
            this.showToast('Login successful!', 'success');
        } else {
            this.showLoginError('Incorrect password. Please try again.');
        }
    }
    
    handleLogout() {
        localStorage.removeItem('adminLoggedIn');
        this.showLogin();
        this.adminPassword.value = '';
        this.showToast('Logged out successfully.', 'info');
    }
    
    showLogin() {
        if (this.adminLogin) this.adminLogin.style.display = 'flex';
        if (this.adminDashboard) this.adminDashboard.style.display = 'none';
    }
    
    showDashboard() {
        if (this.adminLogin) this.adminLogin.style.display = 'none';
        if (this.adminDashboard) this.adminDashboard.style.display = 'block';
    }
    
    showLoginError(message) {
        if (this.loginMessage) {
            this.loginMessage.innerHTML = `<div class="alert error"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
        }
        
        // Focus on password field
        if (this.adminPassword) {
            this.adminPassword.focus();
            this.adminPassword.select();
        }
    }
    
    async loadDashboardData() {
        this.showLoading(true);
        
        try {
            // Load stats
            await this.loadStats();
            
            // Load service requests
            await this.loadServiceRequests();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Error loading data. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadStats() {
        if (!window.supabaseClient) {
            console.error('Supabase client not available');
            return;
        }
        
        const result = await window.supabaseClient.getDashboardStats();
        
        if (result.success && result.data) {
            this.updateStatsDisplay(result.data);
        } else {
            console.error('Failed to load stats:', result.error);
        }
    }
    
    updateStatsDisplay(stats) {
        if (this.pendingCount) this.pendingCount.textContent = stats.pending || 0;
        if (this.confirmedCount) this.confirmedCount.textContent = stats.confirmed || 0;
        if (this.completedCount) this.completedCount.textContent = stats.completed || 0;
        if (this.totalCount) this.totalCount.textContent = stats.total || 0;
    }
    
    async loadServiceRequests(page = this.currentPage) {
        if (!window.supabaseClient) {
            console.error('Supabase client not available');
            return;
        }
        
        const result = await window.supabaseClient.getServiceRequests(
            this.currentFilters, 
            page, 
            this.pageSize
        );
        
        if (result.success) {
            this.currentData = result.data;
            this.totalItems = result.count;
            this.totalPages = result.totalPages;
            this.currentPage = page;
            
            this.updateTableDisplay();
            this.updatePagination();
            this.updateTableInfo();
        } else {
            console.error('Failed to load service requests:', result.error);
            this.showToast('Error loading service requests.', 'error');
        }
    }
    
    updateTableDisplay() {
        if (!this.requestsTableBody) return;
        
        if (!this.currentData || this.currentData.length === 0) {
            this.requestsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state-content">
                            <i class="fas fa-inbox"></i>
                            <p>No service requests found</p>
                            ${this.currentFilters.status !== 'all' || this.currentFilters.date !== 'all' || this.currentFilters.search ? 
                                '<p class="empty-state-subtitle">Try changing your filters</p>' : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let tableHTML = '';
        
        this.currentData.forEach(request => {
            const cleaningDate = window.RioCleaning.formatDate(request.cleaning_date);
            const timeText = window.RioCleaning.formatTime(request.cleaning_time);
            
            // Status badge
            let statusClass = '';
            let statusText = '';
            let statusIcon = '';
            
            switch(request.status) {
                case 'pending':
                    statusClass = 'status-pending';
                    statusText = 'Pending';
                    statusIcon = '<i class="fas fa-clock"></i>';
                    break;
                case 'confirmed':
                    statusClass = 'status-confirmed';
                    statusText = 'Confirmed';
                    statusIcon = '<i class="fas fa-check-circle"></i>';
                    break;
                case 'completed':
                    statusClass = 'status-completed';
                    statusText = 'Completed';
                    statusIcon = '<i class="fas fa-flag-checkered"></i>';
                    break;
                case 'cancelled':
                    statusClass = 'status-cancelled';
                    statusText = 'Cancelled';
                    statusIcon = '<i class="fas fa-times-circle"></i>';
                    break;
            }
            
            tableHTML += `
                <tr data-id="${request.id}">
                    <td>
                        <div class="client-name">${request.full_name}</div>
                        <small class="client-id">ID: ${request.id}</small>
                    </td>
                    <td>
                        <div class="client-phone">${request.phone}</div>
                        <div class="client-email">${request.email}</div>
                    </td>
                    <td>
                        <div class="service-type">${this.formatServiceType(request.service_type)}</div>
                        ${request.bedrooms > 0 ? `<div class="bedrooms">${request.bedrooms} bedroom(s)</div>` : ''}
                    </td>
                    <td>
                        <div class="cleaning-date">${cleaningDate}</div>
                        <div class="cleaning-time">${timeText}</div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusIcon} ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-small edit-btn" 
                                    data-id="${request.id}"
                                    aria-label="Edit ${request.full_name}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-small delete-btn" 
                                    data-id="${request.id}"
                                    aria-label="Delete ${request.full_name}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        this.requestsTableBody.innerHTML = tableHTML;
        
        // Add event listeners to action buttons
        this.requestsTableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.handleEditClick(id);
            });
        });
        
        this.requestsTableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.handleDeleteClick(id);
            });
        });
        
        // Also create mobile cards
        this.createMobileCards();
    }
    
    createMobileCards() {
        const mobileView = document.querySelector('.mobile-table-view');
        if (!mobileView || !this.currentData || this.currentData.length === 0) return;
        
        let cardsHTML = '';
        
        this.currentData.forEach(request => {
            const cleaningDate = window.RioCleaning.formatDate(request.cleaning_date);
            const timeText = window.RioCleaning.formatTime(request.cleaning_time);
            
            // Status badge
            let statusClass = '';
            let statusText = '';
            
            switch(request.status) {
                case 'pending': statusClass = 'status-pending'; statusText = 'Pending'; break;
                case 'confirmed': statusClass = 'status-confirmed'; statusText = 'Confirmed'; break;
                case 'completed': statusClass = 'status-completed'; statusText = 'Completed'; break;
                case 'cancelled': statusClass = 'status-cancelled'; statusText = 'Cancelled'; break;
            }
            
            cardsHTML += `
                <div class="mobile-card" data-id="${request.id}">
                    <div class="mobile-card-header">
                        <div class="mobile-card-title">${request.full_name}</div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Contact:</span>
                            <span class="mobile-card-value">
                                <div>${request.phone}</div>
                                <div>${request.email}</div>
                            </span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Service:</span>
                            <span class="mobile-card-value">
                                <div>${this.formatServiceType(request.service_type)}</div>
                                ${request.bedrooms > 0 ? `<div>${request.bedrooms} bedroom(s)</div>` : ''}
                            </span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Date/Time:</span>
                            <span class="mobile-card-value">
                                <div>${cleaningDate}</div>
                                <div>${timeText}</div>
                            </span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="mobile-card-label">Address:</span>
                            <span class="mobile-card-value">${request.address}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="btn btn-primary btn-small edit-btn" data-id="${request.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-small delete-btn" data-id="${request.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        mobileView.innerHTML = cardsHTML;
        
        // Add event listeners to mobile card buttons
        mobileView.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.handleEditClick(id);
            });
        });
        
        mobileView.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.handleDeleteClick(id);
            });
        });
    }
    
    updatePagination() {
        if (!this.pagination) return;
        
        if (this.totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-page ${i === this.currentPage ? 'active' : ''}">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-next" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        this.pagination.innerHTML = paginationHTML;
        
        // Add event listeners
        this.pagination.querySelector('.pagination-prev').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.loadServiceRequests(this.currentPage - 1);
            }
        });
        
        this.pagination.querySelector('.pagination-next').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.loadServiceRequests(this.currentPage + 1);
            }
        });
        
        this.pagination.querySelectorAll('.pagination-page').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const pageNum = startPage + index;
                if (pageNum !== this.currentPage) {
                    this.loadServiceRequests(pageNum);
                }
            });
        });
    }
    
    updateTableInfo() {
        if (!this.tableInfo) return;
        
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(start + this.pageSize - 1, this.totalItems);
        
        this.tableInfo.textContent = `Showing ${start}-${end} of ${this.totalItems} requests`;
    }
    
    async handleEditClick(id) {
        this.selectedId = id;
        
        try {
            const result = await window.supabaseClient.getServiceRequestById(id);
            
            if (result.success && result.data) {
                this.populateEditForm(result.data);
                this.showModal(this.editModal);
            } else {
                throw new Error(result.error || 'Failed to load service request');
            }
        } catch (error) {
            console.error('Error loading service request for edit:', error);
            this.showToast('Error loading service request.', 'error');
        }
    }
    
    populateEditForm(data) {
        document.getElementById('editId').value = data.id;
        document.getElementById('editFullName').value = data.full_name;
        document.getElementById('editPhone').value = data.phone;
        document.getElementById('editEmail').value = data.email;
        document.getElementById('editAddress').value = data.address;
        document.getElementById('editServiceType').value = data.service_type;
        document.getElementById('editBedrooms').value = data.bedrooms || '0';
        document.getElementById('editCleaningDate').value = data.cleaning_date;
        document.getElementById('editCleaningTime').value = data.cleaning_time;
        document.getElementById('editDescription').value = data.description || '';
        document.getElementById('editStatus').value = data.status;
    }
    
    async handleEditSubmit(e) {
        e.preventDefault();
        
        const updates = {
            fullName: document.getElementById('editFullName').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            address: document.getElementById('editAddress').value.trim(),
            serviceType: document.getElementById('editServiceType').value,
            bedrooms: parseInt(document.getElementById('editBedrooms').value) || 0,
            cleaningDate: document.getElementById('editCleaningDate').value,
            cleaningTime: document.getElementById('editCleaningTime').value,
            description: document.getElementById('editDescription').value.trim(),
            status: document.getElementById('editStatus').value
        };
        
        // Validate required fields
        const requiredFields = ['fullName', 'phone', 'email', 'address', 'serviceType', 'cleaningDate', 'cleaningTime', 'status'];
        for (const field of requiredFields) {
            if (!updates[field]) {
                this.showToast(`Please fill in the ${field} field.`, 'error');
                return;
            }
        }
        
        try {
            const result = await window.supabaseClient.updateServiceRequest(this.selectedId, updates);
            
            if (result.success) {
                this.showToast('Service request updated successfully!', 'success');
                this.closeAllModals();
                this.loadDashboardData();
            } else {
                throw new Error(result.error || 'Failed to update service request');
            }
        } catch (error) {
            console.error('Error updating service request:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }
    
    handleDeleteClick(id) {
        this.selectedId = id;
        this.showModal(this.deleteModal);
    }
    
    async handleDeleteConfirm() {
        if (!this.selectedId) return;
        
        try {
            const result = await window.supabaseClient.deleteServiceRequest(this.selectedId);
            
            if (result.success) {
                this.showToast('Service request deleted successfully!', 'success');
                this.closeAllModals();
                this.loadDashboardData();
            } else {
                throw new Error(result.error || 'Failed to delete service request');
            }
        } catch (error) {
            console.error('Error deleting service request:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }
    
    handleFilterChange() {
        this.currentFilters = {
            status: this.statusFilter ? this.statusFilter.value : 'all',
            date: this.dateFilter ? this.dateFilter.value : 'all',
            search: this.searchFilter ? this.searchFilter.value.trim() : ''
        };
        
        this.currentPage = 1;
        this.loadServiceRequests();
    }
    
    async exportData() {
        try {
            this.showLoading(true);
            
            const result = await window.supabaseClient.exportToCSV(this.currentFilters);
            
            if (result.success && result.data) {
                this.downloadCSV(result.data, `rio-cleaning-${new Date().toISOString().split('T')[0]}.csv`);
                this.showToast('Data exported successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to export data');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            // For IE
            navigator.msSaveBlob(blob, fileName);
        } else {
            // For other browsers
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    showModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus on first input in modal
            setTimeout(() => {
                const firstInput = modal.querySelector('input, select, textarea, button');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }
    
    closeAllModals() {
        if (this.editModal) this.editModal.style.display = 'none';
        if (this.deleteModal) this.deleteModal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset selected ID
        this.selectedId = null;
    }
    
    showLoading(show) {
        if (this.loadingState) {
            this.loadingState.style.display = show ? 'flex' : 'none';
        }
        
        if (this.refreshBtn) {
            this.refreshBtn.disabled = show;
            if (show) {
                this.refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            } else {
                this.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        }
    }
    
    showToast(message, type = 'info') {
        if (window.RioCleaning && window.RioCleaning.showToast) {
            window.RioCleaning.showToast(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    formatServiceType(type) {
        const types = {
            'house': 'House Cleaning',
            'church': 'Church Cleaning',
            'upholstery': 'Upholstery Cleaning',
            'commercial': 'Commercial Cleaning',
            'other': 'Other Service'
        };
        
        return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    initMobileView() {
        // Check if we're on mobile and update view accordingly
        this.handleResize();
    }
    
    handleResize() {
        // This will be handled by the responsive CSS and script.js
        // We just need to trigger table refresh if needed
        if (window.innerWidth < 768 && this.currentData.length > 0) {
            this.createMobileCards();
        }
    }
    
    initServiceWorker() {
        // Service worker initialization is handled in script.js
        // This is just a placeholder for admin-specific PWA features
    }
}

// Initialize the admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on admin page
    if (document.querySelector('.admin-container')) {
        window.adminDashboard = new AdminDashboard();
    }
});
