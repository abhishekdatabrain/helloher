/**
 * ===============================================
 * 🌐 Centralized Route Loader (src/routes/index.ts)
 * ===============================================
 * Loads and registers all application routes.
 * Each module is mounted under its respective path.
 * ===============================================
 */

import { Router } from "express";

// ===============================
// Admin Routes
// ===============================
import roleRoutes from "../admin/role/role.routes";
import bankRoutes from "../admin/bank/bank.routes"
import adminRoutes from "../admin/admin/admin.routes";
import policyRoutes from "../admin/policy/policy.route";
import avatarRoutes from "../admin/avatar/avatar.routes"
import couponRoutes from "../admin/coupon/coupon.routes";
import bannerRoutes from "../admin/banner/banner.routes";
import RevenueRoutes from "../admin/revenue/revenue.routes"
import dashboardRoutes from "../admin/dashboard/dashboard.routes"
import agreementRoutes from "../admin/agreement/agreement.routes"
import rechargePlanRoutes from "../admin/recharge/rechargePlan.routes";
import paidProfilePlanRoutes from "../admin/paidProfile/paidProfilePlan.routes"
import availabilityPenaltyRoutes from "../admin/availabilityPenalty/availabilityPenalty.routes";
import faqRoutes from "../admin/faq/faq.routes";
import privacyPolicyRoutes from "../admin/privacyPolicy/privacyPolicy.routes";
import chatCommissionRoutes from "../admin/chatCommission/chatCommission.routes";
import LanguageRoutes from "../admin/language/language.routes";
import SOSRoutes from "../admin/sos/sos.routes"

// ===============================
// Public Routes
// ===============================
import otpRouter from "../public/OTP/otp.routes";
import callRoutes from "../public/call/call.routes"
import userRoutes from "../public/user/user.routes";
import termsRoutes from "../admin/terms/terms.routes";
import notesRoutes from "../public/notes/notes.routes";
import queryRoutes from "../public/query/query.routes";
import issueRoutes from "../public/issue/issue.routes";
import provider from "../public/Provider/provider.route";
import walletRoutes from "../public/wallet/wallet.routes"
import ratingRouter from "../public/rating/rating.routes";
import reportsRoutes from "../public/report/report.routes"
import contact from "../public/contactUs/contactUs.router";
import messageRoutes from "../public/chat2/message.routes";
import stateCityRoutes from "../public/statecity/statecity.routes";
import testimonial from "../public/testimonial/testimonial.routes";
import experienceRoutes from "../public/experience/experience.routes";
import withdrawalRoutes from "../public/withdrawals/withdrawals.routes"
import walletWebhookRoutes from "../public/wallet/wallet.webhook.routes";
import paidProfileRoutes from "../public/paidProfile/paidProfile.routes";
import commissionRoutes from "../public/commissionSlab/commission.routes"
import notificationRoutes from "../public/notification/notification.routes";
import walletTransactionRoutes from "../public/Wallet_Transaction/walletTransaction.routes";
import helpdeskRoutes from "../public/helpdesk/helpdesk.routes";
import chatRequestRoutes from "../public/chatRequest/chatRequest.routes";
import trustScoreRoutes from "../public/trustScore/trustScore.routes";

const router = Router();

// ---------- Admin ----------
router.use("/bank", bankRoutes);
router.use("/role", roleRoutes);
router.use("/bank", bankRoutes);
router.use("/admin", adminRoutes);
router.use("/terms", termsRoutes);
router.use("/banner", bannerRoutes);
router.use("/coupon", couponRoutes);
router.use("/policy", policyRoutes);
router.use("/revenue", RevenueRoutes);
router.use("/agreement", agreementRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/withdrawals", withdrawalRoutes);
router.use("/recharge-plans", rechargePlanRoutes);
router.use("/profile-plan", paidProfilePlanRoutes);
router.use("/transactions", walletTransactionRoutes)
router.use("/availability-penalty", availabilityPenaltyRoutes);
router.use("/faq", faqRoutes);
router.use("/privacy-policy", privacyPolicyRoutes);
router.use("/chat-commission", chatCommissionRoutes);
router.use("/chat-requests", chatRequestRoutes);
router.use("/language", LanguageRoutes);
router.use("/sos", SOSRoutes);

// ---------- Public ----------
router.use("/otp", otpRouter);
router.use("/user", userRoutes);
router.use("/contact", contact);
router.use("/call", callRoutes);
router.use("/notes", notesRoutes);
router.use("/provider", provider)
router.use("/query", queryRoutes);
router.use("/issue", issueRoutes);
router.use("/rating", ratingRouter);
router.use("/wallet", walletRoutes);
router.use("/avatar", avatarRoutes);
router.use("/reports", reportsRoutes)
router.use("/message", messageRoutes);
router.use("/testimonial", testimonial);
router.use("/location", stateCityRoutes);
router.use("/commission", commissionRoutes);
router.use("/experience", experienceRoutes);
router.use("/webhooks", walletWebhookRoutes);
router.use("/paid-profile", paidProfileRoutes);
router.use("/notifications", notificationRoutes);
router.use("/trustScore", trustScoreRoutes);
router.use("/helpdesk", helpdeskRoutes);

export default router;
