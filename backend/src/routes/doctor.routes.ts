import { Router, Response } from "express";
import { query } from "../db";
import { optionalAuth } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get all doctors (public access)
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT DISTINCT ON (full_name, specialty) * FROM doctors ORDER BY full_name, specialty, rating DESC",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// Get single doctor (public access)
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query("SELECT * FROM doctors WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get doctor error:", error);
    res.status(500).json({ error: "Failed to fetch doctor" });
  }
});

export default router;
