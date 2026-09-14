import { Router } from "express";
import {
  loginController,
  getCurrentUser,
} from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", loginController);
router.get("/me", authenticate, getCurrentUser);

export default router;