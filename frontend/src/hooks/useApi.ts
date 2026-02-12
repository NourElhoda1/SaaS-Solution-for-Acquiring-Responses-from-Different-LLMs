import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, QueryRequest, RatingRequest } from '../services/api';

// Hook pour soumettre une requête
export const useSubmitQuery = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queryRequest: QueryRequest) => api.submitQuery(queryRequest),
    onSuccess: () => {
      // Invalider l'historique pour le rafraîchir
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
};

// Hook pour obtenir les détails d'une requête
export const useQueryDetails = (queryId: string | null) => {
  return useQuery({
    queryKey: ['query', queryId],
    queryFn: () => api.getQueryDetails(queryId!),
    enabled: !!queryId,
  });
};

// Hook pour noter une réponse
export const useRateResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rating: RatingRequest) => api.rateResponse(rating),
    onSuccess: (_, variables) => {
      // Invalider la requête pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['query', variables.query_id] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
};

// Hook pour obtenir l'historique
export const useHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ['history', limit],
    queryFn: () => api.getHistory(limit),
  });
};

// Hook pour obtenir les statistiques
export const useStatistics = () => {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.getStatistics(),
  });
};

// Hook pour vérifier la santé de l'API
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    refetchInterval: 60000, // Vérifier toutes les 60 secondes
  });
};
