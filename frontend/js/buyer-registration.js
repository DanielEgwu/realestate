// Buyer Registration Form Script

async function handleBuyerRegistration(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    preferredLocations: document.getElementById('preferredLocations').value,
    budget: document.getElementById('budget').value,
    purchasePurpose: document.getElementById('purchasePurpose').value,
    timeline: document.getElementById('timeline').value,
    financingStatus: document.getElementById('financingStatus').value,
    preferredPropertyType: document.getElementById('preferredPropertyType').value
  };
  
  // Validation
  if (!formData.name || !formData.phone || !formData.email || !formData.budget) {
    showNotification('Please fill in all required fields', 'warning');
    return;
  }
  
  if (!isValidEmail(formData.email)) {
    showNotification('Please enter a valid email address', 'warning');
    return;
  }
  
  if (!isValidPhone(formData.phone)) {
    showNotification('Please enter a valid phone number', 'warning');
    return;
  }
  
  try {
    const submitBtn = document.querySelector('button[type="submit"]');
    setLoading(submitBtn);
    
    const response = await api.post('/buyers', formData);
    
    showNotification(response.message, 'success');
    document.getElementById('buyerRegistrationForm').reset();
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  } catch (error) {
    showNotification('Registration failed: ' + error.message, 'danger');
  } finally {
    setLoading(document.querySelector('button[type="submit"]'), false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('buyerRegistrationForm');
  if (form) {
    form.addEventListener('submit', handleBuyerRegistration);
  }
});
