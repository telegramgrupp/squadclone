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
import { CoinBar } from "../CoinBar";

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
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingEnabled, setIsSearchingEnabled] = useState(true);
  const [duo, setDuo] = useState<strangerProp | null>(null);
  const [stranger, setStranger] = useState<strangerProp | null>(null);
  const [readyToMatch, setReadyToMatch] = useState(false);
  const [matchType, setMatchType] = useState<"real" | "fake" | null>(null);
  
  // Yeni socket matching states
  const [matchId, setMatchId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [matchDuration, setMatchDuration] = useState<number | null>(null);
  
  // Sahte eşleşme zamanlayıcısı için ref
  const searchTimeoutRef = useRef<any>(null);

  const handlePeer = useCallback(
    (data?: userProps) => {
      setIsMatched(!!data);
      setIsSearching(false);
      setMatchType("real");
      
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
        isFake: false,
      });

      if (data.duoId && data.duoName) {
        setDuo({
          pairName: data.duoName,
          pairId: data.duoId,
          polite: data.polite,
          isFake: false,
        });
      }
    },
    [socket],
  );
  
  // Socket matching handlers
  useEffect(() => {
    if (!socket) return;

    const handleMatched = (data: { matchId: string; partnerId: string; isFake: boolean }) => {
      setMatchId(data.matchId);
      setPartnerId(data.partnerId);
      setMatchType(data.isFake ? "fake" : "real");
      setIsMatched(true);
      setIsSearching(false);
    };

    const handleMatchStatus = (data: { status: string }) => {
      setMatchStatus(data.status);
    };

    const handleMatchEnded = (data: { matchId: string; duration: number }) => {
      setMatchDuration(data.duration);
      setIsMatched(false);
      setMatchId(null);
      setPartnerId(null);
      setMatchType(null);
    };

    socket.on("matched", handleMatched);
    socket.on("matchStatus", handleMatchStatus);
    socket.on("matchEnded", handleMatchEnded);

    return () => {
      socket.off("matched", handleMatched);
      socket.off("matchStatus", handleMatchStatus);
      socket.off("matchEnded", handleMatchEnded);
    };
  }, [socket]);

  const handleExtendTime = useCallback(() => {
    // Implement time extension logic here
    console.log("Time extended by 15 seconds");
  }, []);

  // Eşleşme arama başlatma
  const startSearching = useCallback(() => {
    if (!socket || !isSearchingEnabled) return;
    
    setIsSearching(true);
    socket.emit("findMatch", { userId: "test-user" }); // Test için sabit ID
  }, [socket, isSearchingEnabled]);

  // Arama sürecini yönet
  useEffect(() => {
    if (isSearching && !isMatched && isSearchingEnabled && readyToMatch) {
      console.log("Eşleşme aranıyor...");
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      if (socket && !stranger && !duoId && !(friend && peerState.friend === "disconnected")) {
        startSearching();
      }
      
      const randomDelay = Math.floor(Math.random() * 3000) + 3000;
      searchTimeoutRef.current = setTimeout(() => {
        if (isSearching && !isMatched && isSearchingEnabled) {
          const shouldCreateFakeMatch = Math.random() < FAKE_MATCH_PROBABILITY;
          
          if (shouldCreateFakeMatch) {
            createFakeMatch();
          } else {
            searchTimeoutRef.current = setTimeout(() => {
              if (isSearching && !isMatched && isSearchingEnabled) {
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
  }, [isSearching, isMatched, isSearchingEnabled, socket, stranger, peerState, duoId, friend, readyToMatch]);

  return (
    <>
      <div className="w-1/2 flex flex-col bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative">
        {isMatched && <CoinBar userId="test-user" onExtendTime={handleExtendTime} />}
        
        {isMatched ? (
          <>
            <div className="absolute top-4 left-4 z-20 bg-black/50 px-4 py-2 rounded-lg">
              <p className="text-white">
                {matchType === "fake" ? "Sahte kullanıcıyla eşleşildi" : "Gerçek kullanıcıyla eşleşildi"}
                {matchDuration && ` (${Math.round(matchDuration / 1000)}s)`}
              </p>
            </div>
            <RemoteCall
              stream={stream}
              handleCallEnd={() => {
                setIsMatched(false);
                setStranger(null);
                setDuo(null);
                setIsSearching(true);
                setMatchType(null);
                if (matchId) {
                  socket?.emit("endMatch", matchId);
                }
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
                  setMatchType(null);
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
                setMatchType(null);
                if (matchId) {
                  socket?.emit("endMatch", matchId);
                }
              }}
              closeStream={closeStream}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            {stream && !readyToMatch && (
              <div className="relative w-full h-full">
                <video
                  ref={(video) => {
                    if (video) video.srcObject = stream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <button
                    onClick={() => {
                      setReadyToMatch(true);
                      setIsSearching(true);
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Eşleşmeye Başla
                  </button>
                </div>
              </div>
            )}
            {readyToMatch && (
              <div className="text-center">
                <p className="text-3xl text-white font-semibold mb-4">
                  {matchStatus === "waiting" ? "Eşleşme bekleniyor..." :
                   isSearching && isSearchingEnabled ? "Eşleşme aranıyor..." : 
                   isSearching && !isSearchingEnabled ? "Eşleşme araması durduruldu" : 
                   "Eşleşme bulunamadı"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isSearching && (
                    <button
                      onClick={() => {
                        setIsSearching(true);
                        setIsSearchingEnabled(true);
                        startSearching();
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
            )}
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