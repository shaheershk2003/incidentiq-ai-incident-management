import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignIncident,
  CreateIncidentInput,
  Incident,
} from "../repositories/incidentRepository";

import { logActivity } from "./activityService";

export async function createNewIncident(
  input: CreateIncidentInput
): Promise<Incident> {
  console.log("Creating incident...");

  const incident = await createIncident(input);

  console.log(
    `Incident created: ${incident.incidentNumber}, logging activity...`
  );

  await logActivity(
    Number(incident.id),
    "INCIDENT_CREATED",
    input.createdBy,
    {
      incidentNumber: incident.incidentNumber,
      hasSnapshot: Boolean(input.snapshotData),
    }
  );

  console.log(
    `Activity logged for ${incident.incidentNumber}`
  );

  return incident;
}

export async function listIncidents(): Promise<Incident[]> {
  return getAllIncidents();
}

export async function getSingleIncident(
  id: number
): Promise<Incident | null> {
  return getIncidentById(id);
}

export async function changeIncidentStatus(
  id: number,
  status: Incident["status"]
): Promise<Incident | null> {
  return updateIncidentStatus(id, status);
}

export async function assignIncidentToUser(
  incidentId: number,
  assignedTo: number
): Promise<Incident | null> {
  return assignIncident(incidentId, assignedTo);
}