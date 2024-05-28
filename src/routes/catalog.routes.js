import { Router } from "express";
import {
  getCatalogs,
  getCatalog,
  createCatalog,
  getTpa,
  saveTpa,
  deleteTPAByCatalogId,
  updateCatalog,
  deleteCatalog,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/catalog", getCatalogs);

router.get("/catalog/:id", getCatalog);

router.post("/catalog", createCatalog);

router.get("/tpa/:catalogId", getTpa);

router.post("/save-tpa", saveTpa);

router.delete("/delete-tpa/:catalogId", deleteTPAByCatalogId);

router.patch("/catalog/:id", updateCatalog);

router.delete("/catalog/:id", deleteCatalog);

export default router;
