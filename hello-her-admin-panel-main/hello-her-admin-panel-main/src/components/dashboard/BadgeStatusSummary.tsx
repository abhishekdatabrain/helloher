"use client";

import dayjs from "dayjs";
import { Fetch } from "@/hooks/apiUtils";
import { FaIdBadge } from "react-icons/fa";
import DateFilter from "../common/table/DateFilter";
import { useCallback, useEffect, useState } from "react";
import { AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

const statusTypes = ["pending", "approved", "rejected"];

const statusIcons: any = {
    pending: <AiOutlineClockCircle className="text-yellow-600 w-4 h-4" />,
    approved: <AiOutlineCheckCircle className="text-blue-600 w-4 h-4" />,
    rejected: <AiOutlineCloseCircle className="text-red-600 w-4 h-4" />,
};

const statusColors: Record<string, string> = {
    pending: "text-yellow-500",
    approved: "text-blue-500",
    rejected: "text-red-500",
};

const BadgeStatusSummary = () => {
    const [startDate, setStartDate] = useState(
        dayjs().subtract(7, "day").format("YYYY-MM-DD")
    );
    const [data, setData] = useState({});
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

    const fetchData = useCallback(async (filterParams: any) => {
        const params = {
            startDate: filterParams.start ?? startDate,
            endDate: filterParams.end ?? endDate,
        };
        try {
            const url = "api/dashboard/badge-count";
            const response: any = await Fetch(url, params, 5000, true, false);
            setData(response?.data);
        } catch (error) {
            console.log("Error fetching badge counts:", error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchData({});
    }, [fetchData]);

    const totalBadges = Object.values(data || {}).reduce(
        (sum: number, statusObj: any) =>
            sum +
            (statusObj?.pending ?? 0) +
            (statusObj?.approved ?? 0) +
            (statusObj?.rejected ?? 0),
        0
    );

    return (
        <div className="bg-whiteBg p-4 rounded-2xl shadow-md mt-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-iconBlack flex items-center gap-2">
                        <FaIdBadge />
                        Badge Status Summary
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        From{" "}
                        <span className="font-medium text-gray-500">{startDate}</span> to{" "}
                        <span className="font-medium text-gray-500">{endDate}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Total Badge Records:{" "}
                        <span className="font-semibold text-gray-500">{totalBadges}</span>
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

            {data && Object.keys(data).length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {Object.entries(data || {}).map(([badgeKey, badgeStats]: any) => (
                        <div
                            key={badgeKey}
                            className="bg-infobg rounded-xl p-3 pb-1 transition-shadow hover:shadow-md"
                        >
                            <h3 className="text-xs font-semibold text-iconBlack mb-3 capitalize">
                                {badgeKey.replace(/_/g, " ")}
                            </h3>
                            <div className="grid grid-cols-3 justify-between">
                                {statusTypes.map((status) => (
                                    <div
                                        key={status}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        {statusIcons[status]}
                                        <span
                                            className={`text-[10px] font-medium ${statusColors[status]}`}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                        <span
                                            className={`text-lg -mt-1 font-semibold ${statusColors[status]}`}
                                        >
                                            {badgeStats?.[status] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-400 italic">
                    No badge data available for the selected date range.
                </div>
            )}
        </div>
    );
};

export default BadgeStatusSummary;
