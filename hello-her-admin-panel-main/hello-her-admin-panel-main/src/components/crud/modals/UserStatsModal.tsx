"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Fetch } from "@/hooks/apiUtils";
import { toast } from "react-toastify";
import Loader from "@/components/common/Loader";

interface UserStatsModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

interface Transaction {
    _id: string;
    entityId: string;
    entityType: string;
    type: string;
    status: string;
    meta: {
        sessionId?: string;
    };
    createdAt: string;
    updatedAt: string;
    entityInfo: {
        name: string;
        email: string;
        phoneNumber: string;
    };
    amount: number;
}

interface CallLog {
    _id: string;
    channel: string;
    callerModel: string;
    calleeModel: string;
    status: string;
    totalSeconds: number;
    perMinutePricePaise: number;
    createdAt: string;
    endedAt: string;
    callerInfo: {
        _id: string;
        name: string;
        phoneNumber: string;
        activeImageURL: string | null;
    };
    calleeInfo: {
        _id: string;
        name: string;
        phoneNumber: string;
        activeImageURL: string | null;
    };
}

interface PaginationData {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

const UserStatsModal: React.FC<UserStatsModalProps> = ({
    userId,
    userName,
    onClose,
}) => {
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [transactionPagination, setTransactionPagination] = useState<PaginationData | null>(null);
    const [callLogPagination, setCallLogPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [callLogsLoading, setCallLogsLoading] = useState(false);
    const [transactionPage, setTransactionPage] = useState(1);
    const [callLogPage, setCallLogPage] = useState(1);
    const [activeTab, setActiveTab] = useState<"calls" | "transactions">("calls");

    // Fetch user details
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const response: any = await Fetch(
                    `/api/user/all/${userId}`,
                    {},
                    5000,
                    false,
                    false
                );

                if (response?.success) {
                    setUser(response.data);
                } else {
                    toast.error(response?.message || "Failed to fetch user details");
                }
            } catch (error: any) {
                toast.error(error?.message || "Error fetching user details");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    // Fetch call logs with pagination
    const fetchCallLogs = useCallback(async (page: number) => {
        if (!userId) return;
        
        try {
            setCallLogsLoading(true);
            const response: any = await Fetch(
                `/api/call/user/${userId}?page=${page}&limit=10`,
                {},
                5000,
                false,
                false
            );

            if (response?.success) {
                setCallLogs(response.data?.result || []);
                setCallLogPagination(response.data?.pagination || null);
            } else {
                toast.error(response?.message || "Failed to fetch call logs");
            }
        } catch (error: any) {
            toast.error(error?.message || "Error fetching call logs");
        } finally {
            setCallLogsLoading(false);
        }
    }, [userId]);

    // Fetch transactions with pagination
    const fetchTransactions = useCallback(async (page: number) => {
        if (!userId) return;
        
        try {
            setTransactionsLoading(true);
            const response: any = await Fetch(
                `/api/transactions/user/${userId}?page=${page}&limit=10`,
                {},
                5000,
                false,
                false
            );

            if (response?.success) {
                setTransactions(response.data?.result || []);
                setTransactionPagination(response.data?.pagination || null);
            } else {
                toast.error(response?.message || "Failed to fetch transactions");
            }
        } catch (error: any) {
            toast.error(error?.message || "Error fetching transactions");
        } finally {
            setTransactionsLoading(false);
        }
    }, [userId]);

    // Load data when page changes
    useEffect(() => {
        if (userId) {
            fetchCallLogs(callLogPage);
            fetchTransactions(transactionPage);
        }
    }, [userId, callLogPage, transactionPage, fetchCallLogs, fetchTransactions]);

    const formatAmount = (amount: number) => {
        const isPositive = amount > 0;
        return (
            <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                {isPositive ? "+" : ""}₹{Math.abs(amount).toFixed(2)}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDuration = (seconds: number) => {
        if (seconds === 0) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getCallStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; icon: string; label: string }> = {
            completed: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "✓", label: "Completed" },
            missed: { bg: "bg-rose-50", text: "text-rose-700", icon: "", label: "Missed" },
            ongoing: { bg: "bg-blue-50", text: "text-blue-700", icon: "●", label: "Ongoing" },
            rejected: { bg: "bg-orange-50", text: "text-orange-700", icon: "✗", label: "Rejected" },
            ended: { bg: "bg-orange-50", text: "text-orange-700", icon: "", label: "Ended" },
        };
        const style = config[status] || config.missed;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                <span>{style.icon}</span>
                {style.label}
            </span>
        );
    };

    const getTransactionTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            debit_call_end: "Call Charge",
            credit_add_funds: "Added Funds",
            credit_referral: "Referral Bonus",
            debit_withdrawal: "Withdrawal",
        };
        return types[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) return <Loader />;

    if (!user) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">User Details</h3>
                    <p className="text-gray-600 text-center py-8">
                        Failed to load user details. Please try again.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const fallbackImage = "/assets/products/fallback.png";
    const activeImage = user.activeImageUrl || user.avatar || user.profilePicture || fallbackImage;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {userName || user.name || "User Details"}
                        </h2>
                        {/* <p className="text-sm text-gray-500 mt-0.5">ID: {user._id || user.id}</p> */}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Profile Section - Avatar + Basic Info */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar Card */}
                        <div className="md:w-64 flex-shrink-0">
                            <div className="relative h-64 w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
                                <Image
                                    src={activeImage}
                                    alt="User image"
                                    className="object-cover"
                                    fill
                                    unoptimized
                                />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 justify-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.isOnline ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></span>
                                    {user.isOnline ? "Online" : "Offline"}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${!user.isBlocked ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                    {!user.isBlocked ? "Active" : "Blocked"}
                                </span>
                                {user.isPaid && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                                            <path fillRule="evenodd" d="M10 7a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V8a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Premium
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* User Info Grid */}
                        <div className="flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoCard label="Full Name" value={user.name || "-"} />
                                {/* <InfoCard label="Email" value={user.email || "-"} icon="✉️" /> */}
                                <InfoCard label="Phone" value={user.phoneNumber || "-"} icon="" />
                                <InfoCard label="Gender" value={user.gender || "-"} />
                                <InfoCard label="Age Range" value={user.ageRange || "-"} />
                                <InfoCard label="Verified" value={user.isVerified ? "Verified" : "Unverified"} isVerified={user.isVerified} />
                                <InfoCard label="Account Status" value={user.isBlocked ? "Blocked" : "Active"} isActive={!user.isBlocked} />
                                <InfoCard label="Role" value={user.role || "user"} isRole />
                            </div>
                        </div>
                    </div>

                    {/* Stats Row - Wallet & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Wallet Balance</p>
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-blue-700">₹{user.wallet?.balance ?? 0}</p>
                        </div>
                        <InfoCard label="Registered At" value={user.createdAt ? formatDate(user.createdAt) : "-"} icon="📅" />
                        <InfoCard label="Last Seen" value={user.lastSeen ? formatDate(user.lastSeen) : "-"} icon="🕐" />
                        <InfoCard label="User ID" value={user._id?.slice(-8) || user.id?.slice(-8) || "-"} icon="🆔" mono />
                    </div>

                    {/* Bio Section */}
                    {user.bio && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Bio</h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab("calls")}
                                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                                    activeTab === "calls"
                                        ? "text-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Call Logs
                                {callLogPagination && (
                                    <span className="ml-2 text-xs text-gray-400">({callLogPagination.totalItems})</span>
                                )}
                                {activeTab === "calls" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("transactions")}
                                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                                    activeTab === "transactions"
                                        ? "text-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Transactions
                                {transactionPagination && (
                                    <span className="ml-2 text-xs text-gray-400">({transactionPagination.totalItems})</span>
                                )}
                                {activeTab === "transactions" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Call Logs Section */}
                    {activeTab === "calls" && (
                        <div>
                            {callLogsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : callLogs.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <p>No call logs found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {callLogs.map((call) => {
                                            const isUserCaller = call.callerModel === "User";
                                            const otherParty = isUserCaller ? call.calleeInfo : call.callerInfo;
                                            const direction = isUserCaller ? "Outgoing" : "Incoming";
                                            
                                            return (
                                                <div key={call._id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar */}
                                                        <div className="relative w-12 h-12 flex-shrink-0">
                                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                                                {otherParty.activeImageURL ? (
                                                                    <Image
                                                                        src={otherParty.activeImageURL}
                                                                        alt={otherParty.name}
                                                                        width={48}
                                                                        height={48}
                                                                        className="object-cover w-full h-full"
                                                                        unoptimized
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold text-lg">
                                                                        {otherParty.name?.[0]?.toUpperCase() || "?"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                                                call.status === "completed" ? "bg-emerald-500" : "bg-gray-400"
                                                            }`}></div>
                                                        </div>

                                                        {/* Call Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {otherParty.name || "Unknown"}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {direction} • {otherParty.phoneNumber || "No number"}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="flex items-center gap-2">
                                                                        {getCallStatusBadge(call.status)}
                                                                        <span className="text-xs text-gray-500">
                                                                            {formatDuration(call.totalSeconds)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {formatDate(call.createdAt)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Call Logs Pagination */}
                                    {callLogPagination && callLogPagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-5">
                                            <button
                                                onClick={() => setCallLogPage(p => Math.max(1, p - 1))}
                                                disabled={callLogPage === 1}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    callLogPage === 1
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                                                }`}
                                            >
                                                ← Previous
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                    Page {callLogPagination.currentPage} of {callLogPagination.totalPages}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setCallLogPage(p => Math.min(callLogPagination.totalPages, p + 1))}
                                                disabled={callLogPage === callLogPagination.totalPages}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    callLogPage === callLogPagination.totalPages
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                                                }`}
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Transactions Section */}
                    {activeTab === "transactions" && (
                        <div>
                            {transactionsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p>No transactions found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Session</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {transactions.map((tx) => (
                                                    <tr key={tx._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                                                                {getTransactionTypeLabel(tx.type)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                                                            {formatAmount(tx.amount)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                                tx.status === "success" 
                                                                    ? "bg-emerald-50 text-emerald-700" 
                                                                    : "bg-rose-50 text-rose-700"
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${tx.status === "success" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                                                                {tx.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{tx.meta?.sessionId?.slice(-8) || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Transactions Pagination */}
                                    {transactionPagination && transactionPagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-5">
                                            <button
                                                onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                                                disabled={transactionPage === 1}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    transactionPage === 1
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                                                }`}
                                            >
                                                ← Previous
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                    Page {transactionPagination.currentPage} of {transactionPagination.totalPages}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setTransactionPage(p => Math.min(transactionPagination.totalPages, p + 1))}
                                                disabled={transactionPage === transactionPagination.totalPages}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    transactionPage === transactionPagination.totalPages
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                                                }`}
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 hover:shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const InfoCard = ({ 
    label, 
    value, 
    icon, 
    isRole = false, 
    isVerified = false, 
    isActive = false,
    mono = false 
}: { 
    label: string; 
    value: string | number; 
    icon?: string;
    isRole?: boolean;
    isVerified?: boolean;
    isActive?: boolean;
    mono?: boolean;
}) => {
    let valueClass = "mt-1 font-semibold text-gray-900 ";
    let badgeClass = "";
    
    if (isRole) {
        valueClass = "mt-1 ";
        badgeClass = "inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700";
    } else if (isVerified) {
        badgeClass = value === "Verified" ? "text-emerald-600" : "text-amber-600";
        valueClass = `mt-1 font-semibold ${badgeClass} `;
    } else if (isActive) {
        badgeClass = value === "Active" ? "text-emerald-600" : "text-rose-600";
        valueClass = `mt-1 font-semibold ${badgeClass} `;
    }
    
    if (mono) {
        valueClass += "font-mono text-sm";
    }
    
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                {icon && <span>{icon}</span>}
                {label}
            </p>
            {isRole ? (
                <p className={valueClass}>
                    <span className={badgeClass}>{value}</span>
                </p>
            ) : isVerified || isActive ? (
                <p className={valueClass}>{value}</p>
            ) : (
                <p className={valueClass}>{value}</p>
            )}
        </div>
    );
};

export default UserStatsModal;