import React from "react";
import dayjs from "dayjs";
import { FaHistory } from "react-icons/fa";
import { endpoints } from "@/data/endpoints";
import { formatCurrency } from "@/hooks/general";
import { AnimatePresence, motion } from "framer-motion";
import MultiPurposeComponent from "../common/MultiPurposeComponentProps";

const columns = [
  { key: "_id", label: "Ride ID", sortable: true },
  { key: "driverName", label: "Driver Name" },
  { key: "driverPhoneNumber", label: "Driver Phone" },
  { key: "distance", label: "Distance (km)", sortable: true },
  { key: "fare", label: "Fare (₹)", isCurrency: true, sortable: true },
  {
    key: "driverReachedAt",
    label: "Driver Reached",
    isDateTime: true,
    sortable: true,
  },
  { key: "startedAt", label: "Start Time", isDateTime: true, sortable: true },
  { key: "completedAt", label: "End Time", isDateTime: true, sortable: true },
  { key: "totalTime", label: "Duration (min)" },
  {
    key: "paymentMode",
    sortable: true,
    isMultiPurpose: true,
    label: "Payment Mode",
    multiPurposeProps: { type: "label" },
  },
  {
    key: "status",
    sortable: true,
    isMultiPurpose: true,
    label: "Ride Status",
    multiPurposeProps: { type: "label" },
  },
];

const RideHistoryModal = ({ data }: any) => {
  const formType = "Ride";
  const filteredData = data?.result;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, read: false };

  const formatRowValue = (
    row: Record<string, any>,
    col: {
      key: string;
      image?: true;
      isAMPm?: boolean;
      isTime?: boolean;
      isDate?: boolean;
      isPercent?: string;
      isCurrency?: string;
      isDateTime?: boolean;
      imageWithKey?: string;
      isMultiPurpose?: boolean;
      multiPurposeProps?: {
        options?: string[];
        type: "label" | "button" | "select";
      };
    }
  ) => {
    const value = row[col.key];

    if (
      col.isMultiPurpose &&
      col.multiPurposeProps &&
      value !== undefined &&
      value !== null &&
      value.toString()
    ) {
      const { multiPurposeProps } = col;

      return (
        <MultiPurposeComponent
          _id={row?._id}
          {...multiPurposeProps}
          text={value.toString()}
        />
      );
    }
    if (col.key === "_id" && value)
      return <p className="uppercase">{"#" + value.slice(-8)}</p>;
    if (col.isAMPm && value) {
      const today = dayjs().format("YYYY-MM-DD");
      const realTime = dayjs(`${today} ${value}`);
      const amPmTime = realTime.format("hh:mm A"); // 👈 e.g., "05:00 PM"
      return amPmTime;
    }
    if (col.isDateTime && value)
      return dayjs(value).format("MMM D, YYYY - h:mm A");
    if (col.isTime && value) return dayjs(value).format("h:mm A");
    if (col.isDate && value) return dayjs(value).format("YYYY-MM-DD");
    if (col.isCurrency && value) return formatCurrency(value);
    if (col.isPercent) return `${value} ${col.isPercent}`;

    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value.toString();

    if (value)
      return value.toString().length > 50
        ? value.toString().slice(0, 50) + " ..."
        : value.toString();
    else return "-";
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <FaHistory className="text-blue-600 w-5 h-5" />
        <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
          Ride History
        </h2>
      </div>
      <div className="overflow-x-scroll no-scrollbar rounded-2xl">
        <table className="min-w-full bg-whiteBg">
          <thead>
            <tr className="whitespace-nowrap">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ maxWidth: `calc(100% / ${columns.length + 1})` }}
                  className="px-3 py-2 text-sm text-iconBlack font-bold border border-infobg text-left cursor-pointer"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredData?.length > 0 ? (
                filteredData.map((row: any, index: number) => (
                  <motion.tr
                    key={row._id || index}
                    className="border text-black border-infobg cursor-pointer"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {columns.map((col: any) => (
                      <td
                        key={col.key}
                        className="text-xs border text-iconBlack whitespace-nowrap border-infobg px-3 py-2.5"
                      >
                        {formatRowValue(row, col)}
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (operationsAllowed?.read ? 1 : 0)}
                    className="text-center p-4 text-sm text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RideHistoryModal;
