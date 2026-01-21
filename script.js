// Main JavaScript File for Rio Cleaning Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Initialize admin link handling
    initAdminLinks();
    
    // Initialize form validation
    initFormValidation();
    
    // Initialize responsive adjustments
    initResponsiveAdjustments();
    
    // Initialize service worker for PWA
    initServiceWorker();
});

// Mobile menu functionality
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
            menuToggle.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking on a link
        const navItems = document.querySelectorAll('.nav-links a');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Handle escape key to close menu
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just # or admin links
            if (href === '#' || href.includes('admin.html')) {
                return;
            }
            
            e.preventDefault();
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL without jumping
                history.pushState(null, null, href);
            }
        });
    });
}

// Admin link handling
function initAdminLinks() {
    const adminLinks = document.querySelectorAll('.admin-link:not(.active)');
    
    adminLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Check if user is already logged in
            const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            
            if (!isLoggedIn) {
                e.preventDefault();
                window.location.href = 'admin.html';
            }
        });
    });
}

// Form validation helper
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            // Add aria attributes
            input.setAttribute('aria-required', 'true');
            
            // Validate on blur
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            // Real-time validation for email and phone
            if (input.type === 'email' || input.id === 'phone') {
                input.addEventListener('input', function() {
                    validateField(this);
                });
            }
        });
        
        // Form submission validation
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const firstInvalidInput = [];
            
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                    if (firstInvalidInput.length === 0) {
                        firstInvalidInput.push(input);
                    }
                }
            });
            
            if (!isValid && firstInvalidInput.length > 0) {
                e.preventDefault();
                firstInvalidInput[0].focus();
                showToast('Please fill all required fields correctly.', 'error');
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Check if field is required and empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Phone validation
    if (field.id === 'phone' && value) {
        const phoneDigits = value.replace(/[^\d]/g, '');
        if (phoneDigits.length < 10) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number (at least 10 digits)';
        }
    }
    
    // Date validation (not in past)
    if (field.type === 'date' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            isValid = false;
            errorMessage = 'Please select a date in the future';
        }
    }
    
    // Update field state
    if (errorMessage) {
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('invalid');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = errorMessage;
        errorElement.setAttribute('role', 'alert');
        field.parentElement.appendChild(errorElement);
    } else {
        field.setAttribute('aria-invalid', 'false');
        field.classList.remove('invalid');
        field.classList.add('valid');
    }
    
    return isValid;
}

// Toast notification system
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Toast content
    let icon = '';
    switch(type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="toast-close" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Add styles if not already added
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                max-width: 400px;
                z-index: 9999;
                animation: toastSlideIn 0.3s ease;
                border-left: 4px solid;
            }
            
            .toast-success {
                border-left-color: #28a745;
                background-color: #d4edda;
                color: #155724;
            }
            
            .toast-error {
                border-left-color: #dc3545;
                background-color: #f8d7da;
                color: #721c24;
            }
            
            .toast-warning {
                border-left-color: #ffc107;
                background-color: #fff3cd;
                color: #856404;
            }
            
            .toast-info {
                border-left-color: #17a2b8;
                background-color: #d1ecf1;
                color: #0c5460;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .toast-close:hover {
                background-color: rgba(0,0,0,0.1);
            }
            
            @keyframes toastSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 768px) {
                .toast {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                    bottom: 80px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => toast.remove());
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Responsive adjustments
function initResponsiveAdjustments() {
    // Adjust table for mobile
    function adjustTableForMobile() {
        const table = document.querySelector('#requestsTable');
        if (!table) return;
        
        const isMobile = window.innerWidth < 768;
        const mobileView = document.querySelector('.mobile-table-view');
        const desktopView = document.querySelector('.desktop-table-view');
        
        if (isMobile) {
            if (mobileView) mobileView.style.display = 'block';
            if (desktopView) desktopView.style.display = 'none';
            
            // Convert table to mobile cards if needed
            if (!mobileView && table) {
                createMobileCardsFromTable();
            }
        } else {
            if (mobileView) mobileView.style.display = 'none';
            if (desktopView) desktopView.style.display = 'block';
        }
    }
    
    function createMobileCardsFromTable() {
        const tableBody = document.querySelector('#requestsTableBody');
        if (!tableBody) return;
        
        const rows = tableBody.querySelectorAll('tr');
        const mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-table-view';
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;
            
            const card = document.createElement('div');
            card.className = 'mobile-card';
            
            // Extract data from cells
            const name = cells[0].textContent;
            const contact = cells[1].innerHTML;
            const service = cells[2].innerHTML;
            const dateTime = cells[3].innerHTML;
            const status = cells[4].innerHTML;
            const actions = cells[5].innerHTML;
            
            card.innerHTML = `
                <div class="mobile-card-header">
                    <div class="mobile-card-title">${name}</div>
                    <div class="mobile-card-status">${status}</div>
                </div>
                <div class="mobile-card-body">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Contact:</span>
                        <span class="mobile-card-value">${contact.replace(/<[^>]*>/g, '')}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Service:</span>
                        <span class="mobile-card-value">${service.replace(/<[^>]*>/g, '')}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Date/Time:</span>
                        <span class="mobile-card-value">${dateTime.replace(/<[^>]*>/g, '')}</span>
                    </div>
                </div>
                <div class="mobile-card-actions">
                    ${actions}
                </div>
            `;
            
            mobileContainer.appendChild(card);
        });
        
        tableBody.parentElement.parentElement.appendChild(mobileContainer);
    }
    
    // Adjust modal for mobile
    function adjustModalForMobile() {
        const modal = document.getElementById('editModal') || document.getElementById('deleteModal');
        if (!modal) return;
        
        if (window.innerWidth < 768) {
            modal.style.alignItems = 'flex-start';
            modal.style.paddingTop = '60px';
        } else {
            modal.style.alignItems = 'center';
            modal.style.paddingTop = '0';
        }
    }
    
    // Run adjustments on load and resize
    adjustTableForMobile();
    adjustModalForMobile();
    
    window.addEventListener('resize', function() {
        adjustTableForMobile();
        adjustModalForMobile();
    });
    
    // Touch-friendly improvements
    document.querySelectorAll('button, a, input[type="submit"]').forEach(element => {
        element.style.touchAction = 'manipulation';
    });
    
    // Prevent zoom on form inputs on iOS
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                document.body.style.fontSize = '16px';
            }
        });
        
        element.addEventListener('blur', function() {
            document.body.style.fontSize = '';
        });
    });
    
    // Handle virtual keyboard on mobile
    if ('visualViewport' in window) {
        const viewport = window.visualViewport;
        
        viewport.addEventListener('resize', function() {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                setTimeout(() => {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });
    }
}

// Service Worker for PWA
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
}

// Format date function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short'
    });
}

// Format time function
function formatTime(timeValue) {
    const times = {
        'morning': '8:00 AM - 12:00 PM',
        'afternoon': '1:00 PM - 5:00 PM',
        'evening': '6:00 PM - 8:00 PM'
    };
    return times[timeValue] || timeValue;
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other files
window.RioCleaning = {
    showToast,
    formatDate,
    formatTime,
    debounce,
    throttle
};
