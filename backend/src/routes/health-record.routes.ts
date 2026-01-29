import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user's health records
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM health_records WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get health records error:", error);
    res.status(500).json({ error: "Failed to fetch health records" });
  }
});

// Get single health record
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "SELECT * FROM health_records WHERE id = $1 AND user_id = $2",
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Health record not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get health record error:", error);
    res.status(500).json({ error: "Failed to fetch health record" });
  }
});

// Create health record
router.post(
  "/",
  authenticate,
  [
    body("record_type").isIn([
      "symptom_check",
      "prescription",
      "lab_result",
      "consultation",
    ]),
    body("title").notEmpty().trim(),
    body("description").optional().trim(),
    body("data").optional(),
    body("file_url").optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { record_type, title, description, data, file_url } = req.body;

      const result = await query(
        `INSERT INTO health_records (user_id, record_type, title, description, data, file_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.user!.id,
          record_type,
          title,
          description,
          JSON.stringify(data),
          file_url,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Create health record error:", error);
      res.status(500).json({ error: "Failed to create health record" });
    }
  },
);

// Delete health record
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM health_records WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Health record not found" });
    }

    res.json({ message: "Health record deleted" });
  } catch (error) {
    console.error("Delete health record error:", error);
    res.status(500).json({ error: "Failed to delete health record" });
  }
});

export default router;
