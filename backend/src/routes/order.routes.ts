import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query, getClient } from "../db";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Get user's orders
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get single order with items
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const orderResult = await query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [id, req.user!.id],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const itemsResult = await query(
      `SELECT oi.*, m.name, m.description, m.image_url
       FROM order_items oi
       JOIN medicines m ON oi.medicine_id = m.id
       WHERE oi.order_id = $1`,
      [id],
    );

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Create order from cart
router.post(
  "/",
  authenticate,
  [body("shipping_address").notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    const client = await getClient();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shipping_address } = req.body;

      await client.query("BEGIN");

      // Get cart items
      const cartResult = await client.query(
        `SELECT ci.*, m.price, m.stock_quantity
         FROM cart_items ci
         JOIN medicines m ON ci.medicine_id = m.id
         WHERE ci.user_id = $1`,
        [req.user!.id],
      );

      if (cartResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate total and check stock
      let totalAmount = 0;
      for (const item of cartResult.rows) {
        if (item.stock_quantity < item.quantity) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: `Insufficient stock for ${item.name}` });
        }
        totalAmount += item.price * item.quantity;
      }

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, shipping_address, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [req.user!.id, totalAmount, shipping_address],
      );

      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of cartResult.rows) {
        await client.query(
          `INSERT INTO order_items (order_id, medicine_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.medicine_id, item.quantity, item.price],
        );

        await client.query(
          "UPDATE medicines SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.medicine_id],
        );
      }

      // Clear cart
      await client.query("DELETE FROM cart_items WHERE user_id = $1", [
        req.user!.id,
      ]);

      await client.query("COMMIT");

      res.status(201).json(order);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    } finally {
      client.release();
    }
  },
);

export default router;
