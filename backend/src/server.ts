import express, { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import pool from "./db";
import passport from "./middleware/passport";

// Import routes
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import medicineRoutes from "./routes/medicine.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import doctorRoutes from "./routes/doctor.routes";
import doctorPortalRoutes from "./routes/doctor-portal.routes";
import appointmentRoutes from "./routes/appointment.routes";
import healthRecordRoutes from "./routes/health-record.routes";
import symptomCheckRoutes from "./routes/symptom-check.routes";
import notificationRoutes from "./routes/notification.routes";
import videoCallRoutes from "./routes/video-call.routes";

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor-portal", doctorPortalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/health-records", healthRecordRoutes);
app.use("/api/symptom-checks", symptomCheckRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/video-calls", videoCallRoutes);

// Socket.io connection handling for WebRTC signaling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room for a specific call
  socket.on("join-room", (roomId: string, userId: string) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    // Notify others in the room
    socket.to(roomId).emit("user-joined", userId);
  });

  // WebRTC signaling: offer
  socket.on("offer", (roomId: string, offer: unknown) => {
    console.log(`Offer received for room ${roomId}`);
    socket.to(roomId).emit("offer", offer);
  });

  // WebRTC signaling: answer
  socket.on("answer", (roomId: string, answer: unknown) => {
    console.log(`Answer received for room ${roomId}`);
    socket.to(roomId).emit("answer", answer);
  });

  // WebRTC signaling: ICE candidate
  socket.on("ice-candidate", (roomId: string, candidate: unknown) => {
    console.log(`ICE candidate received for room ${roomId}`);
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // Handle user leaving
  socket.on("leave-room", (roomId: string, userId: string) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);
    socket.to(roomId).emit("user-left", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: config.nodeEnv === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
