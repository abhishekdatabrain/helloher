"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  ChartOptions,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ConcentricCircleGraphProps {
  data: {
    totalRechargeAmountRecived: { totalCurrent: number };
    totalWalletBalance: { totalCurrent: number };
  };
}

const ConcentricCircleGraph: React.FC<ConcentricCircleGraphProps> = ({ data }) => {
  if (!data) return null;

  const points = [
    data.totalRechargeAmountRecived?.totalCurrent || 0,
    data.totalWalletBalance?.totalCurrent || 0,
  ];

  const chartData = {
    labels: ["Total Recharge Received", "Total Recharge Left"],
    datasets: [
      {
        data: points,
        backgroundColor: ["rgba(0, 123, 255, 0.8)", "rgba(0, 200, 83, 0.8)"],
        borderWidth: 0,
        cutout: "60%", // Inner hole
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        display: true,
        position: "bottom",
      },
      title: {
        display: false,
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  return (
    <div className="w-full h-80 sm:h-96 bg-whiteBg">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default ConcentricCircleGraph;
