"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Post } from "@/hooks/apiUtils";

interface ManualPenaltyModalProps {
    providerId: string;
    providerName: string;
    onClose: () => void;
}

const ManualPenaltyModal: React.FC<ManualPenaltyModalProps> = ({
    providerId,
    providerName,
    onClose,
}) => {
    const [penaltyAmount, setPenaltyAmount] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!penaltyAmount || !reason) {
            toast.error("Please fill in all fields");
            return;
        }

        const amount = parseFloat(penaltyAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Penalty amount must be a positive number");
            return;
        }

        setLoading(true);
        try {
            await Post("/api/availability-penalty/manual-penalty", {
                providerId,
                penaltyAmountRs: amount,
                reason,
            });
            onClose();
        } catch (error) {
            console.error("Error applying penalty:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Apply Manual Penalty</h2>
                <p className="mb-4 text-gray-600">
                    Applying penalty to: <strong>{providerName}</strong>
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Penalty Amount (Rs)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={penaltyAmount}
                            onChange={(e) => setPenaltyAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter reason for penalty"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Applying..." : "Apply Penalty"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualPenaltyModal;