import { Router } from "express";

import {
  getUsersController,
} from "../controllers/userController";

import {
  authenticate,
} from "../middleware/authMiddleware";

import {
  authorizeRoles,
} from "../middleware/roleMiddleware";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getUsersController
);

export default router;