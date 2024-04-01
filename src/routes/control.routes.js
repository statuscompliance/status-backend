import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
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

router.get("/control", getControls);

router.get("/control/:id", getControl);

router.get("/catalogControls/:id", getCatalogControls);

router.get("/control/:id/input_controls", getInputControlsByControlId);

router.post("/control", createControl);

router.patch("/control/:id", updateControl);

router.delete("/control/:id", deleteControl); // Authenticated users only

router.delete("/control/:id/input_controls", deleteInputControlsByControlId);

export default router;
