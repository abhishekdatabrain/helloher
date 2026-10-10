"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

// Registering required components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const BarChartWithNegativeYAxis = ({ data: yearlyData }: { data: any }) => {
  const current =
    yearlyData?.monthlyData?.[yearlyData?.currentYear]?.combined ?? [];
  const rawPrevious =
    yearlyData?.monthlyData?.[yearlyData?.previousYear]?.combined ?? [];

  const previous = rawPrevious.map((val: number) =>
    val === 0 ? 0 : -Math.abs(val)
  );

  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Current Year",
        data: current, // Current year data (positive)
        backgroundColor: "rgba(0, 123, 255, 0.8)", // Fill color for current year (teal)
        borderColor: "rgba(0, 123, 255, 0.8)", // Border color for current year (same as fill)
        borderWidth: 1,
      },
      {
        label: "Last Year",
        data: previous, // Last year data (negative)
        backgroundColor: "rgba(255, 165, 0, 1)", // Fill color for last year (red)
        borderColor: "rgba(255, 165, 0, 1)", // Border color for last year (same as fill)
        borderWidth: 1,
      },
    ],
  };

  const yValues = [...current, ...previous];
  const yMax = Math.max(...yValues, 0);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Comparison of Current Year and Last Year (12 Months)",
      },
    },
    scales: {
      x: {
        // The x-axis labels for months
        grid: {
          drawOnChartArea: true,
        },
      },
      y: {
        beginAtZero: true,
        stacked: true, // Enable stacking for the y-axis
        min: -yMax,
        max: yMax,
      },
    },
  };

  if (typeof window === "undefined") return null;
  return (
    <div className="w-full h-96 mt-5 bg-infobg rounded-xl p-4">
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChartWithNegativeYAxis;