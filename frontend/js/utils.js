// Utility Functions

// Show notification message
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type}`;
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.style.maxWidth = '400px';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(value);
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Validate email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone
function isValidPhone(phone) {
  const regex = /^[\d\s\-\+\(\)]+$/;
  return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Get query parameter from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Debounce function
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

// Show loading state on element
function setLoading(element, loading = true) {
  if (loading) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.innerHTML = '<span class="spinner"></span> Loading...';
  } else {
    element.disabled = false;
    element.textContent = element.dataset.originalText || 'Submit';
  }
}

// Logout function
function logout() {
  storage.removeToken();
  window.location.href = '/admin-login.html';
}

// Check authentication
async function checkAuth() {
  if (!storage.isAdmin()) {
    return false;
  }
  
  try {
    await api.get('/auth/verify');
    return true;
  } catch (error) {
    storage.removeToken();
    return false;
  }
}

// Redirect to login if not authenticated
async function requireAuth() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    window.location.href = '/admin-login.html';
  }
}

// Format phone number for WhatsApp
function getWhatsAppLink(phone, message = '') {
  const cleanPhone = phone.replace(/\D/g, '');
  let whatsappPhone;
  
  if (cleanPhone.startsWith('234')) {
    whatsappPhone = cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    whatsappPhone = '234' + cleanPhone.substring(1);
  } else {
    whatsappPhone = '234' + cleanPhone;
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${whatsappPhone}${message ? `?text=${encodedMessage}` : ''}`;
}
