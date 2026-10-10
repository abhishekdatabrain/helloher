"use client";

import {
  FaRegClock,
  FaUserFriends,
  FaNotesMedical,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  Legend,
  Filler,
  Tooltip,
  LinearScale,
  LineElement,
  PointElement,
  CategoryScale,
  Chart as ChartJS,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Fetch } from "@/hooks/apiUtils";
import { useMemo, useRef, useEffect, useState } from "react";
// import { formatCurrency } from "@/hooks/general";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const DashboardOverview = () => {
  const chartRef = useRef<any>(null);
  const [graph, setGraph] = useState<any>({});
  const [apiStats, setStats] = useState<any>([]);
  const [gradient, setGradient] = useState<string | CanvasGradient>(
    "rgba(74, 222, 128, 0)"
  );
  const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    const params = {
      endDate: endDate,
      startDate: startDate,
    };
    const fetchDashboardDetails = async () => {
      try {
        const url = "api/admin/dashboard";
        const response: any = await Fetch(url, params, 15000, true, false);
        if (response?.success) {
          const user = response?.data?.userStats;
          const booking = response?.data?.bookingStats;
          setStats([
            {
              title: "Total users",
              value: user?.currentDataCount,
              icon: <FaUserFriends size={24} className="text-white" />,
              change: user?.percentageChangeInData + " From previous Data",
              iconBg: "bg-cyan-500",
            },
            {
              title: "Total Locations",
              value: booking?.totalRevenue,
              icon: <FaMapMarkerAlt size={24} className="text-white" />,
              change: "Overall Earnings",
              iconBg: "bg-purple-500",
            },
            {
              title: "Total Bookings",
              value: booking.currentBookings,
              icon: <FaNotesMedical size={24} className="text-white" />,
              change:
                booking.percentageChangeInBookings + " From Previous Data",
              iconBg: "bg-rose-400",
            },
            {
              title: "Total Likes",
              value: booking?.currentRevenue,
              icon: <FaRegClock size={24} className="text-white" />,
              change: booking.percentageChangeInRevenue + " From Previous Data",
              iconBg: "bg-yellow-400",
            },
          ]);
        }
      } catch (error) {
        console.log("Fetch Error: ", error);
      }
    };
    fetchDashboardDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = {
      period: "weekly",
    };
    const fetchDashboardGraph = async () => {
      try {
        console.log(setEndDate, setStartDate);
        const url = "api/admin/dashboard/graph";
        const response: any = await Fetch(url, params, 15000, true, false);
        if (response?.success) setGraph(response?.data);
      } catch (error) {
        console.log("Fetch Error: ", error);
      }
    };
    fetchDashboardGraph();
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const gradientFill = ctx.createLinearGradient(0, 0, 0, chart.height);
    gradientFill.addColorStop(0, "rgba(74, 222, 128, 1)");
    gradientFill.addColorStop(1, "rgba(74, 222, 128, 0)");
    setGradient(gradientFill);
  }, []);

  const data: any = useMemo(() => {
    if (
      !Array.isArray(graph?.labels) ||
      !graph.labels.length ||
      !Array.isArray(graph?.datasets) ||
      !graph.datasets.length ||
      !gradient
    ) {
      return null;
    }

    return {
      labels: graph.labels,
      datasets: [
        {
          tension: 0,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          label: "Patients",
          pointHoverRadius: 0,
          data: graph.datasets,
          borderColor: "#4ade80",
          backgroundColor: gradient,
        },
      ],
    };
  }, [gradient, graph]);

  const options: any = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: false,
            drawTicks: false,
          },
          border: {
            display: false,
          },
          ticks: {
            padding: 10,
            // callback: (value: number) => `${value / 1000}k`,
          },
        },
        x: {
          grid: {
            display: false,
            drawTicks: false,
          },
          border: {
            display: false,
          },
          ticks: {
            padding: 10,
          },
        },
      },
    }),
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Stats Cards */}
      <div className="col-span-1 grid grid-cols-2 gap-4">
        {apiStats.map((stat: any, idx: any) => (
          <div
            key={idx}
            className={`rounded-xl p-4 flex flex-col justify-between bg-white`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-base font-semibold">{stat.title}</p>
                <h2 className="text-xl font-extrabold text-cyan-600 mt-1">
                  {stat.value}
                </h2>
              </div>
              <div className={`p-2.5 rounded-full ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-600">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl p-4 bg-white">
        <h2 className="text-base font-semibold mb-2">Revenue Statistics</h2>
        {data?.labels?.length > 0 && data?.datasets?.[0]?.data?.length > 0 ? (
          <Line ref={chartRef} data={data} options={options} />
        ) : (
          <p className="text-gray-500 text-xs">
            No data available for the selected period.
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
