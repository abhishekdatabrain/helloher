"use client";

import dayjs from "dayjs";
import { Fetch } from "@/hooks/apiUtils";
import {
  FaMinus,
  FaBug,
  FaCheckCircle,
  FaPause,
  FaSpinner,
  FaSyncAlt,
  FaLock,
  FaTicketAlt,
} from "react-icons/fa";
import DateFilter from "../common/table/DateFilter";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";
import React, { useCallback, useEffect, useState } from "react";

const statusLabels = [
  "open",
  "in_progress",
  "on_hold",
  "re_assigned",
  "resolved",
  "closed",
];

const statusMeta: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  open: {
    label: "Open",
    icon: <FaBug className="text-blue-600" />,
    color: "text-blue-700",
  },
  closed: {
    label: "Closed",
    icon: <FaLock className="text-green-600" />,
    color: "text-green-700",
  },
  on_hold: {
    label: "On Hold",
    icon: <FaPause className="text-yellow-600" />,
    color: "text-yellow-700",
  },
  resolved: {
    label: "Resolved",
    icon: <FaCheckCircle className="text-purple-600" />,
    color: "text-purple-700",
  },
  in_progress: {
    label: "In Progress",
    icon: <FaSpinner className="text-orange-600 animate-spin" />,
    color: "text-orange-700",
  },
  re_assigned: {
    label: "Reassigned",
    icon: <FaSyncAlt className="text-cyan-600" />,
    color: "text-cyan-700",
  },
};

const TicketStatusSummary = () => {
  const [startDate, setStartDate] = useState(
    dayjs().subtract(7, "day").format("YYYY-MM-DD")
  );
  const [data, setData] = useState<any>({});
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const fetchData = useCallback(async (filterParams: any) => {
    const params = {
      endDate: filterParams.end ?? endDate,
      startDate: filterParams.start ?? startDate,
    };
    try {
      const url = "api/dashboard/customer-support";
      const response: any = await Fetch(url, params, 5000, true, false);
      setData(response);
    } catch (error) {
      console.log("fetchSale error:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData({})
  }, [fetchData]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getChangeIcon = (value: number) => {
    if (value > 0) return <FaArrowUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <FaArrowDown className="w-4 h-4 text-red-600" />;
    return <FaMinus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeTextColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-iconBlack";
  };

  const totalTickets = statusLabels.reduce(
    (sum, key) => sum + (data?.[key] ?? 0),
    0
  );

  return (
    <div className="bg-whiteBg p-4 mb-3 rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-xl font-semibold text-iconBlack flex items-center gap-2">
            <FaTicketAlt className="text-iconBlack" /> Ticket Status Summary
          </h2>
          <p className="text-xs text-gray-500">
            From <span className="font-medium">{formatDate(data?.from)}</span> to{" "}
            <span className="font-medium">{formatDate(data?.to)}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total Tickets:{" "}
            <span className="font-semibold text-iconBlack">{totalTickets}</span>
          </p>
        </div>
        <DateFilter
          endDate={endDate}
          startDate={startDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          fetchFilteredData={fetchData}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusLabels.map((status) => {
          const count = data?.[status] ?? 0;
          const change: any = data?.[`${status}_change`] ?? 0;
          const meta = statusMeta?.[status];

          return (
            <div
              key={status}
              className="p-3 bg-infobg rounded-xl transition"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {meta.icon}
                  <span className={`font-medium text-sm ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                {getChangeIcon(change)}
              </div>
              <div className={`text-2xl my-2 font-bold ${meta.color}`}>{count}</div>
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${getChangeTextColor(
                  change
                )}`}
              >
                {change === 0
                  ? "No change"
                  : `${change > 0 ? "+" : ""}${change}%`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketStatusSummary;
