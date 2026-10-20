// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// API Helper Functions
const api = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  },

  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(data)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  },

  async upload(endpoint, formData) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders()
        },
        body: formData
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API UPLOAD error:', error);
      throw error;
    }
  },

  async patch(endpoint, data = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(data)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API PATCH error:', error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  },

  getAuthHeaders() {
    const token = localStorage.getItem('authToken');

    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }

    return {};
  },

  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (_) {
        // Response wasn't JSON
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  }
};

// Storage Helper
const storage = {
  setToken(token) {
    localStorage.setItem('authToken', token);
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  removeToken() {
    localStorage.removeItem('authToken');
  },

  isAdmin() {
    return !!this.getToken();
  }
};