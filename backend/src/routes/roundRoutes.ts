import { Router } from "express";
import { roundController } from "../controllers/roundController";

const router = Router();

router.get("/hanchans/:hanchanId/rounds", roundController.list);
router.get("/rounds/:id", roundController.get);
router.post("/hanchans/:hanchanId/rounds", roundController.create);
router.put("/rounds/:id", roundController.update);
router.delete("/rounds/:id", roundController.delete);
router.post("/rounds/:id/nakis", roundController.createNaki);
router.post("/rounds/:id/riichis", roundController.createRiichi);
router.post("/rounds/:id/actions", roundController.createRoundAction);
router.delete("/rounds/:id/actions/:actionId", roundController.deleteRoundAction);
router.post("/rounds/:id/calculate-score", roundController.calculateScore);
router.post("/rounds/:id/calculate-next-settings", roundController.calculateNextSettings);
router.put("/rounds/:id/end", roundController.endRound);

export default router;

