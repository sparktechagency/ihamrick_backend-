import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SearchController } from "./search.controller";
import { SearchValidation } from "./search.validation";

const router = express.Router();

router.get(
  "/",
  validateRequest(SearchValidation.searchSchema),
  SearchController.globalSearch
);

export const SearchRoutes = router;
