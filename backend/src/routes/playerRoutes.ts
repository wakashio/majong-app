import { Router } from "express";
import { playerController } from "../controllers/playerController";

const router = Router();

router.get("/", playerController.list);
router.get("/:id", playerController.get);
router.get("/:id/statistics", playerController.getStatistics);
router.get("/:id/history", playerController.getHistory);
router.post("/", playerController.create);
router.post("/bulk", playerController.bulkCreate);
router.put("/:id", playerController.update);
router.delete("/:id", playerController.delete);

export default router;

