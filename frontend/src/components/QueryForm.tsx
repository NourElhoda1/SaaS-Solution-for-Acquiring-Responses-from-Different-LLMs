import React, { useState } from 'react';
import { Send, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { QueryRequest } from '../services/api';

// Définition des catégories et de leurs modèles associés

const MODEL_CATEGORIES = [
  {
    name: "Raisonnement & Analyse (Thinking)",
    models: [
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', provider: 'DeepSeek', cost: 'Gratuit' },
      { id: 'stepfun/step-3-5-flash:free', name: 'Step 3.5 Flash', provider: 'StepFun', cost: 'Gratuit' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', provider: 'Google', cost: 'Gratuit' },
    ]
  },
  {
    name: "Code & Développement Technique",
    models: [
      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder', provider: 'Alibaba', cost: 'Gratuit' },
      { id: 'mistralai/devstral-2-2512:free', name: 'Devstral 2 Agent', provider: 'Mistral', cost: 'Gratuit' },
      { id: 'arcee-ai/trinity-large-preview:free', name: 'Trinity Large', provider: 'Arcee AI', cost: 'Gratuit' },
    ]
  },
  {
    name: "Frontières & Puissance (Large MoE)",
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'Meta', cost: 'Gratuit' },
      { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B', provider: 'OpenAI', cost: 'Gratuit' },
      { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi MiMo V2', provider: 'Xiaomi', cost: 'Gratuit' },
    ]
  },
  {
    name: "Rapidité & Mobilité",
    models: [
      { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', provider: 'Z.ai', cost: 'Gratuit' },
      { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', provider: 'Meta', cost: 'Gratuit' },
      { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini', provider: 'Microsoft', cost: 'Gratuit' },
    ]
  }
];

// Liste plate pour faciliter la sélection par défaut
const ALL_MODELS = MODEL_CATEGORIES.flatMap(cat => cat.models);

interface QueryFormProps {
  onSubmit: (query: QueryRequest) => void;
  isLoading: boolean;
}

const QueryForm: React.FC<QueryFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(ALL_MODELS.map(m => m.id));
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && selectedModels.length > 0) {
      onSubmit({
        prompt: prompt.trim(),
        models: selectedModels as any, // Cast selon votre Enum si nécessaire
        temperature,
        max_tokens: maxTokens,
      });
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  };

  // Fonction pour sélectionner/désélectionner toute une catégorie
  const toggleCategory = (modelIds: string[]) => {
    const allSelected = modelIds.every(id => selectedModels.includes(id));
    if (allSelected) {
      setSelectedModels(prev => prev.filter(id => !modelIds.includes(id)));
    } else {
      setSelectedModels(prev => [...new Set([...prev, ...modelIds])]);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre question</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="textarea w-full"
            rows={4}
            disabled={isLoading}
            placeholder="Ex: Expliquez le fonctionnement des Multi-Agent Systems..."
          />
        </div>

        {/* Sélection par Catégories */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Choisir les IA par rôle ({selectedModels.length} sélectionnés)
          </label>
          
          {MODEL_CATEGORIES.map((category) => {
            const categoryIds = category.models.map(m => m.id);
            const isAllCategorySelected = categoryIds.every(id => selectedModels.includes(id));

            return (
              <div key={category.name} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">
                    {category.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryIds)}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    {isAllCategorySelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.models.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => !isLoading && toggleModel(model.id)}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between
                        ${selectedModels.includes(model.id) ? 'border-indigo-500 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-70'}
                      `}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{model.name}</p>
                        <p className="text-[10px] text-gray-500">{model.provider}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-indigo-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Paramètres avancés */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
          >
            {showAdvanced ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            Paramètres avancés (Temperature, Tokens)
          </button>
          
          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white border border-gray-100 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Température : {temperature}</label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={temperature} 
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Tokens : {maxTokens}</label>
                <input 
                  type="range" min="256" max="4096" step="256" 
                  value={maxTokens} 
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim() || selectedModels.length === 0}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-indigo-200"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          {isLoading ? 'Analyse en cours...' : 'Comparer les modèles'}
        </button>
      </form>
    </div>
  );
};

export default QueryForm;