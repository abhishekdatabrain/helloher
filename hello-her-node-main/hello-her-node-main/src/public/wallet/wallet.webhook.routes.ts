import express from "express";
import { Router } from "express";
import { razorpayWebhook } from "./webhook.controller" 

const router = Router();

router.post("/razorpay", express.raw({ type: "application/json" }), razorpayWebhook);

export default router;
