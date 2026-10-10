import { Router } from 'express';
import {
    getChatCommissions,
    getChatCommissionById,
    createChatCommission,
    updateChatCommission,
    deleteChatCommission,
    enableChatCommission,
    disableChatCommission,
    enableChatCommissionFeature,
    disableChatCommissionFeature
} from './chatCommission.controller';

const router = Router();

// --------------------------------------
// GLOBAL FEATURE TOGGLE
// --------------------------------------

// PATCH /api/admin/chatCommission/feature/enable - Enable chat commission feature
router.patch('/feature/enable', enableChatCommissionFeature);

// PATCH /api/admin/chatCommission/feature/disable - Disable chat commission feature
router.patch('/feature/disable', disableChatCommissionFeature);

// GET /api/admin/chatCommission - Get all chat commissions
router.get('/', getChatCommissions);

// GET /api/admin/chatCommission/:id - Get a specific chat commission by ID
router.get('/:id', getChatCommissionById);

// POST /api/admin/chatCommission - Create a new chat commission
router.post('/', createChatCommission);

// PUT /api/admin/chatCommission/:id - Update a chat commission
router.put('/:id', updateChatCommission);

// DELETE /api/admin/chatCommission/:id - Delete a chat commission
router.delete('/:id', deleteChatCommission);

// PATCH /api/admin/chatCommission/:id/enable - Enable a chat commission
router.patch('/:id/enable', enableChatCommission);

// PATCH /api/admin/chatCommission/:id/disable - Disable a chat commission
router.patch('/:id/disable', disableChatCommission);

export default router;