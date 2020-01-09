import { Router } from "express";
import { create, destroy } from "../controllers/notifications.controller";

const router = Router();

router.post("", create);
router.delete("", destroy);

export default router;
