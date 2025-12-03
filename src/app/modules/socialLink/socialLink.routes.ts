import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { socialLinkController } from "./socialLink.controller";
import { socialLinkValidation } from "./socialLink.validation";
import { UserRole } from "../../models";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(socialLinkValidation.createSocialLink),
  socialLinkController.createSocialLink
);

router.put(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(socialLinkValidation.updateSocialLink),
  socialLinkController.updateSocialLink
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  socialLinkController.deleteSocialLink
);

// Public routes

router.get("/", socialLinkController.getSocialLinkList);

router.get("/:id", socialLinkController.getSocialLinkById);

export const socialLinkRoutes = router;
