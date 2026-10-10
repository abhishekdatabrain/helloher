"use client";

import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Fetch } from "@/hooks/apiUtils";
import DateFilter from "../common/table/DateFilter";
import Image from "next/image";
import { Line, Bar } from "react-chartjs-2";
import {
  IoStatsChart,
  IoPeople,
  IoPersonAdd,
  IoRepeat,
  IoBusiness,
  IoWallet,
  IoTrendingUp,
} from "react-icons/io5";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  Filler
);

// ---------------------------
// Reusable Components
// ---------------------------

const StatCard = ({ label, value, change, color, icon }: any) => (
  <div className="p-6 rounded-2xl shadow border border-gray-100 bg-white hover:shadow-lg transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {change !== undefined && (
          <p
            className={`text-xs mt-1 ${
              change > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
          </p>
        )}
      </div>
      <div
        className={`p-3 rounded-xl text-white bg-gradient-to-br from-${color}-500 to-${color}-600 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const ProviderCard = ({ provider, type, value }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group">
    <div className="relative">
      <Image
        src={provider.profilePicture || "/default-avatar.png"}
        alt={provider.name}
        width={48}
        height={48}
        className="rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 truncate">{provider.name}</p>
      <p className="text-sm text-gray-500">
        {type === "sessions" && `${value} sessions`}
        {type === "earnings" && `₹${value?.toFixed(2) || "0.00"}`}
        {type === "spent" && `₹${value?.toFixed(2) || "0.00"} spent`}
      </p>
    </div>
    <div className="text-2xl font-bold text-gray-300 group-hover:text-blue-500 transition-colors">
      #
    </div>
  </div>
);

// ---------------------------
// Main Dashboard Component
// ---------------------------

const AnalyticsDashboard = () => {
  const [startDate, setStartDate] = useState(
    dayjs().subtract(14, "day").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    async (filterParams: any = {}) => {
      setLoading(true);
      const params = {
        startDate: filterParams.start ?? startDate,
        endDate: filterParams.end ?? endDate,
      };
      try {
        const response: any = await Fetch(
          `api/dashboard/analytics`,
          params,
          5000,
          true,
          false
        );
        if (response?.success) setData(response.data);
      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#374151",
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255,255,255,0.95)",
        titleColor: "#1F2937",
        bodyColor: "#4B5563",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        cornerRadius: 8,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6B7280", font: { family: "'Inter', sans-serif" } },
      },
      y: {
        grid: { color: "#F3F4F6" },
        ticks: { color: "#6B7280", font: { family: "'Inter', sans-serif" } },
      },
    },
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="space-y-4 w-full max-w-7xl">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load data
          </h3>
          <p className="text-gray-500 mb-4">Check your connection and retry</p>
          <button
            onClick={() => fetchData({})}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const { summary, charts } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 lg:p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500">
              Insights and metrics for your platform performance
            </p>
          </div>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            fetchFilteredData={(range) => fetchData(range)}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Users"
            value={summary.users.total}
            change={12}
            color="blue"
            icon={<IoPeople className="w-6 h-6" />}
          />
          <StatCard
            label="New Users"
            value={summary.users.new}
            change={8}
            color="green"
            icon={<IoPersonAdd className="w-6 h-6" />}
          />
          <StatCard
            label="Returning Users"
            value={summary.users.returning}
            change={15}
            color="purple"
            icon={<IoRepeat className="w-6 h-6" />}
          />
          <StatCard
            label="Total Providers"
            value={summary.providers.total}
            change={5}
            color="indigo"
            icon={<IoBusiness className="w-6 h-6" />}
          />
        </div>

        {/* Charts & Lists */}
        <div className="flex flex-col gap-4">
          {/* Session & Financial Chart */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Sessions & Financial Activity
              </h3>
              <IoStatsChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Bar
                data={{
                  labels: charts.labels.map((d: string) =>
                    dayjs(d).format("MMM DD")
                  ),
                  datasets: [
                    {
                      label: "Sessions",
                      data: charts.sessionChartData,
                      backgroundColor: "#3B82F6",
                      borderRadius: 6,
                    },
                    {
                      label: "Withdrawals",
                      data: charts.withdrawalChartData,
                      backgroundColor: "#EF4444",
                      borderRadius: 6,
                    },
                    {
                      label: "Recharges",
                      data: charts.rechargeChartData,
                      backgroundColor: "#22C55E",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          {/* User Growth & Peak Hours in single row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Growth Trend */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                User Growth Trend
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: charts.labels.map((d: string) =>
                      dayjs(d).format("MMM DD")
                    ),
                    datasets: [
                      {
                        label: "New Users",
                        data: charts.newUsersChartData,
                        borderColor: "#3B82F6",
                        backgroundColor: "rgba(59,130,246,0.1)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: "#3B82F6",
                      },
                      {
                        label: "Returning Users",
                        data: charts.returningUsersChartData,
                        borderColor: "#F59E0B",
                        backgroundColor: "rgba(245,158,11,0.1)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: "#F59E0B",
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Peak Hours Analysis */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 ">
                Peak Hours Analysis
              </h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: data.charts.callTimeData.map(
                      (item: any) => `${item.hour}:00`
                    ),
                    datasets: [
                      {
                        label: "Call Duration (min)",
                        data: data.charts.callTimeData.map(
                          (item: any) => item.totalDuration
                        ),
                        borderColor: "#3B82F6",
                        backgroundColor: "rgba(59,130,246,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: "#3B82F6",
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Providers & Users */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Most Active Providers
                </h3>
                <IoTrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-3">
                {summary.providers.mostActive.map((provider: any) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    type="sessions"
                    value={provider.sessionCount}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Top Earning Providers
                </h3>
                <IoWallet className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="space-y-3">
                {summary.revenue.topEarningProviders
                  .filter((p: any) => p.totalEarnings > 0)
                  .map((provider: any) => (
                    <ProviderCard
                      key={provider._id}
                      provider={provider}
                      type="earnings"
                      value={provider.totalEarnings}
                    />
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Top Spending Users
                </h3>
                <IoWallet className="w-5 h-5 text-purple-500" />
              </div>
              <div className="space-y-3">
                {summary.revenue.mostSpentUsers
                  .filter((user: any) => user.spent > 0)
                  .map((user: any) => (
                    <ProviderCard
                      key={user.userId}
                      provider={user}
                      type="spent"
                      value={user.spent}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
