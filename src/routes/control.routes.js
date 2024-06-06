import { Router } from "express";
import {
  getControls,
  getControl,
  getCatalogControls,
  getInputControlsByControlId,
  createControl,
  updateControl,
  deleteControl,
  deleteInputControlsByControlId,
} from "../controllers/control.controller.js";

const router = Router();

// Controls
router.get("/controls", getControls);
router.get("/controls/:id", getControl);
router.post("/controls", createControl);
router.patch("/controls/:id", updateControl);
router.delete("/controls/:id", deleteControl);

// Catalog controls
router.get("/catalogs/:catalog_id/controls", getCatalogControls);

// Input_controls
router.get("/controls/:id/input_controls", getInputControlsByControlId);
router.delete("/controls/:id/input_controls", deleteInputControlsByControlId);

export default router;
