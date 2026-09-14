import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { runIncidentAgent } from "../services/aiAgentService";

export async function runAgentController(
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

    const incidentId = Number(req.params.id);

    if (!Number.isInteger(incidentId) || incidentId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
      return;
    }

    const result = await runIncidentAgent(
      incidentId,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      incidentId,
      agent: result,
    });
  } catch (error) {
    console.error("AI Agent failed:", error);

    res.status(500).json({
      success: false,
      message: "AI Agent execution failed",
    });
  }
}