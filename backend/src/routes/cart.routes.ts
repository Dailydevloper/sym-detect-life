import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user's cart
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT ci.*, m.name, m.description, m.price, m.image_url, m.stock_quantity
       FROM cart_items ci
       JOIN medicines m ON ci.medicine_id = m.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Add item to cart (or update quantity if exists)
router.post(
  "/",
  authenticate,
  [body("medicine_id").isUUID(), body("quantity").isInt({ min: 1 })],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { medicine_id, quantity } = req.body;

      // Check if medicine exists and has stock
      const medicineResult = await query(
        "SELECT stock_quantity FROM medicines WHERE id = $1",
        [medicine_id],
      );

      if (medicineResult.rows.length === 0) {
        return res.status(404).json({ error: "Medicine not found" });
      }

      if (medicineResult.rows[0].stock_quantity < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      // Upsert cart item
      const result = await query(
        `INSERT INTO cart_items (user_id, medicine_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, medicine_id) DO UPDATE SET
           quantity = EXCLUDED.quantity
         RETURNING *`,
        [req.user!.id, medicine_id, quantity],
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  },
);

// Update cart item quantity
router.put(
  "/:medicineId",
  authenticate,
  [body("quantity").isInt({ min: 1 })],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { medicineId } = req.params;
      const { quantity } = req.body;

      const result = await query(
        `UPDATE cart_items 
         SET quantity = $1
         WHERE user_id = $2 AND medicine_id = $3
         RETURNING *`,
        [quantity, req.user!.id, medicineId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update cart error:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  },
);

// Remove item from cart
router.delete(
  "/:medicineId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { medicineId } = req.params;

      const result = await query(
        "DELETE FROM cart_items WHERE user_id = $1 AND medicine_id = $2 RETURNING *",
        [req.user!.id, medicineId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  },
);

// Clear cart
router.delete("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query("DELETE FROM cart_items WHERE user_id = $1", [req.user!.id]);

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

export default router;
