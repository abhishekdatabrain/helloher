import { Request, Response } from 'express';
import ChatCommission from '../../modals/chatCommission.model';
import { User } from '../../modals/user.model';
import ServiceProvider from '../../modals/serviceProvider.model';

export const getChatCommissions = async (req: Request, res: Response) => {
    try {
        const commissions = await ChatCommission.find();
        res.status(200).json(commissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat commissions', error });
    }
};

export const getChatCommissionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const commission = await ChatCommission.findById(id);
        if (!commission) {
            return res.status(404).json({ message: 'Chat commission not found' });
        }
        res.status(200).json(commission);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat commission', error });
    }
};

export const createChatCommission = async (req: Request, res: Response) => {
    try {

        const {
            enabled,
            mode,
            perMinuteAmountPaise,
            perMessageAmountPaise,
            commissionPercentage,
            providerSharePaise,
            adminSharePaise
        } = req.body;

        // ✅ Check if commission already exists for this mode
        const existing = await ChatCommission.findOne({ mode });

        if (existing) {
            return res.status(400).json({
                message: `Chat commission for mode '${mode}' already exists`
            });
        }

        // ✅ If enabling this commission, disable other modes
        if (enabled) {
            await ChatCommission.updateMany(
                { mode: { $ne: mode } },
                { $set: { enabled: false } }
            );
        }

        const newCommission = new ChatCommission({
            enabled,
            mode,
            perMinuteAmountPaise,
            perMessageAmountPaise,
            commissionPercentage,
            providerSharePaise,
            adminSharePaise,
        });

        await newCommission.save();

        res.status(201).json(newCommission);

    } catch (error) {
        res.status(500).json({
            message: 'Error creating chat commission',
            error
        });
    }
};

export const updateChatCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedCommission = await ChatCommission.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedCommission) {
            return res.status(404).json({ message: 'Chat commission not found' });
        }
        res.status(200).json(updatedCommission);
    } catch (error) {
        res.status(500).json({ message: 'Error updating chat commission', error });
    }
};

export const deleteChatCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedCommission = await ChatCommission.findByIdAndDelete(id);
        if (!deletedCommission) {
            return res.status(404).json({ message: 'Chat commission not found' });
        }
        res.status(200).json({ message: 'Chat commission deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting chat commission', error });
    }
};

export const enableChatCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const commission = await ChatCommission.findById(id);

        if (!commission) {
            return res.status(404).json({ message: 'Chat commission not found' });
        }

        // ✅ Disable all other commissions
        await ChatCommission.updateMany(
            { _id: { $ne: id } },
            { enabled: false }
        );

        // ✅ Enable selected commission
        commission.enabled = true;
        await commission.save();

        // 📣 Notify all users and providers about mode change
        try {
            const io = req.app.get('socketio');
            const getSocketUser = req.app.get('getSocketUser');

            const modeLabel = commission.mode === 'perMinute' ? 'Per Minute' : 'Per Message';
            const messageText = `Chat charging mode has been updated to ${modeLabel}.`;

            // fetch recipients
            const users = await User.find({}, '_id');
            const providers = await ServiceProvider.find({}, '_id');

            console.log('🔔 [COMMISSION] Broadcasting mode change notification:', {
                mode: commission.mode,
                totalUsers: users.length,
                totalProviders: providers.length,
            });

            // include full commission doc in metadata
            const commissionData = commission.toObject();

            const { createAndEmitNotification } = await import('../../services/notificationHelper.service');

            for (const u of users) {
                try {
                    await createAndEmitNotification({
                        type: 'commission_mode_changed',
                        title: 'Chat Mode Updated',
                        message: messageText,
                        recipientId: u._id.toString(),
                        recipientType: 'user',
                        metadata: { mode: commission.mode, commission: commissionData },
                        io,
                        getSocketUser,
                    });
                } catch (err) {
                    console.error('Error notifying user', u._id.toString(), err);
                }
            }

            for (const p of providers) {
                try {
                    await createAndEmitNotification({
                        type: 'commission_mode_changed',
                        title: 'Chat Mode Updated',
                        message: messageText,
                        recipientId: p._id.toString(),
                        recipientType: 'provider',
                        metadata: { mode: commission.mode, commission: commissionData },
                        io,
                        getSocketUser,
                    });
                } catch (err) {
                    console.error('Error notifying provider', p._id.toString(), err);
                }
            }

        } catch (notifErr) {
            console.error('❌ [COMMISSION] Error broadcasting notifications:', notifErr);
        }

        res.status(200).json(commission);

    } catch (error) {
        res.status(500).json({
            message: 'Error enabling chat commission',
            error
        });
    }
};

export const disableChatCommission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const updatedCommission = await ChatCommission.findByIdAndUpdate(
            id,
            { enabled: false },
            { new: true }
        );

        if (!updatedCommission) {
            return res.status(404).json({ message: 'Chat commission not found' });
        }

        res.status(200).json(updatedCommission);

    } catch (error) {
        res.status(500).json({
            message: 'Error disabling chat commission',
            error
        });
    }
};

export const disableChatCommissionFeature = async (req: Request, res: Response) => {
    try {

        const commissions = await ChatCommission.find();

        for (const c of commissions) {
            c.lastEnabled = c.enabled;
            c.enabled = false;
            await c.save();
        }

        res.status(200).json({ message: 'Chat commission feature disabled' });

    } catch (error) {
        res.status(500).json({ message: 'Error disabling feature', error });
    }
};

export const enableChatCommissionFeature = async (req: Request, res: Response) => {
    try {

        const commissions = await ChatCommission.find();

        for (const c of commissions) {

            if (c.lastEnabled) {
                c.enabled = true;
            }

            await c.save();
        }

        res.status(200).json({ message: 'Chat commission feature enabled' });

    } catch (error) {
        res.status(500).json({ message: 'Error enabling feature', error });
    }
};