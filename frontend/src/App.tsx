import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComparePage from './components/ComparePage';
import StatsPage from './components/StatsPage';
import Login from './components/Login';
import Register from './components/Register';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Composant pour protéger les routes
// Vérifie la présence du token dans le localStorage
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes Protégées */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <ComparePage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/stats" 
            element={
              <PrivateRoute>
                <StatsPage />
              </PrivateRoute>
            } 
          />

          {/* Redirection par défaut si la route n'existe pas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;