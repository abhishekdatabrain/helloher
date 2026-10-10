import dayjs from "dayjs";
import useFetch from "@/hooks/useFetch";
import { Fetch } from "@/hooks/apiUtils";
import { FaMinus } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import DateFilter from "../common/table/DateFilter";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";

type StatusKey =
  | "ongoing"
  | "rejected"
  | "accepted"
  | "requested"
  | "completed"
  | "cancelled";

const statusColors: Record<StatusKey, { bg: string; text: string }> = {
  ongoing: {
    bg: "bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300",
    text: "text-blue-900",
  },
  rejected: {
    bg: "bg-gradient-to-br from-green-200 via-green-100 to-green-300",
    text: "text-green-900",
  },
  accepted: {
    bg: "bg-gradient-to-br from-yellow-200 via-yellow-100 to-yellow-300",
    text: "text-yellow-900",
  },
  requested: {
    bg: "bg-gradient-to-br from-purple-200 via-purple-100 to-purple-300",
    text: "text-purple-900",
  },
  completed: {
    bg: "bg-gradient-to-br from-orange-200 via-orange-100 to-orange-300",
    text: "text-orange-900",
  },
  cancelled: {
    bg: "bg-gradient-to-br from-pink-200 via-pink-100 to-pink-300",
    text: "text-pink-900",
  },
};

const RideStatusSummary = () => {
  const statuses: StatusKey[] = [
    "ongoing",
    "rejected",
    "accepted",
    "requested",
    "completed",
    "cancelled",
  ];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const [startDate, setStartDate] = useState(
    dayjs().subtract(7, "day").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const { data: dealsData } = useFetch("api/dashboard/ride-status");
  const crmStats: any = dealsData;

  const [data, setData] = useState(crmStats);

  useEffect(() => {
    if (crmStats) setData(crmStats);
  }, [crmStats]);

  const fetchData = async (filterParams: any) => {
    const params = {
      endDate: filterParams.end ?? endDate,
      startDate: filterParams.start ?? startDate,
    };
    try {
      const url = "api/dashboard/ride-status";
      const response: any = await Fetch(url, params, 5000, true, false);
      setData(response);
    } catch (error) {
      console.log("fetchSale error:", error);
    }
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <FaArrowUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <FaArrowDown className="w-4 h-4 text-red-600" />;
    return <FaMinus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeTextColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="bg-white p-4 mb-5 rounded-2xl">
      <div className="flex justify-between items-center mb-2">
        <div className="">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Ride Status Summary
          </h2>
          <p className="text-xs text-gray-600 mb-6">
            From{" "}
            <span className="font-medium">
              {formatDate(data?.from as string)}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {formatDate(data?.to as string)}
            </span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {statuses.map((status) => {
          const count = data?.[status] ?? 0;
          const change: any = data?.[`${status}_change`] ?? 0;
          const color = statusColors?.[status];

          return (
            <div
              key={status}
              className={`p-4 ${color.bg} rounded-xl transition`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`capitalize font-medium ${color.text}`}>
                  {status.replace(/_/g, " ")}
                </span>
                {getChangeIcon(change as number)}
              </div>
              <div className={`text-xl font-bold ${color.text}`}>{count}</div>
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${getChangeTextColor(
                  change as number
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

export default RideStatusSummary;
