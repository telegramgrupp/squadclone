import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCoins } from '@/hooks/useCoins';
import { Package, Coins, AlertCircle } from 'lucide-react';

interface CoinPackage {
  id: number;
  name: string;
  coins: number;
  price: number;
  description?: string;
}

export default function CoinStore() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { coins, fetchCoins } = useCoins({ userId: 'test-user' });

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/coin-packages');
        setPackages(response.data);
      } catch (err) {
        setError('Failed to load coin packages');
        // Fallback data for development
        setPackages([
          { id: 1, name: 'Starter Pack', coins: 20, price: 1.99, description: 'Perfect for beginners' },
          { id: 2, name: 'Popular Pack', coins: 50, price: 4.99, description: 'Most popular choice' },
          { id: 3, name: 'Premium Pack', coins: 100, price: 9.99, description: 'Best value for money' },
          { id: 4, name: 'Ultimate Pack', coins: 200, price: 19.99, description: 'For power users' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
    fetchCoins();
  }, [fetchCoins]);

  const handlePurchase = async (packageId: number) => {
    // TODO: Integrate with payment system
    console.log('Purchasing package:', packageId);
    // Mock success notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg';
    toast.textContent = 'Purchase successful! (Demo)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Buy Coins</h1>
          <p className="text-gray-400 text-lg">
            Get more coins to unlock premium features
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-800 px-6 py-3 rounded-full">
            <Coins className="text-yellow-400" />
            <span className="text-white font-semibold">Current Balance: {coins} coins</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3 text-red-500">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-gray-800 rounded-xl p-6 flex flex-col hover:transform hover:scale-105 transition-transform duration-300"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <Package className="w-8 h-8 text-blue-500" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">
                {pkg.name}
              </h3>
              
              {pkg.description && (
                <p className="text-gray-400 text-sm mb-4">
                  {pkg.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-bold text-white">
                  {pkg.coins}
                </span>
                <span className="text-yellow-400">🪙</span>
              </div>
              
              <div className="mt-auto">
                <div className="text-lg font-semibold text-white mb-4">
                  ${pkg.price.toFixed(2)}
                </div>
                
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 transition-colors duration-200"
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Integration Note */}
        <div className="mt-12 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Payment Methods
          </h2>
          <p className="text-gray-400">
            We accept various payment methods including credit cards and PayPal.
            All transactions are secure and encrypted.
          </p>
          {/* TODO: Add payment method icons and integration */}
        </div>
      </div>
    </div>
  );
}