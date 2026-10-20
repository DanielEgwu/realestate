// Property Details Page Script

async function loadPropertyDetails() {
  try {
    const propertyId = getQueryParam('id');
    if (!propertyId) {
      showNotification('Property not found', 'danger');
      return;
    }
    
    const property = await api.get(`/properties/${propertyId}`);
    renderPropertyDetails(property);
  } catch (error) {
    showNotification('Failed to load property details: ' + error.message, 'danger');
  }
}

function renderPropertyDetails(property) {
  const container = document.getElementById('propertyDetailsContainer');
  
  if (!container) return;
  
  const imagesHtml = property.images && property.images.length > 0
    ? `<div class="property-gallery">
         <div class="gallery-main">
           <img src="${property.images[0].image_url}" alt="${property.title}">
         </div>
       </div>`
    : `<div style="background-color: #e0e0e0; height: 400px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
        <span style="color: #999;">No Images Available</span>
       </div>`;
  
  const videosHtml = property.videos && property.videos.length > 0
    ? `<div class="mt-lg">
         <h3>Property Video</h3>
         <video width="100%" controls style="border-radius: 8px;">
           <source src="${property.videos[0].video_url}" type="video/mp4">
           Your browser does not support the video tag.
         </video>
       </div>`
    : '';
  
  container.innerHTML = `
    <div class="breadcrumb mb-lg">
      <a href="properties.html">Properties</a>
      <span>/</span>
      <span class="active">${property.title}</span>
    </div>
    
    ${imagesHtml}
    ${videosHtml}
    
    <div class="row-2 mt-xl">
      <div>
        <h1>${property.title}</h1>
        <p class="text-secondary mb-lg">${property.location}</p>
        
        <div class="card mb-lg">
          <div class="card-body">
            <p class="text-secondary">Price</p>
            <h2 class="text-primary mb-0">${formatCurrency(property.price)}</h2>
          </div>
        </div>
        
        <h3 class="mt-lg">Property Information</h3>
        <ul class="mb-lg">
          <li><strong>Type:</strong> ${property.property_type}</li>
          ${property.size ? `<li><strong>Size:</strong> ${property.size} sqm</li>` : ''}
          <li><strong>Status:</strong> <span class="badge badge-success">${property.status}</span></li>
          ${property.documentation_status ? `<li><strong>Documentation:</strong> ${property.documentation_status}</li>` : ''}
          <li><strong>Listed:</strong> ${formatDate(property.created_at)}</li>
        </ul>
      </div>
      
      <div class="card" style="height: fit-content;">
        <div class="card-header">Interested in this property?</div>
        <div class="card-body">
          <p>Our acquisition team can help you evaluate this opportunity and coordinate the next steps.</p>
          
          <div class="mt-lg">
            <a href="acquisition.html?propertyId=${property.id}" class="btn btn-primary" style="width: 100%; text-align: center; display: block; margin-bottom: 0.5rem;">Request Information</a>
            <a href="${getWhatsAppLink(process.env.COMPANY_PHONE_1 || '+2348100650205', 'I am interested in: ' + property.title)}" class="btn btn-gold" style="width: 100%; text-align: center; display: block;">WhatsApp Us</a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-xl">
      <h3>Description</h3>
      <p>${property.description}</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadPropertyDetails);
