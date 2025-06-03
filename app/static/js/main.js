// Main JavaScript file for the application

// Handle form submissions with AJAX
document.addEventListener('DOMContentLoaded', function() {
    // Add AJAX form submission handlers
    const ajaxForms = document.querySelectorAll('form[data-ajax="true"]');
    ajaxForms.forEach(form => {
        form.addEventListener('submit', handleAjaxForm);
    });

    // Initialize any interactive components
    initializeComponents();
});

function handleAjaxForm(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const url = form.action;
    const method = form.method;

    fetch(url, {
        method: method,
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Handle success
            if (data.message) {
                showAlert('success', data.message);
            }
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } else {
            // Handle error
            showAlert('danger', data.message || 'An error occurred');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('danger', 'An error occurred while processing your request');
    });
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    // Remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function initializeComponents() {
    // Initialize any interactive components like dropdowns, modals, etc.
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function() {
            this.nextElementSibling.classList.toggle('show');
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.matches('.dropdown-toggle')) {
            const dropdowns = document.querySelectorAll('.dropdown-content.show');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
}
