import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        await api.login(email, password); // ou api.register
        navigate('/');
        } catch (err: any) {
        // 1. On récupère le détail de l'erreur
        const detail = err.response?.data?.detail;

        // 2. Si c'est une erreur de validation Pydantic (Tableau d'objets)
        if (Array.isArray(detail)) {
            setError(detail[0].msg); 
        } 
        // 3. Si c'est une erreur d'authentification (401) ou personnalisée (Simple String)
        else if (typeof detail === 'string') {
            setError(detail);
        } 
        // 4. Cas de secours
        else {
            setError("Une erreur de connexion est survenue.");
        }
        } finally {
        setLoading(false);
        }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Connexion</h2>
        
        {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
          {typeof error === 'string' ? error : 'Erreur de connexion'}
        </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Adresse Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
        
        <p className="text-center text-sm text-gray-600">
          Pas de compte ? <Link to="/register" className="text-indigo-600 hover:text-indigo-500">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;