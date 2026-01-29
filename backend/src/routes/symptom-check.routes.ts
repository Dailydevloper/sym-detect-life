import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user's symptom checks
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM symptom_checks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get symptom checks error:", error);
    res.status(500).json({ error: "Failed to fetch symptom checks" });
  }
});

// Get single symptom check
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      "SELECT * FROM symptom_checks WHERE id = $1 AND user_id = $2",
      [id, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Symptom check not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get symptom check error:", error);
    res.status(500).json({ error: "Failed to fetch symptom check" });
  }
});

// Create symptom check
router.post(
  "/",
  authenticate,
  [
    body("symptoms").isArray({ min: 1 }),
    body("ai_diagnosis").optional().trim(),
    body("recommendations").optional().trim(),
    body("severity_level").optional().isIn(["low", "medium", "high"]),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { symptoms, ai_diagnosis, recommendations, severity_level } =
        req.body;

      const result = await query(
        `INSERT INTO symptom_checks (user_id, symptoms, ai_diagnosis, recommendations, severity_level)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user!.id, symptoms, ai_diagnosis, recommendations, severity_level],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Create symptom check error:", error);
      res.status(500).json({ error: "Failed to create symptom check" });
    }
  },
);

export default router;
