import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Withdrawal } from "../../modals/withdraw.model";
import { CommonService } from "../../services/common.services";
import ServiceProvider from "../../modals/serviceProvider.model";
import { WalletTransaction } from "../../modals/walletTransaction.model";
import CommissionModel from "../../modals/commission.model";

export const WithdrawalsService = new CommonService(Withdrawal);
const providerService = new CommonService(ServiceProvider);
const walletService = new CommonService(WalletTransaction);

export class WithdrawalsController {

    static async requestWithdrawal(req: Request, res: Response, next: NextFunction) {
        try {
            const { providerId, amount, note } = req.body;
            // const providerId = req.user?.id; // Assuming provider is logged in

            if (!providerId) throw new ApiError(401, "Unauthorized - Provider ID missing");

            // 🧾 Fetch provider details
            const provider = await providerService.getById(providerId);
            if (!provider) throw new ApiError(404, "Service provider not found");

            // 🚫 Allow only users with role = 'provider'
            if (provider.role !== "provider") {
                throw new ApiError(403, "Only service providers can request withdrawals");
            }

            // 💰 Check withdrawal amount validity
            if (!amount || amount <= 0) {
                throw new ApiError(400, "Invalid withdrawal amount");
            }

            const commissionDoc = await CommissionModel.findOne();
            const minWithdrawalAmt = commissionDoc?.minimumWithdrawalAmount || 100;

            if (amount < minWithdrawalAmt) {
                throw new ApiError(400, `Minimum withdrawal amount is ${minWithdrawalAmt}`);
            }

            if (provider.totalEarnings < amount) {
                throw new ApiError(
                    400,
                    `Insufficient balance. Your total earnings are ₹${provider.totalEarnings.toFixed(2)}`
                );
            }

            const withdrawal = await WithdrawalsService.create({
                providerId,
                amount,
                note,
                status: "pending",
                requestedAt: new Date(),
            });

            // // 🧾 Deduct the withdrawal amount from provider's totalEarnings
            // await providerService.updateById(providerId, {
            //     totalEarnings: provider.totalEarnings - amount,
            // });

            return res
                .status(201)
                .json(new ApiResponse(201, withdrawal, "Withdrawal created successfully"));
        } catch (error) {
            next(error);
        }
    }

    /**
   * 🧠 Admin updates withdrawal (approve / cancel)
   */
    // static async updateWithdrawalStatus(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const { id } = req.params;
    //         const { status, adminNotes } = req.body; // expecting "approved" or "cancelled"
    //         const adminId = (req as any).user?.id;
    //         if (!id) throw new ApiError(400, "Withdrawal ID is required");
    //         if (!["approved", "rejected"].includes(status))
    //             throw new ApiError(400, "Invalid status value");

    //         const withdrawal = await WithdrawalsService.getById(id);
    //         if (!withdrawal) throw new ApiError(404, "Withdrawal not found");
    //         if (withdrawal.status !== "pending")
    //             throw new ApiError(400, `Cannot update withdrawal already marked as ${withdrawal.status}`);

    //         const provider = await providerService.getById(withdrawal.providerId);
    //         if (!provider) throw new ApiError(404, "Associated provider not found");

    //         if (status === "approved") {
    //             if (provider.totalEarnings < withdrawal.amount)
    //                 throw new ApiError(
    //                     400,
    //                     `Provider has insufficient balance. Current earnings: ₹${provider.totalEarnings.toFixed(
    //                         2
    //                     )}`
    //                 );
    //             if (withdrawal.isPaid) {
    //                 provider.totalEarnings -= withdrawal.amount;
    //                 await provider.save();

    //                 // Deduct from provider totalEarnings only

    //                 const walletTransaction = await walletService.create({
    //                     entityId: withdrawal.providerId,           // ✅ Correct field
    //                     entityType: "ServiceProvider",  // ✅ Must match enum
    //                     amount: withdrawal.amount,                // negative for withdrawal
    //                     type: "withdrawal",             // ✅ one of your WalletTransactionType
    //                     status: "completed",              // or success/completed
    //                     meta: { note: "Withdrawal request created" },
    //                 });
    //                 withdrawal.status = "approved";
    //                 withdrawal.approvedAt = new Date();
    //                 withdrawal.approvedBy = adminId;
    //                 withdrawal.walletTransaction = walletTransaction._id;
    //                 // withdrawal.isPaid = true;

    //                 withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
    //                 await withdrawal.save();
    //             }else{
    //                 const walletTransaction = await walletService.create({
    //                     entityId: withdrawal.providerId,           // ✅ Correct field
    //                     entityType: "ServiceProvider",  // ✅ Must match enum
    //                     amount: withdrawal.amount,                // negative for withdrawal
    //                     type: "withdrawal",             // ✅ one of your WalletTransactionType
    //                     status: "pending",              // or success/completed
    //                     meta: { note: "Withdrawal request created" },
    //                 });
    //                 withdrawal.status = "approved";
    //                 withdrawal.approvedAt = new Date();
    //                 withdrawal.approvedBy = adminId;
    //                 withdrawal.walletTransaction = walletTransaction._id;
    //                 // withdrawal.isPaid = true;

    //                 withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
    //                 await withdrawal.save();

    //             }


    //         } else if (status === "rejected") {
    //             withdrawal.status = "rejected";
    //             withdrawal.rejectedAt = new Date();
    //             withdrawal.rejectedBy = adminId;
    //             withdrawal.isPaid = false;
    //         }

    //         await withdrawal.save();

    //         return res
    //             .status(200)
    //             .json(
    //                 new ApiResponse(
    //                     200,
    //                     withdrawal,
    //                     `Withdrawal ${status} successfully`
    //                 )
    //             );
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    static async updateWithdrawalStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, adminNotes, isPaid } = req.body; // isPaid is boolean
            const adminId = (req as any).user?.id;

            if (!id) throw new ApiError(400, "Withdrawal ID is required");
            if (!["approved", "rejected"].includes(status))
                throw new ApiError(400, "Invalid status value");

            const withdrawal = await WithdrawalsService.getById(id);
            if (!withdrawal) throw new ApiError(404, "Withdrawal not found");

            if (withdrawal.status !== "pending")
                throw new ApiError(400, `Cannot update withdrawal already marked as ${withdrawal.status}`);

            const provider = await providerService.getById(withdrawal.providerId);
            if (!provider) throw new ApiError(404, "Associated provider not found");

            // ✅ Use strict union type for walletTransaction status
            //   let walletTransactionStatus: "pending" | "completed" | "success" | "failed";

            if (status === "approved") {
                if (provider.totalEarnings < withdrawal.amount)
                    throw new ApiError(
                        400,
                        `Provider has insufficient balance. Current earnings: ₹${provider.totalEarnings.toFixed(2)}`
                    );

                // Deduct earnings only if paid
                if (isPaid) {
                    provider.totalEarnings -= withdrawal.amount;
                    await provider.save();
                    withdrawal.completedAt = new Date();

                    // Create wallet transaction
                    const walletTransaction = await walletService.create({
                        entityId: withdrawal.providerId,
                        entityType: "ServiceProvider",
                        amount: withdrawal.amount,
                        type: "withdrawal",
                        status: "completed",
                        meta: { note: isPaid ? true : false },
                    });

                    // Update withdrawal
                    withdrawal.status = "approved";
                    withdrawal.isPaid = true;
                    withdrawal.approvedAt = new Date();
                    withdrawal.approvedBy = adminId;
                    withdrawal.walletTransaction = walletTransaction._id;
                    withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
                } else {
                    const walletTransaction = await walletService.create({
                        entityId: withdrawal.providerId,
                        entityType: "ServiceProvider",
                        amount: withdrawal.amount,
                        type: "withdrawal",
                        status: "pending",
                        meta: { note: isPaid ? true : false },
                    });

                    // Update withdrawal
                    withdrawal.status = "approved";
                    withdrawal.isPaid = false;
                    withdrawal.approvedAt = new Date();
                    withdrawal.approvedBy = adminId;
                    withdrawal.walletTransaction = walletTransaction._id;
                    withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
                }
            }


            if (status === "rejected") {
                // Rejected always maps to 'failed' in walletTransaction

                const walletTransaction = await walletService.create({
                    entityId: withdrawal.providerId,
                    entityType: "ServiceProvider",
                    amount: withdrawal.amount,
                    type: "withdrawal",
                    status: "rejected",
                    meta: { note: "Withdrawal request rejected" },
                });

                withdrawal.status = "rejected";
                withdrawal.isPaid = false; // Rejected cannot be paid
                withdrawal.rejectedAt = new Date();
                withdrawal.rejectedBy = adminId;
                withdrawal.walletTransaction = walletTransaction._id;
                withdrawal.adminNotes = adminNotes || withdrawal.adminNotes;
            }

            await withdrawal.save();

            return res.status(200).json(
                new ApiResponse(
                    200,
                    withdrawal,
                    `Withdrawal ${status} successfully (isPaid: ${withdrawal.isPaid})`
                )
            );
        } catch (error) {
            next(error);
        }
    }


    static async markWithdrawalCompleted(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const withdrawal = await WithdrawalsService.getById(id);

            if (!withdrawal) throw new ApiError(404, "Withdrawal not found");
            if (withdrawal.status !== "approved")
                throw new ApiError(400, "Only approved withdrawals can be marked as completed");

            withdrawal.status = "completed";
            withdrawal.completedAt = new Date();
            await withdrawal.save();

            return res.status(200).json(new ApiResponse(200, withdrawal, "Withdrawal marked as completed"));
        } catch (error) {
            next(error);
        }
    }

    // 🔍 Get a single withdrawal by ID
    static async getWithdrawalById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) throw new ApiError(400, "Withdrawal ID required");

            const withdrawal = await WithdrawalsService.getById(id);
            if (!withdrawal) throw new ApiError(404, "Withdrawal not found");

            return res
                .status(200)
                .json(new ApiResponse(200, withdrawal, "Withdrawal fetched successfully"));
        } catch (error) {
            next(error);
        }
    }

    // ✏️ Update a withdrawal
    static async updateWithdrawal(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) throw new ApiError(400, "Withdrawal ID required");

            const updateData = req.body;
            const updated = await WithdrawalsService.updateById(id, updateData);

            return res
                .status(200)
                .json(new ApiResponse(200, updated, "Withdrawal updated successfully"));
        } catch (error) {
            next(error);
        }
    }

    // 🗑️ Delete a withdrawal
    static async deleteWithdrawal(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) throw new ApiError(400, "Withdrawal ID required");

            const deleted = await WithdrawalsService.deleteById(id);

            return res
                .status(200)
                .json(new ApiResponse(200, deleted, "Withdrawal deleted successfully"));
        } catch (error) {
            next(error);
        }
    }

    static async getAllWithdrawals(req: Request, res: Response, next: NextFunction) {
        try {
            // const query = req.query || {};
            const query = { status: "pending" };
            // ✅ Aggregation pipeline stages
            const additionalStages = [
                // 1️⃣ Populate provider details
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "providerInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$providerInfo",
                        preserveNullAndEmptyArrays: false,
                    },
                },

                // 2️⃣ Populate provider's bank account details
                {
                    $lookup: {
                        from: "bankaccounts",
                        localField: "providerInfo.bankAccount",
                        foreignField: "_id",
                        as: "bankAccounts",
                    },
                },

                // 3️⃣ Add flattened provider and bank info fields
                {
                    $addFields: {
                        providerName: "$providerInfo.name",
                        providerEmail: "$providerInfo.email",
                        providerPhone: "$providerInfo.phoneNumber",
                        providerAlias: "$providerInfo.alias",
                        bankAccounts: "$bankAccounts",
                    },
                },

                // 4️⃣ Clean up and project only required fields
                {
                    $project: {
                        _id: 1,
                        amount: { $divide: ["$amount", 100] },
                        status: 1,
                        note: 1,
                        isPaid: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        providerId: 1,
                        providerName: 1,
                        providerEmail: 1,
                        providerPhone: 1,
                        providerAlias: 1,
                        "bankAccounts.bankName": 1,
                        "bankAccounts.ifscCode": 1,
                        "bankAccounts.accountNumber": 1,
                        "bankAccounts.upiId": 1,
                        "bankAccounts.isKycVerified": 1,
                    },
                },

                // 5️⃣ Sort by latest first
                { $sort: { createdAt: -1 } },
            ];

            // ✅ Call your existing getAll service with aggregation support
            const serviceResult = await WithdrawalsService.getAll(query, additionalStages);

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        result: serviceResult.result,
                        pagination: serviceResult.pagination,
                    },
                    "All withdrawals fetched successfully"
                )
            );
        } catch (error) {
            next(error);
        }
    }

    static async getMyWithdrawals(req: Request | any, res: Response, next: NextFunction) {
        try {
            const providerId = req.user?.id;
            console.log("provider id :", providerId);
            if (!providerId) {
                throw new ApiError(401, "Unauthorized");
            }

            // 🔍 Filter only this provider's withdrawals
            const query = {
                providerId,
            };

            const additionalStages = [
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "providerInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$providerInfo",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "bankaccounts",
                        localField: "providerInfo.bankAccount",
                        foreignField: "_id",
                        as: "bankAccounts",
                    },
                },
                {
                    $addFields: {
                        providerName: "$providerInfo.name",
                        providerEmail: "$providerInfo.email",
                        providerPhone: "$providerInfo.phoneNumber",
                        providerAlias: "$providerInfo.alias",
                        bankAccounts: "$bankAccounts",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        amount: { $divide: ["$amount", 100] },
                        status: 1,
                        note: 1,
                        isPaid: 1,
                        createdAt: 1,
                        updatedAt: 1,

                        // Provider info (optional but useful)
                        providerName: 1,
                        providerEmail: 1,
                        providerPhone: 1,
                        providerAlias: 1,

                        // Bank details
                        "bankAccounts.bankName": 1,
                        "bankAccounts.ifscCode": 1,
                        "bankAccounts.accountNumber": 1,
                        "bankAccounts.upiId": 1,
                        "bankAccounts.isKycVerified": 1,
                    },
                },
                { $sort: { createdAt: -1 } },
            ];

            const serviceResult = await WithdrawalsService.getAll(query, additionalStages);

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        result: serviceResult.result,
                        pagination: serviceResult.pagination,
                    },
                    "My withdrawals fetched successfully"
                )
            );
        } catch (error) {
            next(error);
        }
    }
    static async getAllPendingWithdrawals(req: Request, res: Response, next: NextFunction) {
        try {
            const query = { status: "pending" }; // 👈 Filter only pending withdrawals

            // ✅ Same aggregation pipeline as getAllWithdrawals
            const additionalStages = [
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "providerInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$providerInfo",
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $lookup: {
                        from: "bankaccounts",
                        localField: "providerInfo.bankAccount",
                        foreignField: "_id",
                        as: "bankAccounts",
                    },
                },
                {
                    $addFields: {
                        providerName: "$providerInfo.name",
                        providerEmail: "$providerInfo.email",
                        providerPhone: "$providerInfo.phoneNumber",
                        providerAlias: "$providerInfo.alias",
                        bankAccounts: "$bankAccounts",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        amount: { $divide: ["$amount", 100] },
                        status: 1,
                        note: 1,
                        isPaid: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        providerId: 1,
                        providerName: 1,
                        providerEmail: 1,
                        providerPhone: 1,
                        providerAlias: 1,
                        "bankAccounts.bankName": 1,
                        "bankAccounts.ifscCode": 1,
                        "bankAccounts.accountNumber": 1,
                        "bankAccounts.upiId": 1,
                        "bankAccounts.isKycVerified": 1,
                    },
                },
                { $sort: { createdAt: -1 } },
            ];

            const serviceResult = await WithdrawalsService.getAll(query, additionalStages);

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        result: serviceResult.result,
                        pagination: serviceResult.pagination,
                    },
                    "All pending withdrawals fetched successfully"
                )
            );
        } catch (error) {
            next(error);
        }
    }

    static async getAllApprovedWithdrawals(req: Request, res: Response, next: NextFunction) {
        try {
            const query = { status: "approved" }; // 👈 Filter only pending withdrawals

            // ✅ Same aggregation pipeline as getAllWithdrawals
            const additionalStages = [
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "providerInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$providerInfo",
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $lookup: {
                        from: "bankaccounts",
                        localField: "providerInfo.bankAccount",
                        foreignField: "_id",
                        as: "bankAccounts",
                    },
                },
                {
                    $addFields: {
                        providerName: "$providerInfo.name",
                        providerEmail: "$providerInfo.email",
                        providerPhone: "$providerInfo.phoneNumber",
                        providerAlias: "$providerInfo.alias",
                        bankAccounts: "$bankAccounts",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        amount: { $divide: ["$amount", 100] },
                        status: 1,
                        note: 1,
                        isPaid: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        providerId: 1,
                        providerName: 1,
                        providerEmail: 1,
                        providerPhone: 1,
                        providerAlias: 1,
                        "bankAccounts.bankName": 1,
                        "bankAccounts.ifscCode": 1,
                        "bankAccounts.accountNumber": 1,
                        "bankAccounts.upiId": 1,
                        "bankAccounts.isKycVerified": 1,
                    },
                },
                { $sort: { createdAt: -1 } },
            ];

            const serviceResult = await WithdrawalsService.getAll(query, additionalStages);

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        result: serviceResult.result,
                        pagination: serviceResult.pagination,
                    },
                    "All approved withdrawals fetched successfully"
                )
            );
        } catch (error) {
            next(error);
        }
    }

    static async getAllRejectedWithdrawals(req: Request, res: Response, next: NextFunction) {
        try {
            const query = { status: "rejected" }; // 👈 Filter only pending withdrawals

            // ✅ Same aggregation pipeline as getAllWithdrawals
            const additionalStages = [
                {
                    $lookup: {
                        from: "serviceproviders",
                        localField: "providerId",
                        foreignField: "_id",
                        as: "providerInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$providerInfo",
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $lookup: {
                        from: "bankaccounts",
                        localField: "providerInfo.bankAccount",
                        foreignField: "_id",
                        as: "bankAccounts",
                    },
                },
                {
                    $addFields: {
                        providerName: "$providerInfo.name",
                        providerEmail: "$providerInfo.email",
                        providerPhone: "$providerInfo.phoneNumber",
                        providerAlias: "$providerInfo.alias",
                        bankAccounts: "$bankAccounts",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        amount: { $divide: ["$amount", 100] },
                        status: 1,
                        note: 1,
                        isPaid: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        providerId: 1,
                        providerName: 1,
                        providerEmail: 1,
                        providerPhone: 1,
                        providerAlias: 1,
                        "bankAccounts.bankName": 1,
                        "bankAccounts.ifscCode": 1,
                        "bankAccounts.accountNumber": 1,
                        "bankAccounts.upiId": 1,
                        "bankAccounts.isKycVerified": 1,
                    },
                },
                { $sort: { createdAt: -1 } },
            ];

            const serviceResult = await WithdrawalsService.getAll(query, additionalStages);

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        result: serviceResult.result,
                        pagination: serviceResult.pagination,
                    },
                    "All rejected withdrawals fetched successfully"
                )
            );
        } catch (error) {
            next(error);
        }
    }

}
