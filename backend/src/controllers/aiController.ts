import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getSingleIncident } from "../services/incidentService";
import { analyzeIncident } from "../services/aiAnalysisService";
import { logActivity } from "../services/activityService";

export async function analyzeIncidentController(
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

    if (
      !Number.isInteger(incidentId) ||
      incidentId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
      return;
    }

    const incident =
      await getSingleIncident(incidentId);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      });
      return;
    }

    const analysis =
      await analyzeIncident(incident);

    /*
     * Store the complete AI analysis in MongoDB.
     * This allows the activity timeline to retain the
     * actual analysis instead of only storing severity.
     */
    await logActivity(
      incidentId,
      "AI_ANALYSIS",
      req.user.userId,
      {
        suggestedCategory:
          analysis.suggestedCategory,

        severity:
          analysis.severity,

        confidence:
          analysis.confidence,

        summary:
          analysis.summary,

        probableCause:
          analysis.probableCause,

        recommendedActions:
          analysis.recommendedActions,

        possibleResolution:
          analysis.possibleResolution,
      }
    );

    res.status(200).json({
      success: true,
      incidentId,
      analysis,
    });
  } catch (error) {
    console.error(
      "AI analysis failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to analyze incident",
    });
  }
}