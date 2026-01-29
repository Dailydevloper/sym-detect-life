import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db";
import { hashPassword, comparePassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";
import passport from "passport";
import { config } from "../config";

const router = Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName } = req.body;

      // Check if user exists
      const existingUser = await query(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, email_verified) 
         VALUES ($1, $2, $3, false) 
         RETURNING id, email, full_name, avatar_url, email_verified, created_at`,
        [email, passwordHash, fullName || null],
      );

      const user = result.rows[0];

      // Create profile
      await query(
        `INSERT INTO profiles (id, email, full_name) 
         VALUES ($1, $2, $3)`,
        [user.id, email, fullName || null],
      );

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Get user
      const result = await query(
        "SELECT id, email, password_hash, full_name, avatar_url, email_verified FROM users WHERE email = $1",
        [email],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];

      // Check password
      if (!user.password_hash) {
        return res
          .status(401)
          .json({ error: "Please use Google sign in for this account" });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Logout (client-side only, just return success)
router.post("/logout", (req, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

// Google OAuth initiation
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.frontendUrl}/auth`,
  }),
  (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${config.frontendUrl}/auth?error=authentication_failed`,
        );
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: req.user.id,
        email: req.user.email,
      });
      const refreshToken = generateRefreshToken({
        userId: req.user.id,
        email: req.user.email,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${config.frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
      );
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${config.frontendUrl}/auth?error=authentication_failed`);
    }
  },
);

export default router;
