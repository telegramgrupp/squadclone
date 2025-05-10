// client/src/components/videoCall/call/remoteCall.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/context/socketContext";
import { usePeerState } from "@/context/peerStateContext";
import { useFriend } from "@/context/friendContext";
import FakeVideo from "../videoElement/fakeVideoElement";
import { FakeUser, getRandomFakeUser } from "@/services/fakeUsers";

type strangerProp = {
  pairId: string;
  pairName: string;
  polite: boolean;
  isFake?: boolean;
  fakeUser?: FakeUser;
};

export interface remoteCallProps {
  stream: MediaStream | null;
  handleCallEnd: () => void;
  stranger: strangerProp | null;
  userType: "friend" | "stranger" | "duo";
}

export default function RemoteCall({
  stream,
  handleCallEnd,
  stranger,
  userType,
}: remoteCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socket = useSocket();
  const { peerState, updatePeerState } = usePeerState();
  const { friend } = useFriend();
  const [isTest, setIsTest] = useState(true);
  const [fakeUser, setFakeUser] = useState<FakeUser | null>(null);

  // Sahte kullanıcı mi kontrol et
  const isFakeUser = useMemo(() => {
    return stranger?.isFake || false;
  }, [stranger]);

  // Sahte kullanıcı için, stranger nesnesi oluşturulduğunda fakeUser'ı ayarla
  useEffect(() => {
    if (isFakeUser && stranger?.fakeUser) {
      setFakeUser(stranger.fakeUser);
    } else if (isFakeUser && !stranger?.fakeUser) {
      // Eğer stranger.fakeUser yoksa, rastgele bir sahte kullanıcı seç
      setFakeUser(getRandomFakeUser());
    }
  }, [stranger, isFakeUser]);

  // Test modunda doğrudan yerel stream'i göster
  useEffect(() => {
    if (isTest && localVideoRef.current && stream && !isFakeUser) {
      localVideoRef.current.srcObject = stream;
      
      // Test için bağlantı durumunu güncelle
      setTimeout(() => {
        if (userType === "stranger") {
          updatePeerState("stranger", "connected");
        } else if (userType === "friend") {
          updatePeerState("friend", "connected");
        }
      }, 1000);
    }
  }, [stream, isTest, userType, updatePeerState, isFakeUser]);

  // WebRTC hook (gerçek implementasyon için)
  const signalingMessage = useMemo(() => {
    switch (userType) {
      case "friend":
        return "messageFriend";
      case "stranger":
        return "messageStranger";
      case "duo":
        return "messageDuo";
      default:
        return "messageStranger";
    }
  }, [userType]);
  
  const { peerConnection, start, sendOffer, handleOffer, resetPc } = useWebRTC({
    stream,
    signalingMessage,
  });

  // Gerçek WebRTC kodunu yorum satırına aldık (isTest false olduğunda çalışacak)
  useEffect(() => {
    if (!isTest && !isFakeUser) {
      resetPc();
      start();
      
      // Video akışını izle
      const videoTrack = peerConnection?.getReceivers().find(receiver => 
        receiver.track && receiver.track.kind === 'video'
      )?.track;
      
      if (videoTrack && remoteVideoRef.current) {
        const mediaStream = new MediaStream([videoTrack]);
        remoteVideoRef.current.srcObject = mediaStream;
      }
    }
  }, [isTest, peerConnection, resetPc, start, isFakeUser]);

  useEffect(() => {
    if (!isTest && !isFakeUser && (!stranger || !socket || !peerConnection || !stream)) {
      return;
    }

    // Gerçek WebRTC kodunu burada çalıştırırdık
  }, [
    isTest,
    stranger,
    socket,
    peerConnection,
    stream,
    peerState,
    friend,
    userType,
    isFakeUser
  ]);

  useEffect(() => {
    if (!socket || !stranger) return;
    if (userType !== "friend" && !isFakeUser) {
      socket.on("strangerLeft", handleCallEnd);
    }

    return () => {
      socket.off("strangerLeft", handleCallEnd);
      socket.off(signalingMessage);
    };
  }, [socket, stranger, peerState, peerConnection, handleCallEnd, userType, signalingMessage, isFakeUser]);

  // UI render
  return (
    <>
      <div className="w-full h-full">
        {isFakeUser && fakeUser ? (
          // Sahte kullanıcı videosu
          <FakeVideo 
            fakeUser={fakeUser} 
            onVideoEnd={() => {
              // Video bittiğinde, kullanıcı ID'sini görüntülenmiş olarak işaretle
              if (fakeUser.id) {
                import('@/services/fakeUsers').then(module => {
                  module.markVideoAsViewed(fakeUser.id);
                });
              }
              console.log("Sahte kullanıcı videosu bitti, tekrar başlatılıyor...");
            }}
          />
        ) : (
          // Normal video (gerçek veya test)
          <div className="relative w-full h-full bg-black">
            {isTest ? (
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
            )}
            <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black to-transparent w-full">
              <p className="text-xl font-semibold text-white">
                {stranger?.pairName} {isTest ? "(Test Modu)" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}