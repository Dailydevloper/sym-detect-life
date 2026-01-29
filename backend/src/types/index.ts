import { Request } from "express";

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name?: string;
  avatar_url?: string;
  google_id?: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: Date;
  gender?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export type AuthRequest = Request & {
  user?: User;
};
