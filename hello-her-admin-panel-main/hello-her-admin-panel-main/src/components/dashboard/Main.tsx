import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaHeadset,
  FaPhone,
  FaCreditCard,
  FaWallet,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaComments,
  FaImage,
  FaQuestionCircle,
  FaChartBar,
} from "react-icons/fa";
import { Fetch } from "../../hooks/apiUtils";

// interface CardData {
//     totalCurrent: number;
//     totalPrevious: number;
//     percentageChange: number;
//     title?: string;
//     monthlyEarning?: string;
//     totalEarning?: string;
//     adminWallet?: string;
//     todayEarning?: string;
// }

// interface StatusTile {
//     label: string;
//     count: number;
// }

interface DashboardData {
  cardData: Record<string, any>;
  statusTiles: Record<string, any>;
  alerts: {
    user: { issue: number; query: number };
    provider: { issue: number; query: number };
  };
}

const Main = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .split("T")[0];
  const [startDate, setStartDate] = useState(oneMonthAgo);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response: any = await Fetch(
          `/api/dashboard/v3?startDate=${startDate}&endDate=${endDate}`,
          {},
          15000,
          false,
          false,
        );
        if (response?.success && response?.data) {
          setDashboardData(response.data);
          setError(null);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err: any) {
        setError(err?.message || "Error fetching dashboard data");
        toast.error(err?.message || "Error fetching dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  const getPercentageColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-gray-600";
  };

  const renderCardValue = (value: any) => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toLocaleString();
    return "N/A";
  };

  const shortcuts = [
    {
      label: "Banners",
      icon: FaImage,
      path: "/dashboard/banner",
      color: "bg-blue-500",
    },
    {
      label: "Providers",
      icon: FaHeadset,
      path: "/dashboard/provider",
      color: "bg-purple-500",
    },
    {
      label: "Users",
      icon: FaUsers,
      path: "/dashboard/users",
      color: "bg-green-500",
    },
    {
      label: "Pending Withdrawals",
      icon: FaMoneyBillWave,
      path: "/dashboard/withdrawals",
      color: "bg-yellow-500",
    },
    // {
    //     label: "Commission Slab",
    //     icon: FaChartBar,
    //     path: "/dashboard/commission-slab",
    //     color: "bg-indigo-500",
    // },
    {
      label: "Chat Log",
      icon: FaComments,
      path: "/dashboard/communication",
      color: "bg-cyan-500",
    },
    // {
    //     label: "Call Logs",
    //     icon: FaPhone,
    //     path: "/dashboard/call-logs",
    //     color: "bg-teal-500",
    // },
    {
      label: "Provider's Issue",
      icon: FaChartBar,
      path: "/reports",
      color: "bg-pink-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline ml-2">{error}</span>
      </div>
    );
  }

  const { cardData, statusTiles, alerts } = dashboardData || {};
  const monthlyEarning = cardData?.adminEarnings?.monthlyEarning;
  const formattedAmount = `₹${renderCardValue(monthlyEarning)}`;

  const totalEarning = cardData?.adminEarnings?.totalEarning;
  const formattedTotalEarning = `₹${renderCardValue(totalEarning)}`;

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* ===== DASHBOARD HEADER WITH DATE FILTERS ===== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-500">
            Monitor key metrics and insights for your platform
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full lg:w-auto">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* ===== METRIC CARDS SECTION ===== */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Active Users
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {cardData?.users?.totalCurrent || 0}
                </p>
                <p
                  className={`text-sm mt-1 ${getPercentageColor(
                    cardData?.users?.percentageChange,
                  )}`}
                >
                  {cardData?.users?.percentageChange > 0 ? "+" : ""}
                  {cardData?.users?.percentageChange?.toFixed(1)}%
                </p>
              </div>
              <FaUsers className="text-4xl text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Providers Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Active Providers
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {cardData?.providers?.totalCurrent || 0}
                </p>
                <p
                  className={`text-sm mt-1 ${getPercentageColor(
                    cardData?.providers?.percentageChange,
                  )}`}
                >
                  {cardData?.providers?.percentageChange > 0 ? "+" : ""}
                  {cardData?.providers?.percentageChange?.toFixed(1)}%
                </p>
              </div>
              <FaHeadset className="text-4xl text-purple-500 opacity-20" />
            </div>
          </div>

          {/* Live Calls Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Live Calls</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {cardData?.liveCalls?.totalCurrent || 0}
                </p>
                <p
                  className={`text-sm mt-1 ${getPercentageColor(
                    cardData?.liveCalls?.percentageChange,
                  )}`}
                >
                  {cardData?.liveCalls?.percentageChange > 0 ? "+" : ""}
                  {cardData?.liveCalls?.percentageChange?.toFixed(1)}%
                </p>
              </div>
              <FaPhone className="text-4xl text-green-500 opacity-20" />
            </div>
          </div>

          {/* Pending Withdrawals Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Pending Withdrawals
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {cardData?.pendingWithdrawals?.totalCurrent || 0}
                </p>
                <p className="text-sm mt-1 text-orange-600">
                  ₹
                  {renderCardValue(
                    cardData?.totalPendingWithdrawalsAmount?.totalCurrent,
                  )}
                </p>
              </div>
              <FaCreditCard className="text-4xl text-orange-500 opacity-20" />
            </div>
          </div>

          {/* Total Withdrawals Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Withdrawals
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  ₹{renderCardValue(cardData?.withdrawals?.totalCurrent)}
                </p>
                <p
                  className={`text-sm mt-1 ${getPercentageColor(
                    cardData?.withdrawals?.percentageChange,
                  )}`}
                >
                  {cardData?.withdrawals?.percentageChange > 0 ? "+" : ""}
                  {cardData?.withdrawals?.percentageChange?.toFixed(1)}%
                </p>
              </div>
              <FaWallet className="text-4xl text-indigo-500 opacity-20" />
            </div>
          </div>

          {/* Monthly Earnings Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Monthly Earnings
                </p>

                <p
                  className={`mt-2 font-bold text-gray-800 break-words ${
                    formattedAmount.length > 12
                      ? "text-xl"
                      : formattedAmount.length > 9
                        ? "text-2xl"
                        : "text-3xl"
                  }`}
                >
                  {formattedAmount}
                </p>

                <p className="mt-1 text-sm text-green-600">Admin Earnings</p>
              </div>

              <FaMoneyBillWave className="flex-shrink-0 text-4xl text-yellow-500 opacity-20" />
            </div>
          </div>

          {/* Total Earnings Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Earnings
                </p>

                <p
                  className={`mt-2 font-bold text-gray-800 break-words ${
                    formattedTotalEarning.length > 12
                      ? "text-xl"
                      : formattedTotalEarning.length > 9
                        ? "text-2xl"
                        : "text-3xl"
                  }`}
                >
                  {formattedTotalEarning}
                </p>

                <p className="mt-1 text-sm text-blue-600">All Time</p>
              </div>

              <FaWallet className="flex-shrink-0 text-4xl text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Recharge Amount Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Recharge
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  ₹
                  {renderCardValue(
                    cardData?.totalRechargeAmountRecived?.totalCurrent,
                  )}
                </p>
                <p className="text-sm mt-1 text-green-600">Platform Revenue</p>
              </div>
              <FaCreditCard className="text-4xl text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATUS TILES SECTION ===== */}
      {statusTiles?.providers && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Provider Status</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(statusTiles.providers).map(
                ([key, value]: any) => {
                  if (key === "title") return null;
                  const colors: Record<string, string> = {
                    online: "bg-green-50 border-green-200 text-green-700",
                    offline: "bg-gray-50 border-gray-200 text-gray-700",
                    blocked: "bg-red-50 border-red-200 text-red-700",
                    kycPending:
                      "bg-yellow-50 border-yellow-200 text-yellow-700",
                    "In-call": "bg-blue-50 border-blue-200 text-blue-700",
                  };

                  return (
                    <div
                      key={key}
                      className={`border rounded-lg p-4 text-center ${
                        colors[key] || "bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-medium opacity-75">
                        {value?.label}
                      </p>
                      <p className="text-2xl font-bold mt-2">{value?.count}</p>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ALERTS SECTION ===== */}
      {alerts && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Pending Alerts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Alerts */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  User Alerts
                </h3>
                <FaUsers className="text-2xl text-blue-500" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FaExclamationTriangle className="text-yellow-500" />
                    <span className="text-gray-700 font-medium">Issues</span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                    {alerts.user.issue}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FaQuestionCircle className="text-blue-500" />
                    <span className="text-gray-700 font-medium">Queries</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    {alerts.user.query}
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Alerts */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-900">
                  Provider Alerts
                </h3>
                <FaHeadset className="text-2xl text-purple-500" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FaExclamationTriangle className="text-yellow-500" />
                    <span className="text-gray-700 font-medium">Issues</span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                    {alerts.provider.issue}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FaQuestionCircle className="text-blue-500" />
                    <span className="text-gray-700 font-medium">Queries</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    {alerts.provider.query}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SHORTCUTS SECTION ===== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {shortcuts.map((shortcut, idx) => {
            const IconComponent = shortcut.icon;
            return (
              <button
                key={idx}
                onClick={() => router.push(shortcut.path)}
                className={`${shortcut.color} rounded-lg shadow-md p-6 hover:shadow-lg transition-all transform hover:scale-105 text-white flex flex-col items-center justify-center space-y-3`}
              >
                <IconComponent className="text-3xl" />
                <span className="text-sm font-semibold text-center">
                  {shortcut.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Main;
