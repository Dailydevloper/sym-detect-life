import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { query } from "../db";
import { AuthRequest } from "../types";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Get user from database
    const result = await query(
      "SELECT id, email, full_name, avatar_url, email_verified, role, created_at, updated_at FROM users WHERE id = $1",
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      const result = await query(
        "SELECT id, email, full_name, avatar_url, email_verified, role, created_at, updated_at FROM users WHERE id = $1",
        [decoded.userId],
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (req.user.role !== requiredRole) {
      res
        .status(403)
        .json({ error: `Access denied. ${requiredRole} role required.` });
      return;
    }

    next();
  };
};
