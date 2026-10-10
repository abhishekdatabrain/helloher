"use client";

import { useState, useEffect, useRef } from "react";
import { UserCheck } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { Fetch, Put } from "@/hooks/apiUtils";
import Loader from "@/components/common/Loader";

interface ProviderStatsModalProps {
    providerId: string;
    providerName: string;
    onClose: () => void;
}

const ProviderStatsModal: React.FC<ProviderStatsModalProps> = ({
    providerId,
    providerName,
    onClose,
}) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionPagination, setTransactionPagination] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Refs for scrollable modal content and chat requests section
    const modalContentRef = useRef<HTMLDivElement>(null);
    const chatRequestsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                let url = `/api/provider/stats/${providerId}`;

                // Add date parameters if both dates are selected
                if (startDate && endDate) {
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                }

                const response: any = await Fetch(url, {}, 5000, false, false);
                if (response?.success) {
                    setStats(response?.data);
                    setNewStatus(response?.data?.faceVerificationStatus);
                } else {
                    toast.error(response?.message || "Failed to fetch provider stats");
                }
            } catch (error: any) {
                toast.error(error?.message || "Error fetching provider stats");
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if both dates are filled or both are empty
        if (!shouldFetch(startDate, endDate)) {
            return;
        }

        fetchStats();
    }, [providerId, startDate, endDate]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setTransactionsLoading(true);
                let url = `/api/transactions/provider/${providerId}?page=${currentPage}`;
                if (selectedType) {
                    url += `&type=${selectedType}`;
                }
                const response: any = await Fetch(url, {}, 5000, false, false);
                if (response?.success) {
                    setTransactions(response?.data?.result || []);
                    setTransactionPagination(response?.data?.pagination);
                } else {
                    toast.error(response?.message || "Failed to fetch transactions");
                }
            } catch (error: any) {
                toast.error(error?.message || "Error fetching transactions");
            } finally {
                setTransactionsLoading(false);
            }
        };

        fetchTransactions();
    }, [providerId, currentPage, selectedType]);

    const handleStatusUpdate = async () => {
        if (newStatus === stats?.faceVerificationStatus) {
            setIsEditingStatus(false);
            return;
        }

        try {
            setLoading(true);
            const response: any = await Put(
                `/api/provider/${providerId}`,
                { faceVerificationStatus: newStatus },
                5000
            );

            if (response?.success) {
                setStats({ ...stats, faceVerificationStatus: newStatus });
                // toast.success("Verification status updated successfully");
                setIsEditingStatus(false);
            } else {
                toast.error(response?.message || "Failed to update status");
                setNewStatus(stats?.faceVerificationStatus);
            }
        } catch (error: any) {
            toast.error(error?.message || "Error updating status");
            setNewStatus(stats?.faceVerificationStatus);
        } finally {
            setLoading(false);
        }
    };

    // Only allow fetching when both dates are filled or both are empty
    const shouldFetch = (start: string, end: string) => {
        return (start === "" && end === "") || (start !== "" && end !== "");
    };

    if (loading) return <Loader />;

    if (!stats) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Provider Stats
                    </h3>
                    <p className="text-gray-600 text-center py-8">
                        Failed to load provider stats. Please try again.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // const fallbackImage = "https://img.freepik.com/free-vector/illustration-businesswoman_53876-5857.jpg?t=st=1770709780~exp=1770713380~hmac=5e32c87ed3cf7fb3546029b77d97a8373c7c7e30720425b205c7511fdf2fbb8f&w=2000";

    const fallbackImage = "/assets/products/fallback.png";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto" ref={modalContentRef}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold">{providerName}</h2>
                        <p className="text-blue-100 text-sm">Provider ID: {stats?.providerId || stats?.providerCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Compact Date Range Filter */}
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2 py-1 rounded text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            title="Start Date"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2 py-1 rounded text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            title="End Date"
                        />
                        <button
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 text-xs font-semibold transition h-8 min-w-[32px] justify-center"
                            style={{ minWidth: 32, height: 32 }}
                            title="Reset dates"
                        >
                            <span className="leading-none">Reset</span>
                        </button>

                        {/* Chat requests toggle */}
                        <button
                            onClick={() => {
                                if (modalContentRef.current && chatRequestsRef.current) {
                                    const content = modalContentRef.current;
                                    const target = chatRequestsRef.current;
                                    const contentRect = content.getBoundingClientRect();
                                    const targetRect = target.getBoundingClientRect();
                                    const scrollTop = content.scrollTop + (targetRect.top - contentRect.top);
                                    content.scrollTo({ top: scrollTop, behavior: "smooth" });
                                }
                            }}
                            className="relative flex items-center justify-center px-2 py-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 text-xs font-semibold transition h-8 min-w-[32px]"
                            style={{ minWidth: 32, height: 32 }}
                            title="Scroll to chat requests"
                        >
                            <UserCheck size={18} className="inline align-middle" />
                            {stats?.pendingChatRequests > 0 && (
                                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-1.5 py-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                                    {stats.pendingChatRequests}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="text-white hover:bg-blue-700 p-2 rounded-full transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Verification & Personal Info */}
                    <div className="mb-5 pb-5 border-b border-gray-200">
                        <h3 className="text-base font-semibold text-gray-800 mb-3">
                            Verification & Personal Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Face Verification Image */}
                            <div>
                                <div className="w-full h-54 rounded-lg overflow-hidden border-2 border-gray-200 mb-2 relative">
                                    <Image
                                        src={stats?.faceVerificationPicture || fallbackImage}
                                        alt="Face Verification"
                                        width={300}
                                        height={216}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                        priority
                                    />
                                </div>
                                {/* Audio sample player */}
                                {stats?.audioSample ? (
                                    <div className="mb-2">
                                        <audio controls src={stats?.audioSample} className="w-full mt-2" />
                                        {/* <a href={stats?.audioSample} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Open audio in new tab</a> */}
                                    </div>
                                ) : null}
                                <div className="space-y-1.5">
                                    <p className="text-gray-600 text-xs font-semibold">Verification Status</p>
                                    {isEditingStatus ? (
                                        <div className="flex gap-1 items-center">
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                                            >
                                                <option value="verified">Verified</option>
                                                <option value="pending">Pending</option>
                                                <option value="unverified">Unverified</option>
                                                <option value="reverify">Reverify</option>
                                            </select>
                                            <button
                                                onClick={handleStatusUpdate}
                                                disabled={loading}
                                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:bg-gray-400 whitespace-nowrap"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingStatus(false);
                                                    setNewStatus(stats?.faceVerificationStatus);
                                                }}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 whitespace-nowrap"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 items-center justify-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${stats?.faceVerificationStatus === "verified"
                                                ? "bg-green-100 text-green-700"
                                                : stats?.faceVerificationStatus === "pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : stats?.faceVerificationStatus === "reverify"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                {stats?.faceVerificationStatus?.charAt(0).toUpperCase() +
                                                    stats?.faceVerificationStatus?.slice(1)}
                                            </span>
                                            <button
                                                onClick={() => setIsEditingStatus(true)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personal Information (2 columns) */}
                            <div className="md:col-span-2">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Name</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.providerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Display Name</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.providerAlias || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Email</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.email || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Age</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.age}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Join Date</p>
                                        <p className="font-semibold text-sm text-gray-800">
                                            {new Date(stats?.joinDate).toLocaleDateString()}
                                        </p>
                                    </div>


                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Trust Score</p>
                                        <p className="font-semibold text-sm text-gray-800">
                                            {stats?.avgTrustScore} %
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Last Login</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.lastLoginDate ? new Date(stats?.lastLoginDate).toLocaleString() : "N/A"}</p>
                                    </div>

                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold">Total Users Trusted</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.trustScoreUserCount}</p>
                                    </div>

                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold mb-1">Online Status</p>
                                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit font-semibold text-sm ${stats?.isOnline
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"}`}>
                                            <span className={`w-2.5 h-2.5 rounded-full ${stats?.isOnline
                                                ? "bg-green-500 animate-pulse"
                                                : "bg-gray-400"}`}></span>
                                            {stats?.isOnline ? "Online" : "Offline"}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold mb-1">On Call</p>
                                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit font-semibold text-sm ${stats?.isOnCall
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"}`}>
                                            <span className={`w-2.5 h-2.5 rounded-full ${stats?.isOnCall
                                                ? "bg-green-500 animate-pulse"
                                                : "bg-gray-400"}`}></span>
                                            {stats?.isOnCall ? "On Call" : "Not on Call"}
                                        </div>

                                    </div>
                                    <div className="mt-2">
                                        <p className="text-gray-600 text-xs font-semibold">Call Started</p>
                                        <p className="font-semibold text-sm text-gray-800">{stats?.currentCallStartedAt ? new Date(stats?.currentCallStartedAt).toLocaleString() : "N/A"}</p>
                                    </div>

                                    {stats?.bio && (
                                        <div className="col-span-2">
                                            <p className="text-gray-600 text-xs font-semibold">Bio</p>
                                            <p className="text-sm text-gray-800 line-clamp-2">{stats?.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Earnings + Activity Section (Side by Side) */}
                    <div className="mb-5 pb-5 border-b border-gray-200">
                        <h3 className="text-base font-semibold text-gray-800 mb-3">
                            Earnings & Activity
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="bg-blue-50 p-2.5 rounded-lg">
                                <p className="text-gray-600 text-xs font-semibold">Total Earnings</p>
                                <p className="text-lg font-bold text-blue-600">₹{(stats?.totalEarnings || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-green-50 p-2.5 rounded-lg">
                                <p className="text-gray-600 text-xs font-semibold">Today&apos;s Earnings</p>
                                <p className="text-lg font-bold text-green-600">₹{0}</p>

                                {/* <p className="text-lg font-bold text-green-600">₹{(stats?.todayEarnings || 0).toLocaleString()}</p> */}
                            </div>
                            <div className="bg-purple-50 p-2.5 rounded-lg">
                                <p className="text-gray-600 text-xs font-semibold">Total Calls</p>
                                <p className="text-lg font-bold text-purple-600">{stats?.totalCalls || 0}</p>
                            </div>
                            <div className="bg-pink-50 p-2.5 rounded-lg">
                                <p className="text-gray-600 text-xs font-semibold">Total Messages</p>
                                <p className="text-lg font-bold text-pink-600">{stats?.totalMessages || 0}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg ${stats?.zone === 'Active Zone' ? 'bg-green-50' :
                                    stats?.zone === 'Super Active Zone' ? 'bg-blue-50' :
                                        'bg-gray-50'
                                }`}>
                                <p className="text-gray-600 text-xs font-semibold">Zone</p>
                                <p className={`text-lg font-bold ${stats?.zone === 'Active Zone' ? 'text-green-600' :
                                        stats?.zone === 'Super Active Zone' ? 'text-blue-600' :
                                            'text-gray-600'
                                    }`}>{stats?.zone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Withdrawals Section */}
                    <div className="mb-5">
                        <h3 className="text-base font-semibold text-gray-800 mb-3">
                            Withdrawal Requests
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-orange-50 p-2.5 rounded-lg border-l-4 border-orange-500">
                                <p className="text-gray-600 text-xs font-semibold">Total Requested</p>
                                <p className="text-lg font-bold text-orange-600">
                                    ₹{(stats?.totalWithdrawalRequested || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-yellow-50 p-2.5 rounded-lg border-l-4 border-yellow-500">
                                <p className="text-gray-600 text-xs font-semibold">Pending</p>
                                <p className="text-lg font-bold text-yellow-600">
                                    ₹{(stats?.pendingWithdrawals || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-green-50 p-2.5 rounded-lg border-l-4 border-green-500">
                                <p className="text-gray-600 text-xs font-semibold">Approved</p>
                                <p className="text-lg font-bold text-green-600">
                                    ₹{(stats?.approvedWithdrawals || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-red-50 p-2.5 rounded-lg border-l-4 border-red-500">
                                <p className="text-gray-600 text-xs font-semibold">Rejected</p>
                                <p className="text-lg font-bold text-red-600">
                                    ₹{(stats?.rejectedWithdrawals || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Requests Section (always rendered, scrollable) */}
                    <div className="mb-5" ref={chatRequestsRef}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-semibold text-gray-800">Chat Requests</h3>
                            {/* No close button needed since always visible */}
                        </div>
                        {stats?.chatRequests?.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">No chat requests found</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">User</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Contact</th>
                                            {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Age</th> */}
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Gender</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.chatRequests.map((request: any) => {
                                            const user = request.userId || {};
                                            return (
                                                <tr key={request._id} className="border-t border-gray-200">
                                                    <td className="px-4 py-2 text-sm text-gray-800">
                                                        {new Date(request.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-800">
                                                        {user.name || "Unknown"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-800">
                                                        {user.email || "-"}
                                                        {user.phone && (
                                                            <div className="text-xs text-gray-600">{user.phone}</div>
                                                        )}
                                                    </td>
                                                    {/* <td className="px-4 py-2 text-sm text-gray-800">
                                                        {user.age || "-"}
                                                    </td> */}
                                                    <td className="px-4 py-2 text-sm text-gray-800">
                                                        {user.gender || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-800">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : request.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {request.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>


                    {/* Transactions Section */}
                    <div className="mb-0">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-semibold text-gray-800">
                                Recent Transactions
                            </h3>
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCurrentPage(1); // Reset to first page when filter changes
                                }}
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="recharge">Recharge</option>
                                <option value="debit_call_minute">Debit Call Minute</option>
                                <option value="debit_call_second">Debit Call Second</option>
                                <option value="refund_call">Refund Call</option>
                                <option value="adjustment">Adjustment</option>
                                <option value="earning_call">Earning Call</option>
                                <option value="earning_call_end">Earning Call End</option>
                                <option value="admin_commission_end">Admin Commission End</option>
                                <option value="withdrawal_request">Withdrawal Request</option>
                                <option value="paid_profile">Paid Profile</option>
                                <option value="debit_call_auto">Debit Call Auto</option>
                                <option value="earning_call_auto">Earning Call Auto</option>
                                <option value="withdrawal">Withdrawal</option>
                                <option value="debit_call_end">Debit Call End</option>
                                <option value="penalty">Penalty</option>
                                <option value="debit_chat">Debit Chat</option>
                                <option value="earning_chat">Earning Chat</option>
                                <option value="admin_commission_chat">Admin Commission Chat</option>
                            </select>
                        </div>
                        {transactionsLoading ? (
                            <div className="text-center py-4">
                                <Loader />
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">No transactions found</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                            {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Details</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction: any) => (
                                            <tr key={transaction._id} className="border-t border-gray-200">
                                                <td className="px-4 py-2 text-sm text-gray-800">
                                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-800">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${transaction.type.startsWith('earning') ? 'bg-green-100 text-green-700' :
                                                        transaction.type.startsWith('debit') ? 'bg-red-100 text-red-700' :
                                                            transaction.type === 'adjustment' || transaction.type === 'penalty' ? 'bg-orange-100 text-orange-700' :
                                                                transaction.type.startsWith('admin_commission') ? 'bg-purple-100 text-purple-700' :
                                                                    transaction.type.startsWith('withdrawal') ? 'bg-yellow-100 text-yellow-700' :
                                                                        transaction.type === 'recharge' || transaction.type === 'refund_call' ? 'bg-green-100 text-green-700' :
                                                                            transaction.type === 'paid_profile' ? 'bg-blue-100 text-blue-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {transaction.type.replace(/_/g, ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-800">
                                                    <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        ₹{transaction.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-800">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${transaction.status === 'success' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                        }`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                {/* <td className="px-4 py-2 text-sm text-gray-600">
                                                    {transaction.meta?.reason || transaction.meta?.sessionId ? (
                                                        <div>
                                                            {transaction.meta.reason && <p>Reason: {transaction.meta.reason}</p>}
                                                            {transaction.meta.sessionId && <p>Session: {transaction.meta.sessionId.slice(-6)}</p>}
                                                        </div>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Pagination */}
                                {transactionPagination && transactionPagination.totalPages > 1 && (
                                    <div className="flex justify-between items-center mt-4 px-4 py-2 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600">
                                            Showing {((transactionPagination.currentPage - 1) * transactionPagination.itemsPerPage) + 1} to {Math.min(transactionPagination.currentPage * transactionPagination.itemsPerPage, transactionPagination.totalItems)} of {transactionPagination.totalItems} transactions
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-3 py-1 text-sm text-gray-700">
                                                Page {transactionPagination.currentPage} of {transactionPagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(transactionPagination.totalPages, prev + 1))}
                                                disabled={currentPage === transactionPagination.totalPages}
                                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-100 px-5 py-3 flex justify-end gap-3 border-t">
                    <button
                        onClick={onClose}
                        className="px-5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-sm transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProviderStatsModal;
