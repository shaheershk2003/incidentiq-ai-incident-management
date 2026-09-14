import { Router } from "express";

import {
  createIncidentController,
  getIncidentsController,
  getIncidentController,
  updateIncidentStatusController,
  assignIncidentController,
  getIncidentActivityController,
  createCommentController,
  getCommentsController,
} from "../controllers/incidentController";

import { authenticate } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

import { analyzeIncidentController } from "../controllers/aiController";
import { runAgentController } from "../controllers/aiAgentController";

const router = Router();

/*
|--------------------------------------------------------------------------
| INCIDENT VIEW
|--------------------------------------------------------------------------
| ADMIN + AGENT
*/

router.get(
  "/",
  authenticate,
  getIncidentsController
);

router.get(
  "/:id",
  authenticate,
  getIncidentController
);

/*
|--------------------------------------------------------------------------
| INCIDENT CREATION
|--------------------------------------------------------------------------
| ADMIN ONLY
*/

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createIncidentController
);

/*
|--------------------------------------------------------------------------
| INCIDENT MANAGEMENT
|--------------------------------------------------------------------------
| ADMIN ONLY
*/

router.put(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN"),
  updateIncidentStatusController
);

router.put(
  "/:id/assign",
  authenticate,
  authorizeRoles("ADMIN"),
  assignIncidentController
);

/*
|--------------------------------------------------------------------------
| ACTIVITY
|--------------------------------------------------------------------------
| ADMIN + AGENT
*/

router.get(
  "/:id/activity",
  authenticate,
  getIncidentActivityController
);

/*
|--------------------------------------------------------------------------
| COMMENTS
|--------------------------------------------------------------------------
| ADMIN + AGENT
*/

router.post(
  "/:id/comments",
  authenticate,
  authorizeRoles("ADMIN", "AGENT"),
  createCommentController
);

router.get(
  "/:id/comments",
  authenticate,
  getCommentsController
);

/*
|--------------------------------------------------------------------------
| AI ANALYSIS
|--------------------------------------------------------------------------
| ADMIN + AGENT
*/

router.post(
  "/:id/analyze",
  authenticate,
  authorizeRoles("ADMIN", "AGENT"),
  analyzeIncidentController
);

/*
|--------------------------------------------------------------------------
| AI AGENT
|--------------------------------------------------------------------------
| ADMIN + AGENT
*/

router.post(
  "/:id/agent/run",
  authenticate,
  authorizeRoles("ADMIN", "AGENT"),
  runAgentController
);

export default router;