import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LLMResponse } from '../services/api';

interface ResponseCardProps {
  response: LLMResponse;
  onRate?: (rating: number, feedback?: string) => void;
  currentRating?: number;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ response, onRate, currentRating }) => {
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(currentRating || 0);
  const [feedback, setFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleRatingSubmit = () => {
    if (onRate && rating > 0) {
      onRate(rating, feedback.trim() || undefined);
      setShowRating(false);
      setFeedback('');
    }
  };

  const getModelDisplayName = (modelName: string) => {
    const parts = modelName.split('/');
    return parts[parts.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getProviderColor = (modelName: string) => {
    if (modelName.includes('anthropic')) return 'bg-purple-100 text-purple-800';
    if (modelName.includes('openai')) return 'bg-green-100 text-green-800';
    if (modelName.includes('google')) return 'bg-blue-100 text-blue-800';
    if (modelName.includes('meta')) return 'bg-indigo-100 text-indigo-800';
    if (modelName.includes('mistral')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`card slide-in ${!response.success ? 'border-2 border-red-200' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {getModelDisplayName(response.model_name)}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge ${getProviderColor(response.model_name)}`}>
              {response.model_name.split('/')[0]}
            </span>
            <span className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {response.response_time.toFixed(2)}s
            </span>
            {response.tokens_used && (
              <span className="text-sm text-gray-500">
                {response.tokens_used} tokens
              </span>
            )}
          </div>
        </div>
        
        {response.success ? (
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {response.success ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown className="markdown-content text-gray-700 leading-relaxed">
              {response.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Erreur:</strong> {response.error || 'Une erreur est survenue'}
            </p>
          </div>
        )}
      </div>

      {/* Rating Section */}
      {response.success && (
        <div className="border-t pt-4">
          {!showRating && !currentRating && (
            <button
              onClick={() => setShowRating(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Star className="w-4 h-4" />
              Évaluer cette réponse
            </button>
          )}

          {currentRating && !showRating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= currentRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">Votre note</span>
            </div>
          )}

          {showRating && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notez cette réponse
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredStar || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Qu'avez-vous pensé de cette réponse ?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRatingSubmit}
                  disabled={rating === 0}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Envoyer l'évaluation
                </button>
                <button
                  onClick={() => {
                    setShowRating(false);
                    setRating(currentRating || 0);
                    setFeedback('');
                  }}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponseCard;
