import { useEffect } from 'react';
import { useCoins } from '@/hooks/useCoins';

interface CoinBarProps {
  userId: string;
  onExtendTime: () => void;
}

export const CoinBar = ({ userId, onExtendTime }: CoinBarProps) => {
  const { coins, error, loading, fetchCoins, useCoins } = useCoins({ userId });

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const handleExtendTime = async () => {
    const success = await useCoins(2); // Use 2 coins to extend time
    if (success) {
      onExtendTime();
    }
  };

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4">
      <div className="flex items-center gap-2 bg-gray-800/80 rounded-full px-4 py-2 backdrop-blur-sm">
        <span className="text-yellow-400">🪙</span>
        <span className="font-medium text-white">
          {loading ? '...' : coins}
        </span>
      </div>
      
      <button
        onClick={handleExtendTime}
        disabled={loading || coins < 2}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full px-4 py-2 text-white transition-colors"
      >
        <span>+15s</span>
        <span className="text-sm opacity-75">(-2 🪙)</span>
      </button>

      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};