import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { contactController } from "./contact.controller";
import { contactValidation } from "./contact.validation";

const router = express.Router();

router.post(
  "/",
  validateRequest(contactValidation.createContactValidationSchema),
  contactController.createContact
);

export const contactRoutes = router;
