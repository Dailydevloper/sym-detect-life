import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onUserLeft?: () => void;
}

// ICE servers configuration (using free STUN servers)
const iceServers: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const useWebRTC = ({
  roomId,
  userId,
  onRemoteStream,
  onUserLeft,
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media stream
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream:", err);
      setError("Failed to access camera/microphone");
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (onRemoteStream) {
        onRemoteStream(stream);
      }
      setIsConnected(true);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log("Sending ICE candidate");
        socketRef.current.emit("ice-candidate", roomId, event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        setIsConnected(false);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId, onRemoteStream]);

  // Initialize WebRTC connection
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize local stream
        await initLocalStream();

        // Connect to Socket.io server
        const socket = io(
          import.meta.env.VITE_API_URL || "http://localhost:5000",
        );
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Connected to signaling server");
          socket.emit("join-room", roomId, userId);
        });

        // Handle incoming user
        socket.on("user-joined", async (joinedUserId: string) => {
          console.log("User joined:", joinedUserId);
          // Create offer for the new user
          const pc = createPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", roomId, offer);
        });

        // Handle incoming offer
        socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
          console.log("Received offer");
          const pc = createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", roomId, answer);
        });

        // Handle incoming answer
        socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
          console.log("Received answer");
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(answer),
            );
          }
        });

        // Handle incoming ICE candidate
        socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
          console.log("Received ICE candidate");
          if (peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            } catch (err) {
              console.error("Error adding ICE candidate:", err);
            }
          }
        });

        // Handle user leaving
        socket.on("user-left", (leftUserId: string) => {
          console.log("User left:", leftUserId);
          setRemoteStream(null);
          setIsConnected(false);
          if (onUserLeft) {
            onUserLeft();
          }
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from signaling server");
        });
      } catch (err) {
        console.error("Failed to initialize WebRTC:", err);
        setError("Failed to initialize video call");
      }
    };

    init();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", roomId, userId);
        socketRef.current.disconnect();
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, userId, initLocalStream, createPeerConnection, onUserLeft]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room", roomId, userId);
      socketRef.current.disconnect();
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [roomId, userId]);

  return {
    localStream,
    remoteStream,
    isMicOn,
    isCameraOn,
    isConnected,
    error,
    toggleMic,
    toggleCamera,
    endCall,
  };
};
