import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { config } from "../config";
import { query } from "../db";
import { User } from "../types";

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const result = await query(
        "SELECT id, email, full_name, avatar_url, email_verified FROM users WHERE id = $1",
        [payload.userId],
      );

      if (result.rows.length === 0) {
        return done(null, false);
      }

      return done(null, result.rows[0]);
    } catch (error) {
      return done(error, false);
    }
  }),
);

// Google OAuth Strategy
if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const fullName = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(
              new Error("No email found in Google profile"),
              undefined,
            );
          }

          // Check if user exists with this Google ID
          let result = await query("SELECT * FROM users WHERE google_id = $1", [
            googleId,
          ]);

          let user: User;

          if (result.rows.length > 0) {
            // User exists, update their info
            user = result.rows[0];
            await query(
              "UPDATE users SET full_name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3",
              [fullName, avatarUrl, user.id],
            );
          } else {
            // Check if email already exists (maybe registered with password)
            result = await query("SELECT * FROM users WHERE email = $1", [
              email,
            ]);

            if (result.rows.length > 0) {
              // Link existing account with Google
              user = result.rows[0];
              await query(
                "UPDATE users SET google_id = $1, full_name = $2, avatar_url = $3, email_verified = true, updated_at = NOW() WHERE id = $4",
                [googleId, fullName, avatarUrl, user.id],
              );
            } else {
              // Create new user
              result = await query(
                `INSERT INTO users (email, google_id, full_name, avatar_url, email_verified) 
                 VALUES ($1, $2, $3, $4, true) 
                 RETURNING *`,
                [email, googleId, fullName, avatarUrl],
              );
              user = result.rows[0];

              // Create profile automatically
              await query(
                `INSERT INTO profiles (id, email, full_name, avatar_url) 
                 VALUES ($1, $2, $3, $4)`,
                [user.id, email, fullName, avatarUrl],
              );
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );
}

export default passport;
