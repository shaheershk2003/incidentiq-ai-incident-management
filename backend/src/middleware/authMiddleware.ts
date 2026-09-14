import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-later";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: "ADMIN" | "AGENT";
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const token = authorization.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "ADMIN" | "AGENT";
    };

    req.user = {
      userId: Number(payload.userId),
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}