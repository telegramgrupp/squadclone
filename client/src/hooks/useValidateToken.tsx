import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Test kullanıcıları
const TEST_USERS = ['test1', 'test2', 'admin'];

export const useValidateToken = () => {
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(true);

  function logout() {
    console.log('Çıkış yapılıyor...');
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/auth");
  }
  
  useEffect(() => {
    // Geliştirme ortamında token doğrulamasını atla
    if (import.meta.env.DEV) {
      console.log("Geliştirme modunda token doğrulaması atlanıyor...");
      
      // localStorage'da token ve username varsa kullan, yoksa oluştur
      let username = localStorage.getItem("username");
      
      // Kullanıcı adı yoksa veya geçerli bir test kullanıcısı değilse, yeni bir test kullanıcısı ata
      if (!username || !TEST_USERS.includes(username)) {
        // Her tarayıcı oturumu için farklı bir kullanıcı seç (incognito/normal)
        const isIncognito = !window.navigator.serviceWorker;
        username = isIncognito ? 'test2' : 'test1';
        
        localStorage.setItem("username", username);
        localStorage.setItem("token", "test-token");
        console.log(`Test kullanıcısı atandı: ${username}`);
      }
      
      setInitializing(false);
      return;
    }
    
    // Gerçek ortamda token doğrulaması yap
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      navigate("/auth");
      return;
    }

    axios
      .post(import.meta.env.VITE_API_URL + "/validateToken", {
        username,
        token,
      })
      .then((response) => {
        const valid = response.data.valid;
        if (!valid) logout();
        setInitializing(false);
      })
      .catch((err) => {
        console.log("Token doğrulama sırasında hata:", err);
        logout();
      });
  }, [navigate]);

  return { initializing };
};