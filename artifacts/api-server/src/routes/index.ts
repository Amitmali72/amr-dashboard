import { Router, type IRouter } from "express";
import healthRouter from "./health";
import amrRouter from "./amr";
import ragRouter from "./rag";

const router: IRouter = Router();

router.use(healthRouter);
router.use(amrRouter);
router.use(ragRouter);

export default router;
