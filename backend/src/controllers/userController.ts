import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getActiveUsers } from "../repositories/userRepository";

export async function getUsersController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const users = await getActiveUsers();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get users failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
}