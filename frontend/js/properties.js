// Properties Page Script

let currentFilters = {
  type: '',
  location: '',
  minPrice: '',
  maxPrice: '',
  search: '',
  limit: 12,
  offset: 0
};

// Load properties from API
async function loadProperties() {
  try {
    showLoading();
    const params = new URLSearchParams();
    
    if (currentFilters.type) params.append('type', currentFilters.type);
    if (currentFilters.location) params.append('location', currentFilters.location);
    if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.search) params.append('search', currentFilters.search);
    params.append('limit', currentFilters.limit);
    params.append('offset', currentFilters.offset);
    
    const data = await api.get(`/properties?${params.toString()}`);
    renderProperties(data.properties);
    updatePagination(data.total, data.limit, data.offset);
  } catch (error) {
    showNotification('Failed to load properties: ' + error.message, 'danger');
  } finally {
    hideLoading();
  }
}

// Render properties in grid
function renderProperties(properties) {
  const container = document.getElementById('propertiesGrid');
  
  if (!properties || properties.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📭</div>
        <h3>No Properties Found</h3>
        <p>Try adjusting your filters or search criteria</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = properties.map(property => `
    <div class="card">
      <div class="card-image" style="background-color: #e0e0e0; display: flex; align-items: center; justify-content: center;">
        <span style="color: #999;">No Image</span>
      </div>
      <div class="card-header">${property.title}</div>
      <div class="card-body">
        <p><strong>Location:</strong> ${property.location}</p>
        <p><strong>Type:</strong> <span class="badge badge-primary">${property.property_type}</span></p>
        <p><strong>Price:</strong> <span class="font-weight-bold text-primary">${formatCurrency(property.price)}</span></p>
        ${property.size ? `<p><strong>Size:</strong> ${property.size} sqm</p>` : ''}
        <p class="text-secondary" style="font-size: 0.9rem;">${property.description?.substring(0, 100)}...</p>
      </div>
      <div class="card-footer">
        <a href="property-details.html?id=${property.id}" class="btn btn-primary">View Details</a>
      </div>
    </div>
  `).join('');
}

// Update pagination controls
function updatePagination(total, limit, offset) {
  const container = document.getElementById('pagination');
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  let html = '';
  
  if (currentPage > 1) {
    html += `<button class="btn btn-outline" onclick="previousPage()">← Previous</button>`;
  }
  
  html += `<span style="padding: 0.5rem 1rem; display: flex; align-items: center;">Page ${currentPage} of ${totalPages}</span>`;
  
  if (currentPage < totalPages) {
    html += `<button class="btn btn-outline" onclick="nextPage()">Next →</button>`;
  }
  
  container.innerHTML = html || '';
}

// Pagination controls
function nextPage() {
  currentFilters.offset += currentFilters.limit;
  loadProperties();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function previousPage() {
  currentFilters.offset = Math.max(0, currentFilters.offset - currentFilters.limit);
  loadProperties();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Apply filters
function applyFilters() {
  currentFilters.offset = 0;
  loadProperties();
}

// Search with debounce
const handleSearch = debounce(() => {
  currentFilters.search = document.getElementById('searchInput')?.value || '';
  applyFilters();
}, 500);

// Show/hide loading state
function showLoading() {
  const container = document.getElementById('propertiesGrid');
  if (container) {
    container.innerHTML = '<div class="spinner" style="margin: 2rem auto; grid-column: 1 / -1;"></div>';
  }
}

function hideLoading() {
  // Loading state will be replaced by actual content
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProperties();
  
  // Setup filter listeners
  const typeSelect = document.getElementById('propertyType');
  const locationInput = document.getElementById('location');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const searchInput = document.getElementById('searchInput');
  const filterBtn = document.getElementById('filterBtn');
  
  if (typeSelect) typeSelect.addEventListener('change', (e) => { currentFilters.type = e.target.value; applyFilters(); });
  if (locationInput) locationInput.addEventListener('input', (e) => { currentFilters.location = e.target.value; applyFilters(); });
  if (minPriceInput) minPriceInput.addEventListener('change', (e) => { currentFilters.minPrice = e.target.value; applyFilters(); });
  if (maxPriceInput) maxPriceInput.addEventListener('change', (e) => { currentFilters.maxPrice = e.target.value; applyFilters(); });
  if (searchInput) searchInput.addEventListener('input', handleSearch);
  if (filterBtn) filterBtn.addEventListener('click', applyFilters);
});
