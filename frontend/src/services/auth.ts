import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth';

export const authService = {
  // Inscription
  register: async (username: string, email: string, password: string) => {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password
    });
    return response.data;
  },

  // Connexion
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    // Stocker le token dans le localStorage pour les prochaines requêtes
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
  }
};