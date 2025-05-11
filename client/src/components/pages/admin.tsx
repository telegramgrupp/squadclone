import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as Tabs from '@radix-ui/react-tabs';
import { Trash2, Edit, RefreshCw, UserX, Shield, Package, History, Settings, Coins } from 'lucide-react';

// Types
interface Match {
  id: string;
  userId: string;
  matchedWith: string;
  isFake: boolean;
  startTime: string;
  videoPath?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  coins: number;
}

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  name: string;
}

interface CoinTransaction {
  id: number;
  userId: string;
  type: string;
  amount: number;
  createdAt: string;
}

interface CoinSettings {
  extendTime: number;
  viewProfile: number;
}

export default function AdminPanel() {
  // Authentication states
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data states
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [coinSettings, setCoinSettings] = useState<CoinSettings>({
    extendTime: 2,
    viewProfile: 5
  });
  
  // UI states
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = () => {
    if (password === '125899852105Ma') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'matches':
          const matchesResponse = await axios.get('/api/matches');
          setMatches(matchesResponse.data);
          break;
        case 'users':
          const usersResponse = await axios.get('/api/users');
          setUsers(usersResponse.data);
          break;
        case 'coin-packages':
          const packagesResponse = await axios.get('/api/coin-packages');
          setCoinPackages(packagesResponse.data);
          break;
        case 'transactions':
          const transactionsResponse = await axios.get('/api/coin-transactions');
          setTransactions(transactionsResponse.data);
          break;
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab, fetchData]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
        setSuccess('User deleted successfully');
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleUpdateCoinSettings = async (settings: CoinSettings) => {
    try {
      await axios.put('/api/coin-settings', settings);
      setCoinSettings(settings);
      setSuccess('Coin settings updated successfully');
    } catch (err) {
      setError('Failed to update coin settings');
    }
  };

  const handleAddCoinPackage = async (pkg: Omit<CoinPackage, 'id'>) => {
    try {
      const response = await axios.post('/api/coin-packages', pkg);
      setCoinPackages([...coinPackages, response.data]);
      setSuccess('Package added successfully');
    } catch (err) {
      setError('Failed to add package');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl">
          <h2 className="text-2xl text-white mb-4">Admin Login</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
          />
          <button
            onClick={handleLogin}
            className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 text-white"
          >
            Login
          </button>
          {error && (
            <div className="mt-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-white">Admin Panel</h1>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              className="p-2 bg-blue-600 rounded hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-600 rounded hover:bg-red-700 text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
            <Tabs.Trigger
              value="matches"
              className={`p-2 rounded ${
                activeTab === 'matches'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <History size={16} />
                Matches
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="users"
              className={`p-2 rounded ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield size={16} />
                Users
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="coin-settings"
              className={`p-2 rounded ${
                activeTab === 'coin-settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                Coin Settings
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="coin-packages"
              className={`p-2 rounded ${
                activeTab === 'coin-packages'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={16} />
                Coin Packages
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="transactions"
              className={`p-2 rounded ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins size={16} />
                Transactions
              </div>
            </Tabs.Trigger>
          </Tabs.List>

          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <>
                <Tabs.Content value="matches">
                  <h2 className="text-2xl text-white mb-4">Current Matches</h2>
                  {matches.length === 0 ? (
                    <p className="text-gray-400">No matches found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-white">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="p-2 text-left">User ID</th>
                            <th className="p-2 text-left">Matched With</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Start Time</th>
                            <th className="p-2 text-left">Recording</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matches.map((match) => (
                            <tr key={match.id} className="border-t border-gray-700">
                              <td className="p-2">{match.userId}</td>
                              <td className="p-2">{match.matchedWith}</td>
                              <td className="p-2">
                                <span
                                  className={`px-2 py-1 rounded ${
                                    match.isFake
                                      ? 'bg-yellow-600'
                                      : 'bg-green-600'
                                  }`}
                                >
                                  {match.isFake ? 'Fake' : 'Real'}
                                </span>
                              </td>
                              <td className="p-2">
                                {new Date(match.startTime).toLocaleString()}
                              </td>
                              <td className="p-2">
                                {match.videoPath ? (
                                  <a
                                    href={match.videoPath}
                                    className="text-blue-400 hover:text-blue-300"
                                    target="_blank"
                                  >
                                    Watch
                                  </a>
                                ) : (
                                  'Recording...'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Tabs.Content>

                <Tabs.Content value="users">
                  <h2 className="text-2xl text-white mb-4">Users</h2>
                  {users.length === 0 ? (
                    <p className="text-gray-400">No users found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-white">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="p-2 text-left">Username</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Coins</th>
                            <th className="p-2 text-left">Joined</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-t border-gray-700">
                              <td className="p-2">{user.username}</td>
                              <td className="p-2">{user.email}</td>
                              <td className="p-2">{user.coins} 🪙</td>
                              <td className="p-2">
                                {new Date(user.createdAt).toLocaleString()}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                    title="Delete User"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => {/* Handle ban */}}
                                    className="p-1 text-yellow-400 hover:text-yellow-300"
                                    title="Ban User"
                                  >
                                    <UserX size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Tabs.Content>

                <Tabs.Content value="coin-settings">
                  <h2 className="text-2xl text-white mb-4">Coin Settings</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-gray-300">Extend Time Cost</label>
                        <input
                          type="number"
                          value={coinSettings.extendTime}
                          onChange={(e) => setCoinSettings(prev => ({
                            ...prev,
                            extendTime: parseInt(e.target.value)
                          }))}
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-gray-300">View Profile Cost</label>
                        <input
                          type="number"
                          value={coinSettings.viewProfile}
                          onChange={(e) => setCoinSettings(prev => ({
                            ...prev,
                            viewProfile: parseInt(e.target.value)
                          }))}
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateCoinSettings(coinSettings)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Settings
                    </button>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="coin-packages">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl text-white">Coin Packages</h2>
                    <button
                      onClick={() => {/* Open add package modal */}}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Package
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Coins</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coinPackages.map((pkg) => (
                          <tr key={pkg.id} className="border-t border-gray-700">
                            <td className="p-2">{pkg.name}</td>
                            <td className="p-2">{pkg.coins} 🪙</td>
                            <td className="p-2">${pkg.price.toFixed(2)}</td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {/* Handle edit */}}
                                  className="p-1 text-blue-400 hover:text-blue-300"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => {/* Handle delete */}}
                                  className="p-1 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="transactions">
                  <h2 className="text-2xl text-white mb-4">Coin Transactions</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-2 text-left">User</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-t border-gray-700">
                            <td className="p-2">{transaction.userId}</td>
                            <td className="p-2">{transaction.type}</td>
                            <td className="p-2">{transaction.amount} 🪙</td>
                            <td className="p-2">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tabs.Content>
              </>
            )}
          </div>
        </Tabs.Root>

        {(error || success) && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-lg ${
              error ? 'bg-red-500' : 'bg-green-500'
            } text-white`}
          >
            {error || success}
          </div>
        )}
      </div>
    </div>
  );
}