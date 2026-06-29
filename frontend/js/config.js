// Centralized API base URL for production
// Update this value if backend URL changes
window.API_BASE_URL = "https://vams-vnbr.onrender.com";
// Backwards-compatible global used by existing code
window.BASE_URL = window.API_BASE_URL;

export default window.API_BASE_URL;
