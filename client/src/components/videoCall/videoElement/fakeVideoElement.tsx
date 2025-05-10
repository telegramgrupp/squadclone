import { useSocket } from "@/context/socketContext";
import { Button } from "@/components/ui/button";
import { X, Mic, MicOff, Video, VideoOff, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";

type controlProps = {
  strangerId?: string;
  duoId?: string;
  friendId?: string;
  endCall: () => void;
  closeStream: () => void;
};

export default function Controls({
  strangerId,
  duoId,
  friendId,
  endCall,
  closeStream,
}: controlProps) {
  const socket = useSocket();
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  function micToggle() {
    setMicEnabled((prev) => !prev);
  }
  function videoToggle() {
    setVideoEnabled((prev) => !prev);
  }

  useEffect(() => {
    const videoTracks = document.getElementsByTagName("video");
    if (videoTracks.length > 0) {
      for (let i = 0; i < videoTracks.length; i++) {
        const videoTag: HTMLVideoElement = videoTracks[i];
        const mediaTracks = videoTag.srcObject as MediaStream;
        if (mediaTracks) {
          const tracks = mediaTracks.getTracks();
          // Toggle video
          const videoTrack = tracks.find((track) => track.kind === "video");
          if (videoTrack) {
            videoTrack.enabled = videoEnabled;
          }
          // Toggle audio
          const audioTrack = tracks.find((track) => track.kind === "audio");
          if (audioTrack) {
            audioTrack.enabled = micEnabled;
          }
        }
      }
    }
  }, [micEnabled, videoEnabled]);

  function handleEndCall() {
    socket?.emit("skip", { strangerId, duoId, friendId });
    closeStream();
    endCall();
    // "End Call" butonu sadece görüşmeyi sonlandırır, otomatik yeni eşleşme aramaz
  }
  
  function handleNextMatch() {
    // Önce mevcut aramayi sonlandır
    socket?.emit("skip", { strangerId, duoId, friendId });
    
    // Sonra yeni eşleşme ara (şu an için sadece endCall çağırıyoruz)
    // Bu, Call.tsx'deki eşleşme sürecini tekrar başlatacak
    endCall();
    
    // Burada gerçek uygulamada belki bir "arıyor" göstergesi olabilir
    console.log("Yeni eşleşme aranıyor...");
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex justify-between z-10">
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={micToggle}
        >
          {micEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={videoToggle}
        >
          {videoEnabled ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={handleNextMatch}
        >
          <Shuffle className="h-5 w-5 mr-2" />
          Next Match
        </Button>
        <Button
          variant="destructive"
          className="rounded-full"
          onClick={handleEndCall}
        >
          <X className="h-5 w-5 mr-2" />
          End Call
        </Button>
      </div>
    </div>
  );
}