import { Router, Response } from "express";
import pool from "../db";
import { authenticate, requireRole } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Apply authentication and doctor role requirement to all routes
router.use(authenticate);
router.use(requireRole("doctor"));

// Get doctor's dashboard statistics
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get the doctor's record
    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [userId],
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0].id;

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Get statistics
    const [todayAppts, upcomingAppts, totalPatients, completedToday] =
      await Promise.all([
        // Today's appointments count
        pool.query(
          "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
          [doctorId, today],
        ),
        // Upcoming appointments count
        pool.query(
          "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date > $2 AND status = 'scheduled'",
          [doctorId, today],
        ),
        // Total unique patients
        pool.query(
          "SELECT COUNT(DISTINCT user_id) as count FROM appointments WHERE doctor_id = $1",
          [doctorId],
        ),
        // Completed today
        pool.query(
          "SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'completed'",
          [doctorId, today],
        ),
      ]);

    // Calculate monthly revenue (mock - needs payment integration)
    const monthlyRevenue = parseFloat(todayAppts.rows[0].count) * 120; // Assuming average consultation fee

    res.json({
      todayAppointments: parseInt(todayAppts.rows[0].count),
      upcomingAppointments: parseInt(upcomingAppts.rows[0].count),
      totalPatients: parseInt(totalPatients.rows[0].count),
      completedToday: parseInt(completedToday.rows[0].count),
      pendingAppointments:
        parseInt(todayAppts.rows[0].count) -
        parseInt(completedToday.rows[0].count),
      monthlyRevenue: monthlyRevenue,
    });
  } catch (error) {
    console.error("Get doctor stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get doctor's appointments for today
router.get("/appointments/today", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get the doctor's record
    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [userId],
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0].id;
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `SELECT 
          a.*,
          u.full_name as patient_name,
          u.avatar_url as patient_avatar,
          p.phone as patient_phone
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN profiles p ON a.user_id = p.id
        WHERE a.doctor_id = $1 AND a.appointment_date = $2
        ORDER BY a.appointment_time ASC`,
      [doctorId, today],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get today appointments error:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Get doctor's upcoming appointments
router.get(
  "/appointments/upcoming",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      // Get the doctor's record
      const doctorResult = await pool.query(
        "SELECT id FROM doctors WHERE user_id = $1",
        [userId],
      );

      if (doctorResult.rows.length === 0) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      const doctorId = doctorResult.rows[0].id;
      const today = new Date().toISOString().split("T")[0];

      const result = await pool.query(
        `SELECT 
          a.*,
          u.full_name as patient_name,
          u.avatar_url as patient_avatar,
          p.phone as patient_phone
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN profiles p ON a.user_id = p.id
        WHERE a.doctor_id = $1 
          AND a.appointment_date > $2 
          AND a.status = 'scheduled'
        ORDER BY a.appointment_date ASC, a.appointment_time ASC
        LIMIT 10`,
        [doctorId, today],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Get upcoming appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  },
);

// Update appointment status
router.patch(
  "/appointments/:id/status",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      // Verify the doctor owns this appointment
      const doctorResult = await pool.query(
        "SELECT id FROM doctors WHERE user_id = $1",
        [userId],
      );

      if (doctorResult.rows.length === 0) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      const doctorId = doctorResult.rows[0].id;

      // Update appointment
      const result = await pool.query(
        `UPDATE appointments 
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND doctor_id = $3
        RETURNING *`,
        [status, id, doctorId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update appointment status error:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  },
);

// Get patient details for doctor
router.get("/patients/:patientId", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const userId = req.user?.id;

    // Verify the doctor has access to this patient (has appointments)
    const doctorResult = await pool.query(
      "SELECT id FROM doctors WHERE user_id = $1",
      [userId],
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0].id;

    // Check if doctor has appointments with this patient
    const accessCheck = await pool.query(
      "SELECT id FROM appointments WHERE doctor_id = $1 AND user_id = $2 LIMIT 1",
      [doctorId, patientId],
    );

    if (accessCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "No access to this patient's records" });
    }

    // Get patient details
    const patientResult = await pool.query(
      `SELECT 
          u.id, u.email, u.full_name, u.avatar_url,
          p.phone, p.date_of_birth, p.gender
        FROM users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE u.id = $1`,
      [patientId],
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Get patient's health records
    const healthRecords = await pool.query(
      "SELECT * FROM health_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
      [patientId],
    );

    // Get patient's symptom checks
    const symptomChecks = await pool.query(
      "SELECT * FROM symptom_checks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [patientId],
    );

    res.json({
      patient: patientResult.rows[0],
      healthRecords: healthRecords.rows,
      symptomChecks: symptomChecks.rows,
    });
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
});

export default router;
