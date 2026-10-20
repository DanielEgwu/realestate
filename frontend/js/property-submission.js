async function handlePropertySubmission(e) {
    e.preventDefault();

    const form = document.getElementById('propertySubmissionForm');

    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');

    try {
        const formData = new FormData();

        formData.append('title', document.getElementById('propertyTitle').value.trim());
        formData.append('location', document.getElementById('propertyLocation').value.trim());
        formData.append('askingPrice', document.getElementById('askingPrice').value);
        formData.append('propertyType', document.getElementById('propertyType').value);
        formData.append('size', document.getElementById('propertySize').value);
        formData.append('description', document.getElementById('propertyDescription').value.trim());
        formData.append('keyFeatures', document.getElementById('keyFeatures').value.trim());
        formData.append('documentationStatus', document.getElementById('documentationStatus').value);
        formData.append('documentationDetails', document.getElementById('documentationDetails').value.trim());
        formData.append('submitterName', document.getElementById('submitterName').value.trim());
        formData.append('submitterPhone', document.getElementById('submitterPhone').value.trim());
        formData.append('submitterEmail', document.getElementById('submitterEmail').value.trim());
        formData.append('submitterRole', document.getElementById('submitterRole').value);
        formData.append('companyName', document.getElementById('companyName').value.trim());
        formData.append('expectedCommission', document.getElementById('expectedCommission').value);
        formData.append('referralArrangement', document.getElementById('referralArrangement').value.trim());

        const photoInput = document.getElementById('propertyPhotos');

        if (photoInput) {
            for (const file of photoInput.files) {
                formData.append('propertyPhotos', file);
            }
        }

        const videoInput = document.getElementById('propertyVideo');

        if (videoInput && videoInput.files.length > 0) {
            formData.append('propertyVideo', videoInput.files[0]);
        }

        const documentInput = document.getElementById('propertyDocuments');

        if (documentInput) {
            for (const file of documentInput.files) {
                formData.append('propertyDocuments', file);
            }
        }

        if (
            !formData.get('title') ||
            !formData.get('location') ||
            !formData.get('askingPrice') ||
            !formData.get('propertyType') ||
            !formData.get('submitterName') ||
            !formData.get('submitterPhone') ||
            !formData.get('submitterEmail')
        ) {
            showNotification('Please fill in all required fields.', 'warning');
            return;
        }

        if (!isValidEmail(formData.get('submitterEmail'))) {
            showNotification('Please enter a valid email address.', 'warning');
            return;
        }

        if (!isValidPhone(formData.get('submitterPhone'))) {
            showNotification('Please enter a valid phone number.', 'warning');
            return;
        }

        setLoading(submitBtn);

        const response = await api.upload('/submissions', formData);

        showNotification(
            response.message || 'Property submission received successfully.',
            'success'
        );

        form.reset();

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error('Property submission error:', error);

        showNotification(
            'Submission failed: ' + (error.message || 'Please try again.'),
            'danger'
        );

    } finally {
        setLoading(submitBtn, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('propertySubmissionForm');

    if (form) {
        form.addEventListener('submit', handlePropertySubmission);
    }
});