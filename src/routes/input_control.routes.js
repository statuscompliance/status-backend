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
router.get("/input_controls", getInputControls);
router.get("/input_controls/:id", getInputControl);
router.get("/input_controls/:input_id/controls/:control_id/values", getValuesByInputIdAndControlId);
router.post("/input_controls", createInputControl);
router.patch("/input_controls/:id", updateInputControl);
router.delete("/input_controls/:id", deleteInputControl);

export default router;
