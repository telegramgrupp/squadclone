// client/src/components/videoCall/videoElement/fakeVideoElement.tsx
import { useEffect, useRef, useState } from 'react';
import { FakeUser } from '@/services/fakeUsers';

interface FakeVideoProps {
  fakeUser: FakeUser;
  onVideoEnd?: () => void;
}

export default function FakeVideo({ fakeUser, onVideoEnd }: FakeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Önce video kaynaklarını konsola yazdıralım, sorun teşhisi için
  useEffect(() => {
    console.log("Video kaynağı:", fakeUser.videoSrc);
    console.log("Fake kullanıcı bilgileri:", fakeUser);
  }, [fakeUser]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Video yükleme olayı
    const handleLoadedData = () => {
      console.log("Video yüklendi:", fakeUser.videoSrc);
      setIsLoading(false);
      // Videoyu otomatik başlat
      videoElement.play().catch(err => {
        console.error('Video otomatik başlatılamadı:', err);
        setError('Video otomatik başlatılamadı. Lütfen ekrana tıklayın.');
      });
    };

    // Video bitti olayı
    const handleEnded = () => {
      console.log("Video bitti:", fakeUser.videoSrc);
      // Video bittiğinde tekrar başlat veya callback çağır
      if (onVideoEnd) {
        onVideoEnd();
      } else {
        // Döngü modunda çal
        videoElement.currentTime = 0;
        videoElement.play().catch(err => {
          console.error('Video tekrar başlatılamadı:', err);
        });
      }
    };

    // Video hata olayı
    const handleError = (e: any) => {
      console.error('Video yükleme hatası:', e);
      setError('Video yüklenirken bir hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
      setIsLoading(false);
    };

    // Olay dinleyicileri ekle
    videoElement.addEventListener('loadeddata', handleLoadedData);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);

    // Temizleme fonksiyonu
    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
    };
  }, [fakeUser, onVideoEnd]);
  
  // Manuel video yükleme denemesi
  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsLoading(false);
          setError(null);
        })
        .catch(err => {
          console.error("Manuel video başlatma hatası:", err);
          setError("Video başlatılamadı: " + err.message);
        });
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-300">Video yükleniyor...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="p-4 bg-red-500/20 rounded-lg text-white text-center">
            <p>{error}</p>
            <button 
              className="mt-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={handleManualPlay}
            >
              Videoyu Oynat
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={fakeUser.videoSrc}
        className="w-full h-full object-cover"
        playsInline
        controls
        muted={false} // Gerçek bir görüşme simülasyonu için sesli
        preload="auto"
        onError={(e) => console.error("Video hata:", e)}
      />

      <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black to-transparent w-full">
        <div className="flex items-center">
          {fakeUser.avatar && (
            <img 
              src={fakeUser.avatar} 
              alt={fakeUser.name} 
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
          )}
          <div>
            <p className="text-xl font-semibold text-white">{fakeUser.name}</p>
            {fakeUser.country && (
              <p className="text-sm text-gray-300">{fakeUser.country}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}