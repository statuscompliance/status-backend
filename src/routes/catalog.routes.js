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

// Catalogs
router.get("/catalogs", getCatalogs);
router.get("/catalogs/:id", getCatalog);
router.post("/catalogs", createCatalog);
router.patch("/catalogs/:id", updateCatalog);
router.delete("/catalogs/:id", deleteCatalog);

// TPAs
router.get("/catalogs/:catalog_id/tpa", getTpa);
router.post("/catalogs/tpa", saveTpa);
router.delete("/catalogs/:catalog_id/tpa", deleteTPAByCatalogId);

export default router;
