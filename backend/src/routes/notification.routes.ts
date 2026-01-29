import { Router, Response } from "express";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user's notifications
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put(
  "/:id/read",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const result = await query(
        "UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, req.user!.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update notification error:", error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  },
);

// Mark all notifications as read
router.put(
  "/read-all",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      await query(
        "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false",
        [req.user!.id],
      );

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Update all notifications error:", error);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  },
);

export default router;
