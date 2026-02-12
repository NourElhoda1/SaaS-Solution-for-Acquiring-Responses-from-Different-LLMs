import React, { useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import QueryForm from '../components/QueryForm';
import ResponseCard from '../components/ResponseCard';
import { useSubmitQuery, useRateResponse } from '../hooks/useApi';
import { QueryResponse, QueryRequest } from '../services/api';

const ComparePage: React.FC = () => {
  const [currentResult, setCurrentResult] = useState<QueryResponse | null>(null);
  const submitQuery = useSubmitQuery();
  const rateResponse = useRateResponse();

  const handleSubmitQuery = async (queryRequest: QueryRequest) => {
    try {
      const result = await submitQuery.mutateAsync(queryRequest);
      setCurrentResult(result);
      // Scroll vers les résultats
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Une erreur est survenue lors de la soumission de votre requête.');
    }
  };

  const handleRateResponse = async (modelName: string, rating: number, feedback?: string) => {
    if (!currentResult) return;
    
    try {
      await rateResponse.mutateAsync({
        query_id: currentResult.query_id,
        response_model: modelName,
        rating,
        feedback,
      });
      alert('Évaluation enregistrée avec succès !');
    } catch (error) {
      console.error('Error rating response:', error);
      alert('Une erreur est survenue lors de l\'enregistrement de votre évaluation.');
    }
  };

  const successfulResponses = currentResult?.responses.filter(r => r.success) || [];
  const failedResponses = currentResult?.responses.filter(r => !r.success) || [];
  const fastestResponse = successfulResponses.reduce((prev, current) =>
    current.response_time < prev.response_time ? current : prev
  , successfulResponses[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LLM Comparison</h1>
                <p className="text-sm text-gray-600">Comparez les réponses des meilleures IA</p>
              </div>
            </div>
            <a
              href="/stats"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <TrendingUp className="w-5 h-5" />
              Statistiques
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Query Form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Posez votre question
          </h2>
          <QueryForm
            onSubmit={handleSubmitQuery}
            isLoading={submitQuery.isPending}
          />
        </div>

        {/* Loading State */}
        {submitQuery.isPending && (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Interrogation des modèles en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
          </div>
        )}

        {/* Results */}
        {currentResult && !submitQuery.isPending && (
          <div id="results" className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Résultats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Question</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {currentResult.prompt.substring(0, 50)}
                    {currentResult.prompt.length > 50 ? '...' : ''}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Modèles comparés</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {currentResult.responses.length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Temps total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {currentResult.total_response_time.toFixed(2)}s
                  </p>
                </div>
              </div>

              {fastestResponse && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    🏆 <strong>Réponse la plus rapide:</strong> {fastestResponse.model_name} 
                    ({fastestResponse.response_time.toFixed(2)}s)
                  </p>
                </div>
              )}
            </div>

            {/* Successful Responses */}
            {successfulResponses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Réponses des modèles ({successfulResponses.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {successfulResponses.map((response) => (
                    <ResponseCard
                      key={response.model_name}
                      response={response}
                      onRate={(rating, feedback) => 
                        handleRateResponse(response.model_name, rating, feedback)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Failed Responses */}
            {failedResponses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-4">
                  Échecs ({failedResponses.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {failedResponses.map((response) => (
                    <ResponseCard
                      key={response.model_name}
                      response={response}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!currentResult && !submitQuery.isPending && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Prêt à comparer ?
            </h3>
            <p className="text-gray-600">
              Posez une question ci-dessus et voyez comment différents modèles d'IA y répondent
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComparePage;
