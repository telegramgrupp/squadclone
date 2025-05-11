import { useState, useCallback } from 'react';
import axios from 'axios';

interface UseCoinsProps {
  userId: string;
}

export const useCoins = ({ userId }: UseCoinsProps) => {
  const [coins, setCoins] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/coins/user/${userId}/coins`);
      setCoins(response.data.coins);
      setError(null);
    } catch (err) {
      setError('Failed to fetch coins');
      console.error('Error fetching coins:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const useCoins = useCallback(async (amount: number) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/coins/user/${userId}/use-coins`, {
        amount
      });
      setCoins(response.data.coins);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to use coins');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    coins,
    error,
    loading,
    fetchCoins,
    useCoins
  };
};