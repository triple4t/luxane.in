import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useWishlist = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await api.getWishlist();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.addToWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: 'Added to wishlist',
        description: 'Product has been added to your wishlist',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add to wishlist',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.removeFromWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: 'Removed from wishlist',
        description: 'Product has been removed from your wishlist',
      });
    },
  });

  const isWishlisted = (productId: string) => {
    return wishlist.some((item: any) => item.productId === productId);
  };

  return {
    wishlist,
    isLoading,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isWishlisted,
  };
};

