// client/src/components/admin/AdminPanel.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Match {
  id: string;
  userId: string;
  matchedWith: string;
  isFake: boolean;
  startTime: string;
  videoPath?: string;
}

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === '125899852105Ma') {
      setIsAuthenticated(true);
    } else {
      alert('Yanlış şifre!');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchMatches = async () => {
        try {
          const response = await axios.get('http://localhost:3000/api/matches');
          setMatches(response.data);
        } catch (error) {
          console.error('Eşleşmeler alınamadı:', error);
        }
      };
      fetchMatches();
      const interval = setInterval(fetchMatches, 5000); // 5 saniyede bir güncelle
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-white mb-6">Admin Paneli</h1>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="mb-4 p-2 bg-red-600 rounded hover:bg-red-700 text-white"
        >
          Çıkış Yap
        </button>
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl text-white mb-4">Güncel Eşleşmeler</h2>
          {matches.length === 0 ? (
            <p className="text-gray-400">Eşleşme yok.</p>
          ) : (
            <table className="w-full text-white">
              <thead>
                <tr>
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
                    <td className="p-2">{match.isFake ? 'Fake' : 'Gerçek'}</td>
                    <td className="p-2">{new Date(match.startTime).toLocaleString()}</td>
                    <td className="p-2">
                      {match.videoPath ? (
                        <a href={match.videoPath} className="text-blue-400" target="_blank">
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
          )}
        </div>
      </div>
    </div>
  );
}