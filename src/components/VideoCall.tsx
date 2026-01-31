import React, { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoCallProps {
  channelName: string;
  token: string;
  uid: number;
  appointmentId: string;
  onCallEnd?: () => void;
}

const VideoCall = ({
  channelName,
  token,
  uid,
  appointmentId,
  onCallEnd,
}: VideoCallProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const agoraClient = useRef(
    AgoraRTC.createClient({ mode: "rtc", codec: "h264" }),
  );
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const callStartTime = useRef<number>(Date.now());
  const clientRef = useRef(agoraClient.current);

  useEffect(() => {
    const client = (clientRef.current = agoraClient.current);

    const initializeCall = async () => {
      try {
        // Handle remote user joined
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            setRemoteUsers((prev) => [
              ...prev.filter((u) => u.uid !== user.uid),
              user,
            ]);
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        // Handle remote user left
        client.on("user-unpublished", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        // Join channel
        await client.join(
          process.env.REACT_APP_AGORA_APP_ID || "",
          channelName,
          token,
          uid,
        );

        // Create and publish local tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        localAudioTrack.current = audioTrack;
        localVideoTrack.current = videoTrack;

        await client.publish([audioTrack, videoTrack]);

        // Play local video
        if (containerRef.current) {
          videoTrack.play("local-user");
        }

        setIsInitialized(true);
        setIsLoading(false);
        toast({
          title: "Call Started",
          description: "Video call connected successfully",
        });
      } catch (error: unknown) {
        console.error("Failed to initialize call:", error);
        const message =
          error instanceof Error ? error.message : "Failed to start video call";
        toast({
          title: "Connection Error",
          description: message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    initializeCall();

    // Clean up on unmount
    return () => {
      // Use the captured client ref
      const audio = localAudioTrack.current;
      const video = localVideoTrack.current;

      const cleanup = async () => {
        if (audio) {
          audio.close();
        }
        if (video) {
          video.close();
        }
        await clientRef.current.leave();
      };
      cleanup();
    };
  }, [channelName, token, uid, toast]);

  // Update call duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleMic = async () => {
    if (localAudioTrack.current) {
      if (isMicOn) {
        await localAudioTrack.current.setEnabled(false);
      } else {
        await localAudioTrack.current.setEnabled(true);
      }
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = async () => {
    if (localVideoTrack.current) {
      if (isCameraOn) {
        await localVideoTrack.current.setEnabled(false);
      } else {
        await localVideoTrack.current.setEnabled(true);
      }
      setIsCameraOn(!isCameraOn);
    }
  };

  const endCall = async () => {
    try {
      const client = agoraClient.current;

      if (localAudioTrack.current) {
        localAudioTrack.current.close();
      }
      if (localVideoTrack.current) {
        localVideoTrack.current.close();
      }

      await client.leave();

      // Log call end to backend
      try {
        await fetch(`/api/video-calls/end/${appointmentId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
      } catch (error) {
        console.error("Failed to log call end:", error);
      }

      toast({
        title: "Call Ended",
        description: `Call duration: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s`,
      });

      onCallEnd?.();
    } catch (error: unknown) {
      console.error("Failed to end call:", error);
      toast({
        title: "Error",
        description: "Failed to end call",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-white">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local User */}
        <div className="bg-gray-800 rounded-lg overflow-hidden relative">
          <div
            id="local-user"
            className="w-full h-full"
            ref={containerRef}
            style={{ minHeight: "300px" }}
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
            <p className="text-white text-sm">You</p>
          </div>
        </div>

        {/* Remote Users */}
        {remoteUsers.map((user) => (
          <div
            key={user.uid}
            className="bg-gray-800 rounded-lg overflow-hidden relative"
          >
            <div
              id={`remote-user-${user.uid}`}
              className="w-full h-full"
              style={{ minHeight: "300px" }}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
              <p className="text-white text-sm">Doctor</p>
            </div>
          </div>
        ))}

        {/* Placeholder for remote user */}
        {remoteUsers.length === 0 && (
          <div className="bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400">Waiting for doctor to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Duration */}
          <div className="text-white font-semibold">
            {formatDuration(callDuration)}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              size="lg"
              variant={isMicOn ? "default" : "destructive"}
              onClick={toggleMic}
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              {isMicOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              size="lg"
              variant={isCameraOn ? "default" : "destructive"}
              onClick={toggleCamera}
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              {isCameraOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>

          {/* Empty space for alignment */}
          <div className="w-20" />
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
