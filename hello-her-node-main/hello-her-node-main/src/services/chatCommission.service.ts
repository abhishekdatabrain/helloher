import mongoose from "mongoose";
import ChatCommission from "../modals/chatCommission.model";
import { User } from "../modals/user.model";
import { Wallet } from "../modals/wallet.model";
import { WalletTransaction } from "../modals/walletTransaction.model";
import ServiceProvider from "../modals/serviceProvider.model";
import Admin from "../modals/admin.model";
import { ChatSession } from "../modals/chatSession.model";

// Billing throttle cache
const billingThrottle = new Map<string, number>();

function shouldRunBilling(userId: string, providerId: string) {
  const key = `${userId}_${providerId}`;
  const now = Date.now();

  const lastRun = billingThrottle.get(key);

  // allow billing only every 5 seconds
  if (lastRun && now - lastRun < 5000) {
    return false;
  }

  billingThrottle.set(key, now);
  return true;
}

// export const applyChatCommission = async (
//   userId: string,
//   providerId: string,
//   messageId?: string
// ) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 1️⃣ Get active commission
//     const commission = await ChatCommission.findOne({ enabled: true }).session(session);
//     if (!commission) {
//       await session.commitTransaction();
//       return;
//     }

//     // 2️⃣ Get user + wallet
//     const user = await User.findById(userId).session(session);
//     if (!user?.wallet) throw new Error("User wallet not found");

//     const wallet = await Wallet.findById(user.wallet).session(session);
//     if (!wallet) throw new Error("Wallet not found");

//     // 3️⃣ Determine price
//     const price =
//       commission.mode === "perMinute"
//         ? commission.perMinuteAmountPaise || 0
//         : commission.perMessageAmountPaise || 0;

//     if (wallet.balance < price) {
//       throw new Error("Insufficient wallet balance");
//     }

//     // 4️⃣ Commission split
//     const providerShare = commission.providerSharePaise || 0;
//     const adminShare = commission.adminSharePaise || 0;

//     // 5️⃣ Deduct wallet
//     wallet.balance -= price;
//     await wallet.save({ session });

//     // 6️⃣ Update provider earnings
//     await ServiceProvider.findByIdAndUpdate(
//       providerId,
//       {
//         $inc: {
//           totalEarnings: providerShare,
//           todayEarnings: providerShare,
//         },
//       },
//       { session }
//     );

//     // 7️⃣ Update admin wallet
//     const admin = await Admin.findOne().session(session);

//     if (admin) {
//       admin.wallet += adminShare;
//       admin.totalEarning += adminShare;
//       await admin.save({ session });
//     }

//     // 8️⃣ Create transactions
//     // await WalletTransaction.insertMany(
//     //   [
//     //     {
//     //       entityId: user._id,
//     //       entityType: "User",
//     //       amount: -price,
//     //       type: "debit_chat",
//     //       status: "success",
//     //       meta: {
//     //         providerId,
//     //         messageId,
//     //         mode: commission.mode,
//     //       },
//     //     },
//     //     {
//     //       entityId: providerId,
//     //       entityType: "ServiceProvider",
//     //       amount: providerShare,
//     //       type: "earning_chat",
//     //       status: "success",
//     //       meta: {
//     //         userId,
//     //         messageId,
//     //         mode: commission.mode,
//     //       },
//     //     },
//     //     {
//     //       entityId: admin?._id,
//     //       entityType: "Admin",
//     //       amount: adminShare,
//     //       type: "admin_commission_chat",
//     //       status: "success",
//     //       meta: {
//     //         userId,
//     //         providerId,
//     //         messageId,
//     //       },
//     //     },
//     //   ],
//     //   { session }
//     // );

//     await session.commitTransaction();
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };

export const applyChatCommission = async (
  userId: string,
  providerId: string,
  messageId?: string
) => {


    // 1️⃣ Get active commission (NO SESSION)
  const commission = await ChatCommission.findOne({ enabled: true }).lean();
  if (!commission) return;

  // 2️⃣ Throttle check
  if (commission.mode === "perMinute") {
    if (!shouldRunBilling(userId, providerId)) {
      return;
    }
  }

  // 3️⃣ Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user + wallet
    const user = await User.findById(userId).select("wallet").session(session); if (!user?.wallet) throw new Error("User wallet not found");

    const wallet = await Wallet.findById(user.wallet).session(session);
    if (!wallet) throw new Error("Wallet not found");

    let price = 0;

    if (commission.mode === "perMessage") {

      price = commission.perMessageAmountPaise || 0;

    } else if (commission.mode === "perMinute") {

      const perMinute = commission.perMinuteAmountPaise || 0;

      const now = new Date();

      let chatSession = await ChatSession.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        providerId: new mongoose.Types.ObjectId(providerId)
      }).session(session);

      if (!chatSession) {

        chatSession = await ChatSession.create(
          [{
            userId: new mongoose.Types.ObjectId(userId),
            providerId: new mongoose.Types.ObjectId(providerId),
            lastChargedMinute: Math.floor(now.getTime() / 60000),
            lastActivityAt: now
          }],
          { session }
        ).then(res => res[0]);

        price = perMinute;

      } else {

        const currentMinute = Math.floor(now.getTime() / 60000);

        const diffMinutes = currentMinute - chatSession.lastChargedMinute;

        const idleMinutes = Math.floor(
          (now.getTime() - chatSession.lastActivityAt.getTime()) / 60000
        );

        if (idleMinutes > 2) {

          // reset billing after long idle
          chatSession.lastChargedMinute = currentMinute;
          price = perMinute;

        } else if (diffMinutes > 0) {

          const chargeMinutes = Math.min(diffMinutes, 2);
          price = chargeMinutes * perMinute;
          chatSession.lastChargedMinute = currentMinute;

        } else {

          price = 0;

        }

        chatSession.lastActivityAt = now;

        await chatSession.save({ session });

      }
    }

    if (price === 0) {
      await session.commitTransaction();
      return;
    }

    if (wallet.balance < price) {
      throw new Error("Insufficient wallet balance");
    }

    // 4️⃣ Commission split
    // const providerShare = (price * commission.providerSharePercentage) / 100;
    // const adminShare = price - providerShare;
    // const providerShare = commission.providerSharePaise || 0;
    // const adminShare = commission.adminSharePaise || 0;
    // const providerShare = (price * commission.providerSharePaise) / 100;
    // const adminShare = price - providerShare;
    const providerShare = Math.floor(price * commission.commissionPercentage / 100);
    const adminShare = price - providerShare;

    // 5️⃣ Deduct wallet
    wallet.balance -= price;
    await wallet.save({ session });

    // 6️⃣ Update provider earnings
    await ServiceProvider.findByIdAndUpdate(
      providerId,
      {
        $inc: {
          totalEarnings: providerShare,
          todayEarnings: providerShare,
        },
      },
      { session }
    );

    // 7️⃣ Update admin wallet
    const admin = await Admin.findOne().session(session);

    if (admin) {
      admin.wallet += adminShare;
      admin.totalEarning += adminShare;
      await admin.save({ session });
    }

    // 8️⃣ Create transactions
    // await WalletTransaction.insertMany(
    //   [
    //     {
    //       entityId: user._id,
    //       entityType: "User",
    //       amount: -price,
    //       type: "debit_chat",
    //       status: "success",
    //       meta: {
    //         providerId,
    //         messageId,
    //         mode: commission.mode,
    //       },
    //     },
    //     {
    //       entityId: providerId,
    //       entityType: "ServiceProvider",
    //       amount: providerShare,
    //       type: "earning_chat",
    //       status: "success",
    //       meta: {
    //         userId,
    //         messageId,
    //         mode: commission.mode,
    //       },
    //     },
    //     {
    //       entityId: admin?._id,
    //       entityType: "Admin",
    //       amount: adminShare,
    //       type: "admin_commission_chat",
    //       status: "success",
    //       meta: {
    //         userId,
    //         providerId,
    //         messageId,
    //       },
    //     },
    //   ],
    //   { session }
    // );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

setInterval(() => billingThrottle.clear(), 600000);