// client/src/components/videoCall/call/call.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import Controls from "../btn/controlBtn";
import useMedia from "@/hooks/useMedia";
import { useSocket } from "@/context/socketContext";
import RemoteCall from "./remoteCall";
import { useParams } from "react-router-dom";
import FriendCall from "./friendCall";
import { useFriend } from "@/context/friendContext";
import { usePeerState } from "@/context/peerStateContext";
import { getRandomFakeUser, getUnviewedFakeUser } from "@/services/fakeUsers";

type strangerProp = {
  pairId: string;
  pairName: string;
  polite: boolean;
  isFake?: boolean;
  fakeUser?: any;
};

interface userProps {
  id: string;
  name: string;
  pairId: string;
  pairName: string;
  duoId?: string;
  duoName?: string;
  polite: boolean;
}

// Sahte eşleşme olasılığı (0-1 arası, örn: 0.7 = %70 olasılık)
const FAKE_MATCH_PROBABILITY = 0.8;

export default function Call() {
  const socket = useSocket();
  const { duoId } = useParams();
  const { friend } = useFriend();
  const { peerState } = usePeerState();
  const { stream, closeStream } = useMedia();
  const [isMatched, setIsMatched] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [isSearchingEnabled, setIsSearchingEnabled] = useState(true);
  const [duo, setDuo] = useState<strangerProp | null>(null);
  const [stranger, setStranger] = useState<strangerProp | null>(null);
  
  // Sahte eşleşme zamanlayıcısı için ref
  const searchTimeoutRef = useRef<any>(null);

  const handlePeer = useCallback(
    (data?: userProps) => {
      setIsMatched(!!data);
      setIsSearching(false);
      
      if (!data) {
        console.log("stranger left");
        setStranger(null);
        setDuo(null);
        return;
      }
      
      setStranger({
        pairName: data.pairName,
        pairId: data.pairId,
        polite: data.polite,
        isFake: false, // Gerçek kullanıcı
      });

      if (data.duoId && data.duoName) {
        setDuo({
          pairName: data.duoName,
          pairId: data.duoId,
          polite: data.polite,
          isFake: false, // Gerçek kullanıcı
        });
      }
    },
    [socket],
  );
  
  // Sahte eşleşme oluşturma fonksiyonu
  const createFakeMatch = useCallback(() => {
    // Önce görüntülenmemiş bir kullanıcı almayı dene
    import('@/services/fakeUsers').then(module => {
      const unviewedUser = module.getUnviewedFakeUser();
      
      // Eğer tüm kullanıcılar görüntülenmişse
      if (!unviewedUser) {
        console.log("Tüm sahte kullanıcılar görüntülenmiş, eşleşme aranıyor...");
        // Eşleşme arama durumuna dön
        setIsMatched(false);
        setStranger(null);
        setIsSearching(true);
        return;
      }
      
      console.log("Sahte kullanıcı ile eşleşiliyor:", unviewedUser.name);
      
      setStranger({
        pairId: `fake-${unviewedUser.id}`,
        pairName: unviewedUser.name,
        polite: true,
        isFake: true,
        fakeUser: unviewedUser,
      });
      
      setIsMatched(true);
      setIsSearching(false);
    });
  }, []);

  const handleBeforeUnload = useCallback(() => {
    socket?.emit("pairedclosedtab", {
      pairId: stranger?.pairId,
      duoId: duo?.pairId,
    });
  }, [socket, stranger, duo]);
  
  // Arama sürecini yönet
  useEffect(() => {
    if (isSearching && !isMatched && isSearchingEnabled) {
      console.log("Eşleşme aranıyor...");
      
      // Arama zamanlayıcısını temizle
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Gerçek kullanıcı bulma girişimi
      if (socket && !stranger && !duoId && !(friend && peerState.friend === "disconnected")) {
        socket.emit("connectPeer", {
          duoSocketId: friend?.pairId,
          duoUsername: friend?.pairName,
        });
        console.log("Socket ile eşleşme aranıyor...");
      }
      
      // Rastgele bir süre sonra (3-6 saniye) sahte eşleşme kontrolü yap
      const randomDelay = Math.floor(Math.random() * 3000) + 3000;
      searchTimeoutRef.current = setTimeout(() => {
        // Hala arama yapılıyorsa ve eşleşme yoksa
        if (isSearching && !isMatched && isSearchingEnabled) {
          // Olasılık kontrolü - fake eşleşme mi gerçekleşsin?
          const shouldCreateFakeMatch = Math.random() < FAKE_MATCH_PROBABILITY;
          
          if (shouldCreateFakeMatch) {
            createFakeMatch();
          } else {
            // Gerçek eşleşme devam ediyor, belki biraz daha bekleyelim
            console.log("Gerçek kullanıcı aranmaya devam ediliyor...");
            
            // Ek süre sonra yine kontrol et
            searchTimeoutRef.current = setTimeout(() => {
              if (isSearching && !isMatched && isSearchingEnabled) {
                // Bu sefer kesinlikle fake eşleşme oluştur
                createFakeMatch();
              }
            }, 5000);
          }
        }
      }, randomDelay);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isSearching, isMatched, isSearchingEnabled, socket, stranger, peerState, duoId, friend, createFakeMatch]);

  useEffect(() => {
    if (socket) {
      socket.on("peer", handlePeer);
    }
    
    return () => {
      if (socket) {
        socket.off("peer", handlePeer);
      }
    };
  }, [socket, handlePeer]);

  useEffect(() => {
    // Yeni arama başlatma veya ilk yükleme
    setIsSearching(true);
    
    // Component unmount olduğunda zamanlayıcıyı temizle
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket, handleBeforeUnload]);

  return (
    <>
      <div className="w-1/2 flex flex-col bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative">
        {isMatched
          ? (
            <>
              <RemoteCall
                stream={stream}
                handleCallEnd={() => {
                  setIsMatched(false);
                  setStranger(null);
                  setDuo(null);
                  setIsSearching(true);
                }}
                stranger={stranger}
                userType={duoId ? "duo" : "stranger"}
              />
              {duo && peerState.stranger === "connected" && (
                <RemoteCall
                  stream={stream}
                  handleCallEnd={() => {
                    setIsMatched(false);
                    setStranger(null);
                    setDuo(null);
                    setIsSearching(true);
                  }}
                  stranger={duo}
                  userType={"duo"}
                />
              )}

              <Controls
                strangerId={stranger?.pairId}
                duoId={duo?.pairId}
                friendId={friend?.pairId}
                endCall={() => {
                  setIsMatched(false);
                  setStranger(null);
                  setDuo(null);
                  setIsSearching(true);
                }}
                closeStream={closeStream}
              />
            </>
          )
          : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
              <div className="text-center">
                <p className="text-3xl text-white font-semibold mb-4">
                  {isSearching && isSearchingEnabled ? "Eşleşme aranıyor..." : 
                   isSearching && !isSearchingEnabled ? "Eşleşme araması durduruldu" : 
                   "Eşleşme bulunamadı"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isSearching && (
                    <button
                      onClick={() => {
                        setIsSearching(true);
                        setIsSearchingEnabled(true);
                      }}
                      className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Tekrar Ara
                    </button>
                  )}
                  
                  {isSearching && (
                    <button
                      onClick={() => setIsSearchingEnabled(!isSearchingEnabled)}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        isSearchingEnabled 
                        ? "bg-red-500 text-white hover:bg-red-600" 
                        : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {isSearchingEnabled ? "Aramayı Durdur" : "Aramayı Başlat"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
      <FriendCall
        stranger={stranger}
        stream={stream}
        closeStream={closeStream}
      />
    </>
  );
}