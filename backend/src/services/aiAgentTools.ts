import {
  getSingleIncident,
  changeIncidentStatus,
} from "./incidentService";
import { addComment } from "./commentService";
import { logActivity } from "./activityService";

export async function getIncidentTool(incidentId: number) {
  return getSingleIncident(incidentId);
}

export async function updateIncidentStatusTool(
  incidentId: number,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED",
) {
  return changeIncidentStatus(incidentId, status);
}

export async function addCommentTool(
  incidentId: number,
  actorId: number,
  comment: string,
) {
  return addComment(incidentId, actorId, comment);
}

export async function logAgentActivityTool(
  incidentId: number,
  actorId: number,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  return logActivity(
    incidentId,
    "AI_AGENT_RUN",
    actorId,
    {
      action,
      ...metadata,
    },
  );
}