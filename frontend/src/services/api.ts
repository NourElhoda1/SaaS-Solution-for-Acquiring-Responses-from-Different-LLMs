import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface QueryRequest {
  prompt: string;
  models: string[];
  temperature?: number;
  max_tokens?: number;
  user_id?: string;
}

export interface LLMResponse {
  model_name: string;
  content: string;
  tokens_used?: number;
  response_time: number;
  error?: string;
  success: boolean;
}

export interface QueryResponse {
  query_id: string;
  prompt: string;
  responses: LLMResponse[];
  created_at: string;
  total_response_time: number;
}

export interface RatingRequest {
  query_id: string;
  response_model: string;
  rating: number;
  feedback?: string;
  user_id?: string;
}

export interface HistoryQuery {
  query_id: string;
  prompt: string;
  models_used: string[];
  created_at: string;
  has_ratings: boolean;
}

export interface ModelStats {
  model_name: string;
  total_queries: number;
  average_rating: number;
  average_response_time: number;
  success_rate: number;
  total_tokens_used: number;
}

// API Functions
export const api = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Submit a query to multiple LLMs
  submitQuery: async (queryRequest: QueryRequest): Promise<QueryResponse> => {
    const response = await apiClient.post('/api/query', queryRequest);
    return response.data;
  },

  // Get query details
  getQueryDetails: async (queryId: string): Promise<QueryResponse> => {
    const response = await apiClient.get(`/api/query/${queryId}`);
    return response.data;
  },

  // Rate a response
  rateResponse: async (rating: RatingRequest) => {
    const response = await apiClient.post('/api/rate', rating);
    return response.data;
  },

  // Get query history
  getHistory: async (limit: number = 50, userId?: string): Promise<HistoryQuery[]> => {
    const params: any = { limit };
    if (userId) params.user_id = userId;
    const response = await apiClient.get('/api/history', { params });
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<ModelStats[]> => {
    const response = await apiClient.get('/api/stats');
    return response.data;
  },

  // Get available models
  getAvailableModels: async () => {
    const response = await apiClient.get('/api/models');
    return response.data;
  },
};

export default api;
