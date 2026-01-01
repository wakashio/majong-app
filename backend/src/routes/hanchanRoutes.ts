import { Router } from "express";
import { hanchanController } from "../controllers/hanchanController";

const router = Router();

router.get("/", hanchanController.list);
router.get("/:id", hanchanController.get);
router.get("/:id/statistics", hanchanController.getStatistics);
router.get("/:id/history", hanchanController.getHistory);
router.post("/", hanchanController.create);
router.put("/:id", hanchanController.update);
router.delete("/:id", hanchanController.delete);

export default router;

