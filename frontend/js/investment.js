// Investment Opportunities Form Script

async function handleInvestmentSubmission(e) {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('opportunityTitle').value,
    location: document.getElementById('opportunityLocation').value,
    description: document.getElementById('opportunityDescription').value,
    opportunityType: document.getElementById('opportunityType').value,
    expectedReturn: document.getElementById('expectedReturn').value,
    investmentAmount: document.getElementById('investmentAmount').value,
    submitterName: document.getElementById('submitterName').value,
    submitterEmail: document.getElementById('submitterEmail').value,
    submitterPhone: document.getElementById('submitterPhone').value
  };
  
  // Validation
  if (!formData.title || !formData.location || !formData.description || !formData.opportunityType) {
    showNotification('Please fill in all required fields', 'warning');
    return;
  }
  
  if (!isValidEmail(formData.submitterEmail)) {
    showNotification('Please enter a valid email address', 'warning');
    return;
  }
  
  if (!isValidPhone(formData.submitterPhone)) {
    showNotification('Please enter a valid phone number', 'warning');
    return;
  }
  
  try {
    const submitBtn = document.querySelector('button[type="submit"]');
    setLoading(submitBtn);
    
    const response = await api.post('/investments', formData);
    
    showNotification(response.message, 'success');
    document.getElementById('investmentForm').reset();
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  } catch (error) {
    showNotification('Submission failed: ' + error.message, 'danger');
  } finally {
    setLoading(document.querySelector('button[type="submit"]'), false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('investmentForm');
  if (form) {
    form.addEventListener('submit', handleInvestmentSubmission);
  }
});
