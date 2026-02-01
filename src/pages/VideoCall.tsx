import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import VideoCall from "@/components/VideoCall";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const VideoCallPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeRoom = async () => {
      if (!appointmentId || !user) return;

      try {
        setIsLoading(true);

        // Get room ID from backend
        const response = await fetch("/api/video-calls/room", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            appointmentId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to initialize room");
        }

        const data = await response.json();
        setRoomId(data.roomId);

        // Start call on backend
        await fetch("/api/video-calls/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ appointmentId }),
        });
      } catch (err: unknown) {
        console.error("Failed to initialize call:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to initialize video call";
        setError(message);
        toast({
          title: "Error",
          description: "Failed to initialize video call",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [appointmentId, user, toast]);

  const handleCallEnd = () => {
    navigate("/appointments");
  };

  const goBack = () => {
    navigate("/appointments");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Connection Error</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !roomId || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Initializing video call...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-lg">
            Doctor Consultation
          </h1>
          <p className="text-gray-400 text-sm">Appointment {appointmentId}</p>
        </div>
        <Button
          variant="ghost"
          onClick={goBack}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Call Container */}
      <div className="flex-1 p-4">
        <VideoCall
          roomId={roomId}
          userId={user.id}
          appointmentId={appointmentId!}
          onCallEnd={handleCallEnd}
        />
      </div>
    </div>
  );
};

export default VideoCallPage;
