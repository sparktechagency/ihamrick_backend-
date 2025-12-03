import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "../../models";
import { notificationController } from "./notification.controller";

const router = express.Router();

router.post(
  "/send-notifications",
  auth(UserRole.ADMIN),
  notificationController.sendNotifications
);

export const notificationRoutes = router;
