import { Router, Response } from "express";
import { query } from "../db";
import { optionalAuth } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get all medicines (public access)
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT * FROM medicines ORDER BY name");

    res.json(result.rows);
  } catch (error) {
    console.error("Get medicines error:", error);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

// Get single medicine (public access)
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query("SELECT * FROM medicines WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get medicine error:", error);
    res.status(500).json({ error: "Failed to fetch medicine" });
  }
});

export default router;
