"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  userStats: number[]; // [worker, employer, contractor]
  usePercentage?: boolean; // optional prop to normalize to %
}

const BarChart = ({ userStats, usePercentage = true }: BarChartProps) => {
  const labels = ["Wor.", "Emp.", "Cont."];
  const total = userStats.reduce((sum, val) => sum + val, 0);

  const normalizedData = userStats.map((val) =>
    usePercentage ? +(val / total * 100).toFixed(2) : val === 0 ? 1 : val // log scale can't show 0
  );

  const data = {
    labels,
    datasets: [
      {
        label: usePercentage ? "User Distribution (%)" : "Website Traffic",
        data: normalizedData,
        backgroundColor: ["#017bff", "#e74c3c", "#f39c12"],
        borderColor: ["#017bff", "#e74c3c", "#f39c12"],
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const originalValue = userStats[index];
            return usePercentage
              ? `Users: ${originalValue} (${context.raw}%)`
              : `Users: ${originalValue}`;
          },
        },
      },
      title: {
        display: false,
        text: "User Stats",
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "User category",
          font: { size: 12 },
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        type: usePercentage ? "linear" : "logarithmic",
        beginAtZero: false,
        title: {
          display: true,
          text: usePercentage ? "User Share (%)" : "User Count (Log Scale)",
          font: { size: 12 },
        },
        ticks: {
          callback: function (value) {
            return value.toString();
          },
        },
      },
    },
  };
  if (typeof window === "undefined") return null;
  return <Bar data={data} options={options} height={400} />;
};

export default BarChart;
