import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user profile
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT * FROM profiles WHERE id = $1", [
      req.user!.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile
router.put(
  "/",
  authenticate,
  [
    body("full_name").optional().trim(),
    body("phone").optional().trim(),
    body("date_of_birth").optional().isISO8601(),
    body("gender").optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { full_name, phone, date_of_birth, gender, avatar_url } = req.body;

      const result = await query(
        `INSERT INTO profiles (id, full_name, phone, date_of_birth, gender, avatar_url, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           date_of_birth = EXCLUDED.date_of_birth,
           gender = EXCLUDED.gender,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()
         RETURNING *`,
        [req.user!.id, full_name, phone, date_of_birth, gender, avatar_url],
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

export default router;
