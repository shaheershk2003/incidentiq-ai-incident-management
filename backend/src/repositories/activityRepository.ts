import { ObjectId } from "mongodb";
import { getMongoDB } from "../config/mongodb";

export interface ActivityEvent {
  incidentId: number;
  eventType: string;
  actorId: number;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export async function createActivityEvent(
  event: ActivityEvent
): Promise<void> {
  const db = getMongoDB();

  await db.collection("activity_events").insertOne({
    _id: new ObjectId(),
    incidentId: event.incidentId,
    eventType: event.eventType,
    actorId: event.actorId,
    metadata: event.metadata,
    timestamp: event.timestamp,
  });
}

export async function getIncidentActivity(
  incidentId: number
): Promise<ActivityEvent[]> {
  const db = getMongoDB();

  return db
    .collection<ActivityEvent>("activity_events")
    .find({ incidentId })
    .sort({ timestamp: -1 })
    .toArray();
}