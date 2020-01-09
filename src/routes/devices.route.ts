import { Router } from "express";
import { create, destroy } from "../controllers/devices.controller";

const router = Router();

router.post("/:user_id", create);
router.delete("/:user_id/:token", destroy);

export default router;
