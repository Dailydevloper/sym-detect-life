import { Router, Response } from "express";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import pool from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Generate Agora token for video call
router.post("/token", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { channelName, uid } = req.body;
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res
        .status(400)
        .json({ error: "Agora credentials not configured" });
    }

    if (!channelName || !uid) {
      return res.status(400).json({ error: "channelName and uid required" });
    }

    // Generate token using RtcTokenBuilder
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      86400,
    );

    res.json({ token, channelName, uid });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Start video call
router.post("/start", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.user?.id;

    if (!appointmentId || !userId) {
      return res
        .status(400)
        .json({ error: "appointmentId and userId required" });
    }

    // Verify appointment belongs to user or they are the doctor
    const appointment = await pool.query(
      `SELECT a.*, d.user_id as doctor_id FROM appointments a 
       LEFT JOIN doctors d ON a.doctor_id = d.id 
       WHERE a.id = $1 AND (a.user_id = $2 OR d.user_id = $2)`,
      [appointmentId, userId],
    );

    if (appointment.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Create call record
    const callResult = await pool.query(
      `INSERT INTO video_calls (appointment_id, initiator_id, status, started_at)
       VALUES ($1, $2, 'active', NOW())
       RETURNING *`,
      [appointmentId, userId],
    );

    res.json({
      success: true,
      call: callResult.rows[0],
    });
  } catch (error) {
    console.error("Start call error:", error);
    res.status(500).json({ error: "Failed to start call" });
  }
});

// End video call
router.post(
  "/end/:callId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { callId } = req.params;
      const userId = req.user?.id;

      // Update call status
      const result = await pool.query(
        `UPDATE video_calls 
       SET status = 'ended', ended_at = NOW()
       WHERE id = $1
       RETURNING *`,
        [callId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Call not found" });
      }

      res.json({
        success: true,
        call: result.rows[0],
      });
    } catch (error) {
      console.error("End call error:", error);
      res.status(500).json({ error: "Failed to end call" });
    }
  },
);

// Get call history
router.get(
  "/history",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      const calls = await pool.query(
        `SELECT vc.*, a.appointment_date, a.appointment_time,
              d.name as doctor_name, u.email as patient_email
       FROM video_calls vc
       JOIN appointments a ON vc.appointment_id = a.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1 OR d.user_id = $1
       ORDER BY vc.started_at DESC
       LIMIT 50`,
        [userId],
      );

      res.json({ calls: calls.rows });
    } catch (error) {
      console.error("History fetch error:", error);
      res.status(500).json({ error: "Failed to fetch call history" });
    }
  },
);

export default router;
