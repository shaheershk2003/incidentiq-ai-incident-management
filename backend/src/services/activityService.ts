    import {
    createActivityEvent,
    getIncidentActivity,
    } from "../repositories/activityRepository";

    export async function logActivity(
    incidentId: number,
    eventType: string,
    actorId: number,
    metadata: Record<string, unknown> = {}
    ): Promise<void> {
    await createActivityEvent({
        incidentId,
        eventType,
        actorId,
        metadata,
        timestamp: new Date(),
    });
    }

    export async function getActivityForIncident(
    incidentId: number
    ) {
    return getIncidentActivity(incidentId);
    }