// import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComparePage from './components/ComparePage';
import StatsPage from './components/StatsPage';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<ComparePage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
