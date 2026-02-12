import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { QueryRequest } from '../services/api';

interface QueryFormProps {
  onSubmit: (query: QueryRequest) => void;
  isLoading: boolean;
}

const AVAILABLE_MODELS = [
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Gemini 2.0 Flash', 
    provider: 'Google', 
    cost: 'Gratuit' 
  },
  { 
    id: 'meta-llama/llama-3.2-3b-instruct:free', 
    name: 'Llama 3.2 3B', 
    provider: 'Meta', 
    cost: 'Gratuit' 
  },
  { 
    id: 'deepseek/deepseek-r1:free', 
    name: 'DeepSeek R1', 
    provider: 'DeepSeek', 
    cost: 'Gratuit' 
  },
  { 
    id: 'mistralai/mistral-7b-instruct:free', 
    name: 'Mistral 7B', 
    provider: 'Mistral', 
    cost: 'Gratuit' 
  },
  { 
    id: 'qwen/qwen-2.5-coder-32b-instruct:free', 
    name: 'Qwen 2.5 Coder', 
    provider: 'Alibaba', 
    cost: 'Gratuit' 
  },
  { 
    id: 'microsoft/phi-3-mini-128k-instruct:free', 
    name: 'Phi-3 Mini', 
    provider: 'Microsoft', 
    cost: 'Gratuit' 
  },
];

const QueryForm: React.FC<QueryFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  
  // Sélectionnez tous les modèles par défaut
  const [selectedModels, setSelectedModels] = useState<string[]>(
    AVAILABLE_MODELS.map(m => m.id)
  );
  
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && selectedModels.length > 0) {
      onSubmit({
        prompt: prompt.trim(),
        models: selectedModels,
        temperature,
        max_tokens: maxTokens,
      });
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleQuickQuestion = (question: string) => {
    setPrompt(question);
  };

  const quickQuestions = [
    "Qu'est-ce que l'intelligence artificielle ?",
    "Explique-moi la photosynthèse en termes simples",
    "Écris un poème court sur la nature",
    "Donne-moi 5 idées de projets Python pour débutants",
  ];

 return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Textarea pour la question */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Votre question ou demande
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Posez votre question ici..."
            className="textarea"
            rows={5}
            disabled={isLoading}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {quickQuestions.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection des modèles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sélectionnez les modèles à comparer ({selectedModels.length} sélectionnés)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.id}
                onClick={() => !isLoading && toggleModel(model.id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedModels.includes(model.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{model.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{model.provider}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.id)}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="mt-2">
                  <span className={`
                    text-xs px-2 py-1 rounded-full
                    ${model.cost === 'Très faible' ? 'bg-green-100 text-green-800' :
                      model.cost === 'Faible' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'}
                  `}>
                    Coût: {model.cost}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paramètres avancés */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            disabled={isLoading}
          >
            {showAdvanced ? '▼' : '▶'} Paramètres avancés
          </button>
          
          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Plus élevé = plus créatif, plus bas = plus déterministe
                </p>
              </div>
              
              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-2">
                  Tokens max: {maxTokens}
                </label>
                <input
                  type="range"
                  id="maxTokens"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Longueur maximale de la réponse
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim() || selectedModels.length === 0}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Comparer les réponses
              </>
            )}
          </button>
        </div>

        {selectedModels.length === 0 && (
          <p className="text-sm text-red-600 text-center">
            Veuillez sélectionner au moins un modèle
          </p>
        )}
      </form>
    </div>
  );
};

export default QueryForm;
