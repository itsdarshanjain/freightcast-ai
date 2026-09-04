// API base URL — uses Vite proxy in dev, relative path in production
const API = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
export default API;
