// client/src/components/admin/AdminPanel.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, RefreshCw, UserX, Shield } from 'lucide-react';

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
}

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'users'>('matches');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === '125899852105Ma') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      alert('Yanlış şifre!');
    }
  };

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'matches') {
        const response = await axios.get('http://localhost:3000/api/matches');
        setMatches(response.data);
      } else {
        const response = await axios.get('http://localhost:3000/api/users');
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:3000/api/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Kullanıcı silinemedi:', error);
      }
    }
  };

  const handleBanUser = async (userId: number) => {
    if (window.confirm('Bu kullanıcıyı banlamak istediğinizden emin misiniz?')) {
      try {
        await axios.post(`http://localhost:3000/api/users/${userId}/ban`);
        fetchData();
      } catch (error) {
        console.error('Kullanıcı banlanamadı:', error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl">
          <h2 className="text-2xl text-white mb-4">Admin Giriş</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
          />
          <button
            onClick={handleLogin}
            className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 text-white"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-white">Admin Paneli</h1>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              className="p-2 bg-blue-600 rounded hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Yenile
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-600 rounded hover:bg-red-700 text-white"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('matches')}
            className={`p-2 rounded ${
              activeTab === 'matches'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Eşleşmeler
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`p-2 rounded ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Kullanıcılar
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : activeTab === 'matches' ? (
            <div>
              <h2 className="text-2xl text-white mb-4">Güncel Eşleşmeler</h2>
              {matches.length === 0 ? (
                <p className="text-gray-400">Eşleşme yok.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="p-2 text-left">Kullanıcı ID</th>
                        <th className="p-2 text-left">Eşleştiği</th>
                        <th className="p-2 text-left">Tür</th>
                        <th className="p-2 text-left">Başlangıç</th>
                        <th className="p-2 text-left">Kayıt</th>
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
                              {match.isFake ? 'Fake' : 'Gerçek'}
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
                                İzle
                              </a>
                            ) : (
                              'Kaydediliyor...'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl text-white mb-4">Kullanıcılar</h2>
              {users.length === 0 ? (
                <p className="text-gray-400">Kullanıcı yok.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="p-2 text-left">Kullanıcı Adı</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Kayıt Tarihi</th>
                        <th className="p-2 text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-gray-700">
                          <td className="p-2">{user.username}</td>
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">
                            {new Date(user.createdAt).toLocaleString()}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                onClick={() => handleBanUser(user.id)}
                                className="p-1 text-yellow-400 hover:text-yellow-300"
                                title="Kullanıcıyı Banla"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}