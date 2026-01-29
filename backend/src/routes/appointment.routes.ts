import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user's appointments
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT a.*, d.name as doctor_name, d.specialty, d.avatar_url as doctor_avatar
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.user_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Get single appointment
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*, d.name as doctor_name, d.specialty, d.avatar_url as doctor_avatar
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

// Create appointment
router.post(
  "/",
  authenticate,
  [
    body("doctor_id").isUUID(),
    body("appointment_date").isISO8601(),
    body("appointment_time").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("notes").optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctor_id, appointment_date, appointment_time, notes } = req.body;

      // Check if doctor exists
      const doctorResult = await query("SELECT id FROM doctors WHERE id = $1", [
        doctor_id,
      ]);

      if (doctorResult.rows.length === 0) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      const result = await query(
        `INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, notes, status)
         VALUES ($1, $2, $3, $4, $5, 'scheduled')
         RETURNING *`,
        [req.user!.id, doctor_id, appointment_date, appointment_time, notes],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  },
);

// Update appointment
router.put(
  "/:id",
  authenticate,
  [
    body("appointment_date").optional().isISO8601(),
    body("appointment_time")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("status").optional().isIn(["scheduled", "completed", "cancelled"]),
    body("notes").optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { appointment_date, appointment_time, status, notes } = req.body;

      const result = await query(
        `UPDATE appointments 
         SET appointment_date = COALESCE($1, appointment_date),
             appointment_time = COALESCE($2, appointment_time),
             status = COALESCE($3, status),
             notes = COALESCE($4, notes),
             updated_at = NOW()
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [appointment_date, appointment_time, status, notes, id, req.user!.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  },
);

// Delete appointment
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
});

export default router;
