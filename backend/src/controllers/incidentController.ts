import { Request, Response } from "express";
import {
  createNewIncident,
  listIncidents,
  getSingleIncident,
  changeIncidentStatus,
  assignIncidentToUser,
} from "../services/incidentService";

import {
  addComment,
  listComments,
} from "../services/commentService";

import {
  logActivity,
  getActivityForIncident,
} from "../services/activityService";

import { AuthenticatedRequest } from "../middleware/authMiddleware";

function validateSnapshot(
  snapshotData: unknown
): string | null {
  if (
    snapshotData === undefined ||
    snapshotData === null ||
    snapshotData === ""
  ) {
    return null;
  }

  if (typeof snapshotData !== "string") {
    throw new Error("Invalid snapshot format");
  }

  if (!snapshotData.startsWith("data:image/")) {
    throw new Error("Snapshot must be an image");
  }

  const allowedTypes = [
    "data:image/jpeg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,",
  ];

  const validType = allowedTypes.some(type =>
    snapshotData.startsWith(type)
  );

  if (!validType) {
    throw new Error(
      "Only JPG, PNG and WebP snapshots are supported"
    );
  }

  const base64Part =
    snapshotData.split(",")[1] || "";

  if (!base64Part) {
    throw new Error("Invalid snapshot data");
  }

  const approximateBytes =
    Math.floor(
      (base64Part.length * 3) / 4
    );

  const maxBytes = 5 * 1024 * 1024;

  if (approximateBytes > maxBytes) {
    throw new Error(
      "Snapshot size must be 5 MB or smaller"
    );
  }

  return snapshotData;
}

export async function createIncidentController(
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

    const {
      title,
      description,
      priority,
      category,
      snapshotData,
    } = req.body;

    if (
      !title ||
      !description ||
      !priority ||
      !category
    ) {
      res.status(400).json({
        success: false,
        message:
          "Title, description, priority and category are required",
      });
      return;
    }

    let validatedSnapshot: string | null = null;

    try {
      validatedSnapshot =
        validateSnapshot(snapshotData);
    } catch (snapshotError) {
      res.status(400).json({
        success: false,
        message:
          snapshotError instanceof Error
            ? snapshotError.message
            : "Invalid incident snapshot",
      });
      return;
    }

    const incident = await createNewIncident({
      title,
      description,
      priority,
      category,
      createdBy: req.user.userId,
      snapshotData: validatedSnapshot,
    });

    res.status(201).json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error("Create incident failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create incident",
    });
  }
}

export async function getIncidentsController(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const incidents = await listIncidents();

    res.status(200).json({
      success: true,
      incidents,
    });
  } catch (error) {
    console.error("Get incidents failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve incidents",
    });
  }
}

export async function getIncidentController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
      return;
    }

    const incident = await getSingleIncident(id);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error("Get incident failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve incident",
    });
  }
}

export async function updateIncidentStatusController(
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

    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ];

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
      return;
    }

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid incident status",
      });
      return;
    }

    const incident =
      await changeIncidentStatus(
        id,
        status
      );

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      });
      return;
    }

    await logActivity(
      id,
      "STATUS_CHANGED",
      req.user.userId,
      {
        newStatus: status,
      }
    );

    res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error(
      "Update incident status failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update incident status",
    });
  }
}

export async function assignIncidentController(
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
    const assignedTo = Number(
      req.body.assignedTo
    );

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

    if (
      !Number.isInteger(assignedTo) ||
      assignedTo <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const incident =
      await assignIncidentToUser(
        incidentId,
        assignedTo
      );

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      });
      return;
    }

    await logActivity(
      incidentId,
      "INCIDENT_ASSIGNED",
      req.user.userId,
      {
        assignedTo,
      }
    );

    res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error(
      "Assign incident failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to assign incident",
    });
  }
}

export async function getIncidentActivityController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
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

    const activities =
      await getActivityForIncident(
        incidentId
      );

    res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error(
      "Get incident activity failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve incident activity",
    });
  }
}

export async function createCommentController(
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
    const { commentText } = req.body;

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

    if (
      typeof commentText !== "string" ||
      commentText.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
      return;
    }

    const comment = await addComment(
      incidentId,
      req.user.userId,
      commentText.trim()
    );

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error(
      "Create comment failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create comment",
    });
  }
}

export async function getCommentsController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
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

    const comments =
      await listComments(incidentId);

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error(
      "Get comments failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve comments",
    });
  }
}