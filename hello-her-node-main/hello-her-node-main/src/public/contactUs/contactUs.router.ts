import { Router } from "express";
import {
  raiseQuery,
  getQueryList,
  getQueryById,
  changeQueryStatus,
  deleteQuery,
} from "./contactUsController";

const router = Router();

router.get("/", getQueryList);

router.post("/raise-query", raiseQuery);

router.get("/:_id", getQueryById);

router.put("/:_id", changeQueryStatus);
router.delete("/:_id", deleteQuery);

export default router;
