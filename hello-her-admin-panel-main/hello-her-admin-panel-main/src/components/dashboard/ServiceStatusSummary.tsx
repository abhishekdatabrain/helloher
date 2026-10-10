"use client";

import dayjs from "dayjs";
import { Fetch } from "@/hooks/apiUtils";
import DateFilter from "../common/table/DateFilter";
import { useCallback, useEffect, useState } from "react";
import {
    LuClock9,
    LuLoader,
    LuOctagon,
    LuBadgeInfo,
    LuUserCheck,
    LuCheckCheck,
} from "react-icons/lu";

const statusTypes = ["Pending", "Assigned", "Completed", "Cancelled", "In Progress"];

const statusIcons: Record<string, any> = {
    Pending: <LuClock9 className="text-yellow-600 w-4 h-4" />,
    Assigned: <LuUserCheck className="text-blue-600 w-4 h-4" />,
    Completed: <LuCheckCheck className="text-green-600 w-4 h-4" />,
    Cancelled: <LuOctagon className="text-red-600 w-4 h-4" />,
    "In Progress": <LuLoader className="text-indigo-600 w-4 h-4 animate-spin" />,
};

const statusColors: Record<string, string> = {
    Pending: "text-yellow-600",
    Assigned: "text-blue-600",
    Completed: "text-green-600",
    Cancelled: "text-red-600",
    "In Progress": "text-indigo-600",
};

const ServiceStatusSummary = () => {
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
            const url = "api/dashboard/service-count";
            const response: any = await Fetch(url, params, 5000, true, false);
            setData(response?.data);
        } catch (error) {
            console.log("Error fetching service status:", error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchData({});
    }, [fetchData]);

    const totalRecords = Object.values(data || {}).reduce(
        (sum: number, statusObj: any) =>
            sum +
            statusTypes.reduce((acc, status) => acc + (statusObj?.[status] ?? 0), 0),
        0
    );

    return (
        <div className="bg-whiteBg p-4 rounded-2xl shadow-md mb-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-iconBlack flex items-center gap-2">
                        <LuBadgeInfo />
                        Service Status Summary
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        From <span className="font-medium">{startDate}</span> to{" "}
                        <span className="font-medium">{endDate}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Total Service Records:{" "}
                        <span className="font-semibold">{totalRecords}</span>
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(data).map(([serviceKey, statusData]: any) => (
                        <div
                            key={serviceKey}
                            className="bg-infobg rounded-xl pb-2 p-3 shadow-sm transition hover:shadow-md"
                        >
                            <h3 className="text-sm font-semibold text-iconBlack mb-4 capitalize truncate">
                                {serviceKey.replace(/_/g, " ")}
                            </h3>

                            <div className="grid grid-cols-5 gap-2 justify-between text-center">
                                {statusTypes.map((status) => (
                                    <div key={status} className="flex flex-col items-center gap-1">
                                        {statusIcons[status]}
                                        <span className={`text-[10px] font-medium ${statusColors[status]}`}>
                                            {status}
                                        </span>
                                        <span
                                            className={`text-lg -mt-1 font-semibold ${statusColors[status]}`}
                                        >
                                            {statusData?.[status] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-400 italic">
                    No service status data available for the selected date range.
                </div>
            )}
        </div>
    );
};

export default ServiceStatusSummary;
