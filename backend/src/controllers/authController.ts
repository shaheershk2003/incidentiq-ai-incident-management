import { Request, Response } from "express";
import { login } from "../services/authService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const result = await login(email, password);

    if (!result) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response
): void {
  res.status(200).json({
    success: true,
    user: req.user,
  });
}