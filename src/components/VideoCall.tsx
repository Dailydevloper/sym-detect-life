import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebRTC } from "@/hooks/useWebRTC";

interface VideoCallProps {
  roomId: string;
  userId: string;
  appointmentId: string;
  onCallEnd?: () => void;
}

const VideoCall = ({
  roomId,
  userId,
  appointmentId,
  onCallEnd,
}: VideoCallProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const { toast } = useToast();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(Date.now());

  const {
    localStream,
    remoteStream,
    isMicOn,
    isCameraOn,
    isConnected,
    error,
    toggleMic,
    toggleCamera,
    endCall,
  } = useWebRTC({
    roomId,
    userId,
    onRemoteStream: (stream) => {
      console.log("Remote stream received");
      toast({
        title: "Connected",
        description: "Other participant has joined the call",
      });
    },
    onUserLeft: () => {
      toast({
        title: "User Left",
        description: "The other participant has left the call",
      });
    },
  });

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Show error if any
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Update call duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEndCall = async () => {
    const duration = Math.floor((Date.now() - callStartTime.current) / 1000);

    endCall();

    // Notify backend that call ended
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Call the end endpoint with call ID or appointment ID
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/video-calls/end/${appointmentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duration,
            endTime: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        console.warn("Failed to update call status");
      }
    } catch (err) {
      console.error("Failed to update call status:", err);
    }

    toast({
      title: "Call Ended",
      description: `Call duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
    });

    if (onCallEnd) {
      onCallEnd();
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!localStream) {
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
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ minHeight: "300px" }}
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
            <p className="text-white text-sm">You</p>
          </div>
          {!isCameraOn && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Remote User */}
        <div className="bg-gray-800 rounded-lg overflow-hidden relative">
          {remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ minHeight: "300px" }}
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
                <p className="text-white text-sm">
                  {isConnected ? "Connected" : "Doctor"}
                </p>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                <p className="text-gray-400">
                  Waiting for other participant...
                </p>
              </div>
            </div>
          )}
        </div>
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
              onClick={handleEndCall}
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>

          {/* Status indicator */}
          <div className="w-20 text-right">
            <div
              className={`inline-flex items-center gap-2 ${isConnected ? "text-green-400" : "text-yellow-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-yellow-400"} animate-pulse`}
              />
              <span className="text-xs">
                {isConnected ? "Connected" : "Connecting"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
