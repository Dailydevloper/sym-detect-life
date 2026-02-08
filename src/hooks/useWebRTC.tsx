import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onUserLeft?: () => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

// ICE servers configuration (using free STUN servers and backup TURN servers)
const iceServers: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Public TURN server as fallback
    {
      urls: ["turn:numb.viagenie.ca"],
      username: "webrtc@example.com",
      credential: "webrtc",
    },
  ],
};

export const useWebRTC = ({
  roomId,
  userId,
  onRemoteStream,
  onUserLeft,
  onConnectionStateChange,
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteTracksRef = useRef<Set<string>>(new Set());
  const initiatedConnectionRef = useRef(false);
  const callIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize local media stream with better error handling
  const initLocalStream = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to get local stream:", errorMsg);

      // Try with less strict constraints
      try {
        const basicConstraints = {
          video: true,
          audio: true,
        };
        const stream =
          await navigator.mediaDevices.getUserMedia(basicConstraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        setError(null);
        return stream;
      } catch (fallbackErr) {
        const msg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to access camera/microphone";
        setError(msg);
        throw fallbackErr;
      }
    }
  }, []);

  // Create peer connection with better event handling
  const createPeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(iceServers);

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // Handle incoming remote stream - improved
      pc.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        const [stream] = event.streams;

        // Add track to remote stream
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
          setRemoteStream(remoteStreamRef.current);
          if (onRemoteStream) {
            onRemoteStream(remoteStreamRef.current);
          }
        }

        remoteStreamRef.current.addTrack(event.track);
        setIsConnected(true);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log("Sending ICE candidate");
          socketRef.current.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        setConnectionState(pc.connectionState);

        if (onConnectionStateChange) {
          onConnectionStateChange(pc.connectionState);
        }

        if (pc.connectionState === "connected") {
          setIsConnected(true);
          console.log("WebRTC Connection established!");
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setIsConnected(false);
          console.warn("WebRTC Connection lost");
        } else if (pc.connectionState === "closed") {
          setIsConnected(false);
          console.log("WebRTC Connection closed");
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      // Handle signaling state
      pc.onsignalingstatechange = () => {
        console.log("Signaling state:", pc.signalingState);
      };

      peerConnectionRef.current = pc;
      return pc;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to create peer connection:", errorMsg);
      setError(errorMsg);
      throw err;
    }
  }, [roomId, onRemoteStream, onConnectionStateChange]);

  // Initialize WebRTC connection
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize local stream
        await initLocalStream();

        // Connect to Socket.io server
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        console.log("Connecting to signaling server at:", apiUrl);

        const socket = io(apiUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Connected to signaling server, socket id:", socket.id);
          socket.emit("join-room", { roomId, userId });
        });

        // Handle incoming user
        socket.on("user-joined", async (data: { userId: string }) => {
          console.log("User joined:", data.userId);

          // Only initiator creates offer
          if (!initiatedConnectionRef.current) {
            initiatedConnectionRef.current = true;
            console.log("Creating offer...");

            try {
              const pc = createPeerConnection();
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              });
              await pc.setLocalDescription(offer);

              socket.emit("offer", {
                roomId,
                offer: pc.localDescription,
              });
              console.log("Offer sent");
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : "Unknown error";
              console.error("Error creating offer:", errorMsg);
            }
          }
        });

        // Handle incoming offer
        socket.on(
          "offer",
          async (data: { offer: RTCSessionDescriptionInit }) => {
            console.log("Received offer");

            try {
              if (!peerConnectionRef.current) {
                createPeerConnection();
              }

              const pc = peerConnectionRef.current!;

              // Only set remote description if not already set
              if (pc.remoteDescription === null) {
                await pc.setRemoteDescription(
                  new RTCSessionDescription(data.offer),
                );
                console.log("Remote description set from offer");

                const answer = await pc.createAnswer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true,
                });
                await pc.setLocalDescription(answer);

                socket.emit("answer", {
                  roomId,
                  answer: pc.localDescription,
                });
                console.log("Answer sent");
              }
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : "Unknown error";
              console.error("Error handling offer:", errorMsg);
            }
          },
        );

        // Handle incoming answer
        socket.on(
          "answer",
          async (data: { answer: RTCSessionDescriptionInit }) => {
            console.log("Received answer");

            try {
              if (
                peerConnectionRef.current &&
                peerConnectionRef.current.remoteDescription === null
              ) {
                await peerConnectionRef.current.setRemoteDescription(
                  new RTCSessionDescription(data.answer),
                );
                console.log("Remote description set from answer");
              }
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : "Unknown error";
              console.error("Error handling answer:", errorMsg);
            }
          },
        );

        // Handle incoming ICE candidate
        socket.on(
          "ice-candidate",
          async (data: { candidate: RTCIceCandidateInit }) => {
            try {
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(data.candidate),
                );
                console.log("ICE candidate added");
              }
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : "Unknown error";
              console.error("Error adding ICE candidate:", errorMsg);
            }
          },
        );

        // Handle user leaving
        socket.on("user-left", (data: { userId: string }) => {
          console.log("User left:", data.userId);
          remoteTracksRef.current.clear();
          remoteStreamRef.current = null;
          setRemoteStream(null);
          setIsConnected(false);
          initiatedConnectionRef.current = false;

          if (onUserLeft) {
            onUserLeft();
          }
        });

        socket.on("disconnect", (reason) => {
          console.log("Disconnected from signaling server:", reason);
          setIsConnected(false);
          setConnectionState("closed");
        });

        socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          setError("Failed to connect to signaling server");
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to initialize WebRTC:", errorMsg);
        setError(errorMsg);
      }
    };

    init();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId, userId });
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
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
      console.log(`Microphone ${!isMicOn ? "enabled" : "disabled"}`);
    }
  }, [isMicOn]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
      console.log(`Camera ${!isCameraOn ? "enabled" : "disabled"}`);
    }
  }, [isCameraOn]);

  // End call
  const endCall = useCallback(async () => {
    console.log("Ending call...");

    try {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clear remote stream
      setRemoteStream(null);
      setLocalStream(null);
      setIsConnected(false);
      setConnectionState("closed");

      // Notify other user
      if (socketRef.current) {
        socketRef.current.emit("user-left", { roomId, userId });
      }

      // Record call end if needed
      if (callIdRef.current) {
        try {
          const token = localStorage.getItem("access_token");
          if (token) {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/video-calls/end/${callIdRef.current}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  endTime: new Date().toISOString(),
                  duration: Math.floor(
                    (Date.now() - startTimeRef.current) / 1000,
                  ),
                }),
              },
            );

            if (!response.ok) {
              console.error("Failed to record call end");
            }
          }
        } catch (err) {
          console.error("Error recording call end:", err);
        }
      }

      console.log("Call ended");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error ending call:", errorMsg);
      setError(errorMsg);
    }
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
