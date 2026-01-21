// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    });
    
    // Admin link - check if user is logged in
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Check if user is already logged in
            const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            
            if (!isLoggedIn && !link.href.includes('admin.html')) {
                e.preventDefault();
                window.location.href = 'admin.html';
            }
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('adminLoggedIn');
            window.location.href = 'admin.html';
        });
    }
});

// Responsive adjustments
document.addEventListener('DOMContentLoaded', function() {
    // Adjust table for mobile
    function adjustTableForMobile() {
        const table = document.querySelector('.service-requests table');
        if (!table) return;
        
        if (window.innerWidth < 768) {
            table.classList.add('mobile-table');
            
            // Convert table to more mobile-friendly format if needed
            const headers = [];
            const headerCells = table.querySelectorAll('thead th');
            headerCells.forEach((cell, index) => {
                headers[index] = cell.textContent;
            });
            
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index]);
                    }
                });
            });
        } else {
            table.classList.remove('mobile-table');
        }
    }
    
    // Adjust modal for mobile
    function adjustModalForMobile() {
        const modal = document.getElementById('editModal');
        if (!modal) return;
        
        if (window.innerWidth < 768) {
            modal.style.alignItems = 'flex-start';
            modal.style.paddingTop = '20px';
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
});
