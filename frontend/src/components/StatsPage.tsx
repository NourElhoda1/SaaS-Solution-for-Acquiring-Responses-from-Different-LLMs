import React from 'react';
import { ArrowLeft, TrendingUp, Clock, Star, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStatistics } from '../hooks/useApi';

const StatsPage: React.FC = () => {
  const { data: stats, isLoading, error } = useStatistics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    );
  }

  const getModelShortName = (fullName: string) => {
    const parts = fullName.split('/');
    return parts[parts.length - 1].split('-').slice(0, 3).join(' ');
  };

  const chartData = stats?.map(stat => ({
    name: getModelShortName(stat.model_name),
    'Note moyenne': stat.average_rating,
    'Temps (s)': stat.average_response_time,
    'Succès (%)': stat.success_rate,
  })) || [];

  const topRatedModel = stats?.reduce((prev, current) =>
    current.average_rating > prev.average_rating ? current : prev
  );

  const fastestModel = stats?.reduce((prev, current) =>
    current.average_response_time < prev.average_response_time ? current : prev
  );

  const mostUsedModel = stats?.reduce((prev, current) =>
    current.total_queries > prev.total_queries ? current : prev
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
              <p className="text-sm text-gray-600">Performance des modèles d'IA</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topRatedModel && (
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
              <div className="flex items-start justify-between mb-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <span className="badge badge-success">Top</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Meilleure note</h3>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {getModelShortName(topRatedModel.model_name)}
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                ⭐ {topRatedModel.average_rating.toFixed(2)}/5
              </p>
            </div>
          )}

          {fastestModel && (
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <span className="badge badge-info">Rapide</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Plus rapide</h3>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {getModelShortName(fastestModel.model_name)}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                ⚡ {fastestModel.average_response_time.toFixed(2)}s
              </p>
            </div>
          )}

          {mostUsedModel && (
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="flex items-start justify-between mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="badge badge-success">Populaire</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Plus utilisé</h3>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {getModelShortName(mostUsedModel.model_name)}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {mostUsedModel.total_queries} requêtes
              </p>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes moyennes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Note moyenne" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Temps de réponse moyen</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Temps (s)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails par modèle</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modèle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requêtes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note moy.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temps moy.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux succès
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.map((stat) => (
                  <tr key={stat.model_name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.model_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total_queries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {stat.average_rating.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-sm text-gray-900">
                          {stat.average_response_time.toFixed(2)}s
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        stat.success_rate >= 95 ? 'badge-success' :
                        stat.success_rate >= 80 ? 'badge-info' : 'badge-error'
                      }`}>
                        {stat.success_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total_tokens_used.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatsPage;
