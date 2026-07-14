// Global Configuration for Frontend
// Automatically detect if running locally or in production

window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'admin.localhost'
  ? 'http://localhost:3000'
  : 'https://api.vellprint.in';
