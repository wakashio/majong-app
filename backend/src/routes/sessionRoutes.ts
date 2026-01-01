import { Router } from "express";
import { sessionController } from "../controllers/sessionController";

const router = Router();

router.get("/", sessionController.list);
router.get("/:id", sessionController.get);
router.get("/:id/statistics", sessionController.getStatistics);
router.post("/", sessionController.create);
router.put("/:id", sessionController.update);
router.delete("/:id", sessionController.delete);

export default router;

