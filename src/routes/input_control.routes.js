import { Router } from "express";
import {
  getInputControls,
  getInputControl,
  getValuesByInputIdAndControlId,
  createInputControl,
  updateInputControl,
  deleteInputControl,
} from "../controllers/input_control.controller.js";

const router = Router();

// Input_controls
router.get("/input-controls", getInputControls);
router.get("/input-controls/:id", getInputControl);
router.get("/input-controls/:input_id/controls/:control_id/values", getValuesByInputIdAndControlId);
router.post("/input-controls", createInputControl);
router.patch("/input-controls/:id", updateInputControl);
router.delete("/input-controls/:id", deleteInputControl);

export default router;
