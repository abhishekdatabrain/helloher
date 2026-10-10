"use client";

import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { Fetch } from "@/hooks/apiUtils";
import { IoStatsChart } from "react-icons/io5";
import DateFilter from "../common/table/DateFilter";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";
import { FC, useCallback, useEffect, useState } from "react";
import { formatCompactNumber, formatIndianCurrency } from "@/hooks/general";

const LineGraph = dynamic(() => import("@/components/chart/Linegraph"), {
  ssr: false, // 🚫 Disable Server Side Rendering for this component
});

const ConcentricCircleGraph = dynamic(
  () => import("@/components/chart/ConcentricCircleGraph"),
  {
    ssr: false, // 🚫 Disable Server Side Rendering for this component
  }
);
const BarChartWithNegativePositiveXAxis = dynamic(
  () => import("@/components/chart/BarChartWithNegativePositiveXAxis"),
  {
    ssr: false, // 🚫 Disable Server Side Rendering for this component
  }
);

import isToday from "dayjs/plugin/isToday";
dayjs.extend(isToday);

const Home: FC = () => {
  const [dateRangeMessage, setDateRangeMessage] = useState<string>("");
  const [startDate, setStartDate] = useState(
    dayjs().subtract(8, "day").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [data, setData] = useState<any>({});
  const [yearData, setYearlyData] = useState<any>({});

  useEffect(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diff = end.diff(start, "day");

    const isEndToday = end.isToday();
    const formattedStart = start.format("MMM D, YYYY");
    const formattedEnd = end.format("MMM D, YYYY");

    let message = "";

    if (isEndToday) {
      if (diff === 7)
        message = `last 7 days (${formattedStart} - ${formattedEnd})`;
      else message = `last ${diff} days (${formattedStart} - ${formattedEnd})`;
    } else
      message = `date range ${formattedStart} - ${formattedEnd} (${diff} days)`;

    setDateRangeMessage(message);
  }, [startDate, endDate]);

  const fetchData = useCallback(
    async (filterParams: any) => {
      const params = {
        endDate: filterParams.end ?? endDate,
        startDate: filterParams.start ?? startDate,
      };
      try {
        const response: any = await Fetch(
          "/api/dashboard",
          params,
          15000,
          true,
          false
        );
        if (response?.success) setData(response?.data);
      } catch (error) {
        console.log("fetchSale error:", error);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const fetchYearlyData = useCallback(async () => {
    const params = {};
    try {
      const response: any = await Fetch(
        "/api/revenue",
        params,
        15000,
        true,
        false
      );
      console.log("Revenue api response", response);
      if (response?.success) setYearlyData(response?.data);
    } catch (error) {
      console.log("fetchSale error:", error);
    }
  }, []);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData]);

  const renderIcon = (value: any) => {
    return value > 0 ? (
      <FaArrowUp className="text-primary" />
    ) : (
      <FaArrowDown className="text-red-500" />
    );
  };

  return (
    <div className="space-y-10">
      {/* CRM Stats */}
      <section className="">
        <div className="flex justify-between items-center">
          <h2 className="text-base leading-5 font-semibold text-iconBlack">
            Customer Insights Dashboard <br />
            <span className="text-xs italic font-normal text-iconBlack">
              - Displaying insights for {dateRangeMessage}
            </span>
          </h2>
          <DateFilter
            endDate={endDate}
            startDate={startDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            fetchFilteredData={fetchData}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 md:grid-cols-4">
          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data &&
                  data["totalRechargeAmountRecived"]?.percentageChange?.toFixed(
                    2
                  )}
                %{" "}
                {renderIcon(
                  data["totalRechargeAmountRecived"]?.percentageChange?.toFixed(
                    2
                  )
                )}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period (
                {formatIndianCurrency(
                  data["totalRechargeAmountRecived"]?.totalPrevious
                )}
                )
              </h3>
              {data && data?.["totalRechargeAmountRecived"] && (
                <LineGraph
                  data={data["totalRechargeAmountRecived"]?.chartData}
                  borderColor="rgba(0, 123, 255, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-blue-200 p-1.5 w-fit rounded-full">
                <div className="bg-blue-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatIndianCurrency(
                    data["totalRechargeAmountRecived"]?.totalCurrent
                  )}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total Recharge
                  <br /> Amount Received
                </h3>
              </div>
            </div>
          </div>

          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data && data["users"]?.percentageChange?.toFixed(2)}%{" "}
                {renderIcon(data["users"]?.percentageChange?.toFixed(2))}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period ({data["users"]?.totalPrevious})
              </h3>
              {data && data?.["users"] && (
                <LineGraph
                  data={data["users"]?.chartData}
                  borderColor="rgba(255, 165, 0, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-orange-200 p-1.5 w-fit rounded-full">
                <div className="bg-orange-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(data["users"]?.totalCurrent)}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total Users
                </h3>
              </div>
            </div>
          </div>

          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data && data["activeSessions"]?.percentageChange?.toFixed(2)}%{" "}
                {renderIcon(
                  data["activeSessions"]?.percentageChange?.toFixed(2)
                )}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period ({data["activeSessions"]?.totalPrevious})
              </h3>
              {data && data?.["activeSessions"] && (
                <LineGraph
                  data={data["activeSessions"]?.chartData}
                  borderColor="rgba(255, 0, 0, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-red-200 p-1.5 w-fit rounded-full">
                <div className="bg-red-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(data["activeSessions"]?.totalCurrent)}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total Active
                  <br />
                  Sessions
                </h3>
              </div>
            </div>
          </div>

          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data && data["providers"]?.percentageChange?.toFixed(2)}%
                {renderIcon(data["providers"]?.percentageChange?.toFixed(2))}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period ({data["providers"]?.totalPrevious})
              </h3>
              {data && data?.["providers"] && (
                <LineGraph
                  data={data["providers"]?.chartData}
                  borderColor="rgba(128, 128, 128, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-purple-200 p-1.5 w-fit rounded-full">
                <div className="bg-purple-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(data["providers"]?.totalCurrent)}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total
                  <br />
                  Providers
                </h3>
              </div>
            </div>
          </div>

          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data &&
                  data["pendingWithdrawals"]?.percentageChange?.toFixed(2)}
                %
                {renderIcon(
                  data["pendingWithdrawals"]?.percentageChange?.toFixed(2)
                )}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period ({data["pendingWithdrawals"]?.totalPrevious})
              </h3>
              {data && data?.["pendingWithdrawals"] && (
                <LineGraph
                  data={data["pendingWithdrawals"]?.chartData}
                  borderColor="rgba(0, 128, 0, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-green-200 p-1.5 w-fit rounded-full">
                <div className="bg-green-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(
                    data["pendingWithdrawals"]?.totalCurrent
                  )}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Pending
                  <br /> Withdrawals
                </h3>
              </div>
            </div>
          </div>
          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data &&
                  data[
                    "totalPendingWithdrawalsAmount"
                  ]?.percentageChange?.toFixed(2)}
                %
                {renderIcon(
                  data[
                    "totalPendingWithdrawalsAmount"
                  ]?.percentageChange?.toFixed(2)
                )}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period (
                {data["totalPendingWithdrawalsAmount"]?.totalPrevious})
              </h3>
              {data && data?.["totalPendingWithdrawalsAmount"] && (
                <LineGraph
                  data={data["totalPendingWithdrawalsAmount"]?.chartData}
                  borderColor="rgba(128, 128, 128, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-cyan-200 p-1.5 w-fit rounded-full">
                <div className="bg-cyan-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(
                    data["totalPendingWithdrawalsAmount"]?.totalCurrent
                  )}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total Withdrawals <br /> (Pending)
                </h3>
              </div>
            </div>
          </div>
          <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data && data["withdrawals"]?.percentageChange?.toFixed(2)}%
                {renderIcon(data["withdrawals"]?.percentageChange?.toFixed(2))}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period ({data["withdrawals"]?.totalPrevious})
              </h3>
              {data && data?.["withdrawals"] && (
                <LineGraph
                  data={data["withdrawals"]?.chartData}
                  borderColor="rgba(128, 128, 128, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-yellow-200 p-1.5 w-fit rounded-full">
                <div className="bg-yellow-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(data["withdrawals"]?.totalCurrent)}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total Withdrawals <br />
                  (Paid)
                </h3>
              </div>
            </div>
          </div>

          {/* <div className="p-2 flex gap-2 bg-whiteBg rounded-xl">
            <div className="w-[55%]">
              <p className="text-sm inline-flex items-center text-iconBlack font-bold">
                {data &&
                  data["totalWalletBalance"]?.percentageChange?.toFixed(2)}
                %{" "}
                {renderIcon(
                  data["totalWalletBalance"]?.percentageChange?.toFixed(2)
                )}
              </p>
              <h3 className="text-[10px] font-semibold text-iconBlack">
                from last period ({data["totalWalletBalance"]?.totalPrevious})
              </h3>
              {data && data?.["totalWalletBalance"] && (
                <LineGraph
                  data={data["totalWalletBalance"]?.chartData}
                  borderColor="rgba(255, 165, 0, 1)"
                />
              )}
            </div>
            <div className="w-[45%] flex flex-col justify-end items-end text-right gap-3">
              <div className="bg-orange-200 p-1.5 w-fit rounded-full">
                <div className="bg-orange-500 w-fit p-1.5 rounded-full">
                  <IoStatsChart className="text-white text-base" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-iconBlack">
                  {formatCompactNumber(
                    data["totalWalletBalance"]?.totalCurrent
                  )}
                </p>
                <h3 className="text-[10px] text-gray-500 font-semibold">
                  Total Recharge Left
                </h3>
              </div>
            </div>
          </div> */}
          
        </div>

        {/* <div className="flex flex-row">
          <div className="grid grid-cols-3 my-3 gap-3 rounded-xl">
            <div className="col-span-2">
              <div className="bg-whiteBg p-4 rounded-xl h-full">
                <h3 className="text-base text-iconBlack font-semibold pb-4">
                  Revenue Statistics
                </h3>
                <div className="bg-infobg p-4 rounded-xl">
                  <div className="grid grid-cols-3 justify-center items-center">
                    <div className="text-center text-xs text-iconBlack font-semibold">
                      Current Revenue
                      <br />
                      <span className="text-base font-extrabold text-iconBlack">
                        {formatIndianCurrency(yearData?.totalCurrent)}
                      </span>
                    </div>
                    <div className="text-center text-xs text-iconBlack font-semibold">
                      Previous Revenue
                      <br />
                      <span className="text-base font-extrabold text-iconBlack">
                        {formatIndianCurrency(yearData?.totalPrevious)}
                      </span>
                    </div>
                    <div className="text-center text-xs text-iconBlack font-semibold">
                      Change (%)
                      <br />
                      <span className="text-base font-extrabold text-iconBlack">
                        {yearData?.percentageChange?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <BarChartWithNegativePositiveXAxis data={yearData} />
              </div>
            </div>
          </div>
          
          <div className="col-span-1 h-full">
            <div className="p-4 h-full rounded-xl bg-whiteBg">
              <h3 className="text-base font-semibold text-iconBlack mb-3">
                Revenue Report
              </h3>
              <ConcentricCircleGraph data={{
                totalRechargeAmountRecived: data.totalRechargeAmountRecived,
                totalWalletBalance: data.totalWalletBalance,
              }}
              />
            </div>
          </div>
        </div> */}

        <div className="flex flex-row gap-3 my-3">
          {/* Revenue Chart */}
          <div className="flex-1">
            <div className="bg-whiteBg p-4 rounded-xl h-full">
              <h3 className="text-base text-iconBlack font-semibold pb-4">
                Revenue Statistics
              </h3>
              <div className="bg-infobg p-4 rounded-xl">
                <div className="grid grid-cols-3 justify-center items-center">
                  <div className="text-center text-xs text-iconBlack font-semibold">
                    Current Revenue
                    <br />
                    <span className="text-base font-extrabold text-iconBlack">
                      {formatIndianCurrency(yearData?.totalCurrent)}
                    </span>
                  </div>
                  <div className="text-center text-xs text-iconBlack font-semibold">
                    Previous Revenue
                    <br />
                    <span className="text-base font-extrabold text-iconBlack">
                      {formatIndianCurrency(yearData?.totalPrevious)}
                    </span>
                  </div>
                  <div className="text-center text-xs text-iconBlack font-semibold">
                    Change (%)
                    <br />
                    <span className="text-base font-extrabold text-iconBlack">
                      {yearData?.percentageChange?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <BarChartWithNegativePositiveXAxis data={yearData} />
            </div>
          </div>

          {/* Circle Revenue */}
          <div className="w-80">
            <div className="p-4 h-full rounded-xl bg-whiteBg">
              <h3 className="text-base font-semibold text-iconBlack mb-3">
                Revenue Report
              </h3>
              <ConcentricCircleGraph
                data={{
                  totalRechargeAmountRecived: data.totalRechargeAmountRecived,
                  totalWalletBalance: data.totalWalletBalance,
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
