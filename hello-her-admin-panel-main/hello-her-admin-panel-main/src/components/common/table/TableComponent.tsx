import dayjs from "dayjs";
import Link from "next/link";
import Modal from "../Modal";
import Image from "next/image";
import Actions from "./Actions";
import { useRef, useState } from "react";
import { FiInbox } from "react-icons/fi";
// import { ColConfig } from "@/hooks/types";
import { usePathname } from "next/navigation";
import { functionList } from "@/hooks/customFunction";
import { AnimatePresence, motion } from "framer-motion";
import ConfirmModal from "@/components/crud/ConfirmModal";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import {
  formatCurrency,
  getFileCategory,
  // normalizePath,
} from "@/hooks/general";
import AdvancedPrintComponent from "../AdvancedPrintComponent";
import MultiPurposeComponent from "../MultiPurposeComponentProps";
import HLSPlayer from "../HLSPlayer";

interface Column {
  key: string;
  label: string;
  isDate?: boolean;
  sortable?: boolean;
  isCurrency?: string;
  isAudio?: boolean;
}

interface OperationsAllowed {
  read?: boolean;
  update?: boolean;
  delete?: boolean;
}

interface TableProps {
  sort: any;
  type: string;
  columns: Column[];
  filteredData: any;
  setSortConfig: any;
  fetchFilteredData: any;
  setData: (data: any) => void;
  setFilteredData: (data: any) => void;
  operationsAllowed: OperationsAllowed;
  setPaginate: (pagination: any) => void;
  setIsModalVisible: (isVisible: boolean) => void;
  onViewStats?: (row: any) => void;
  onManualPenalty?: (row: any) => void;
  additionalParams?: Record<string, any>;
}

const isValidUrl = (str: string) => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// ✅ Safely access nested value from path like "user.name" or "users[0].email"
const getNestedValue = (obj: any, path: string): any => {
  return path
    .replace(/\[(\w+)\]/g, ".$1") // users[0] -> users.0
    .split(".")
    .reduce((acc, part) => acc?.[part], obj);
};

// ✅ Capitalizes first letter
const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// ✅ Applies casing transformation
const applyTransform = (
  val: string,
  transform?: "uppercase" | "lowercase" | "capitalize"
): string => {
  if (!val) return val;
  switch (transform) {
    case "uppercase":
      return val.toUpperCase();
    case "lowercase":
      return val.toLowerCase();
    case "capitalize":
      return capitalize(val);
    default:
      return val;
  }
};

// ✅ Final function to get clean, formatted display value
const getFormattedValue = (
  obj: any,
  col: {
    key: string | string[];
    joiner?: string;
    fallback?: string;
    prefix?: string;
    suffix?: string;
    transform?: "uppercase" | "lowercase" | "capitalize";
  }
): string => {
  let raw: any;

  if (Array.isArray(col.key)) {
    raw = col.key
      .map((k) => getNestedValue(obj, k))
      .filter((v) => v !== undefined && v !== null)
      .join(col.joiner ?? " ");
  } else {
    raw = getNestedValue(obj, col.key);
  }

  const value =
    raw !== undefined && raw !== null ? String(raw) : col.fallback ?? "-";
  const transformed = applyTransform(value, col.transform);

  return `${col.prefix ?? ""}${transformed}${col.suffix ?? ""}`;
};

const Table: React.FC<TableProps> = ({
  sort,
  type,
  columns,
  setData,
  setPaginate,
  filteredData,
  setSortConfig,
  setFilteredData,
  setIsModalVisible,
  operationsAllowed,
  fetchFilteredData,
  onViewStats,
  onManualPenalty,
  additionalParams,
}) => {
  const pathname = usePathname();
  const pathNameParams = pathname?.split("/") || [];
  const targetRef = useRef<HTMLDivElement>(null);
  const id =
    pathNameParams.length > 4 ? pathNameParams[pathNameParams.length - 1] : "";

  const [confirmation, setConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>({});
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sort.key === key && sort.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    fetchFilteredData({ key, dir: direction });
  };

  const formatRowValue = (row: Record<string, any>, col: any) => {
    let value = row[col.key];
    if (
      col.isMultiPurpose &&
      col.multiPurposeProps &&
      value !== undefined &&
      value !== null &&
      value.toString()
    ) {
      const { multiPurposeProps } = col;
      const onClickHandler = async (data: any) => {
        try {
          const action = functionList[type];
          if (!action) throw new Error(`No handler found for type: ${type}`);

          const result = await action(data);
          if (result) await fetchFilteredData({});
          else console.log("Action failed to complete successfully.");
        } catch (error) {
          console.log("Error executing onClickHandler:", error);
        } finally {
          setConfirmation(false);
        }
      };

      const handleConfirmation = (data: any) => {
        setConfirmation(true);
        setConfirmationData(data);
      };

      return (
        <>
          <Modal
            width="w-fit"
            isVisible={confirmation}
            onClose={() => setConfirmation(false)}
          >
            <ConfirmModal
              data={confirmationData}
              handleAction={onClickHandler}
              onClose={() => setConfirmation(false)}
            />
          </Modal>
          <MultiPurposeComponent
            _id={row?._id}
            {...multiPurposeProps}
            text={value.toString()}
            onClick={handleConfirmation}
            onSelectChange={handleConfirmation}
          />
        </>
      );
    }

    // Image + text display
    if (col.imageWithKey) {
      const text = getFormattedValue(row, col);
      const imageValue = getNestedValue(row, col.imageWithKey);
      let imgSrc =
        col.image && imageValue ? imageValue : "/assets/bg/placeholder.avif";
      if (getFileCategory(imgSrc) === "image") imgSrc = imgSrc;
      else imgSrc = "/assets/bg/placeholder.avif";
      return (
        <div className="flex min-w-48 max-w-64 space-x-2 items-center">
          <Image
            width={100}
            height={100}
            alt="Image"
            unoptimized
            className="object-contain border w-9 aspect-square rounded-lg"
            src={imgSrc}
          />
          <div className="flex flex-col">
            <p className="text-xs capitalize line-clamp-1 text-wrap font-medium text-iconBlack">
              {text}
            </p>
            <p className="text-[10px] text-iconBlack">
              #{row["_id"].slice(-8)}
            </p>
          </div>
        </div>
      );
    }

    value = getFormattedValue(row, col);

    // Format date/time/currency/percent
    if (col.isAMPm && value) {
      const today = dayjs().format("YYYY-MM-DD");
      const realTime = dayjs(`${today} ${value}`);
      return realTime.format("hh:mm A");
    }
    if (col.isDateTime && value && value !== col.fallback)
      return dayjs(value).format("MMM D, YYYY - h:mm A") || col.fallback;
    if (col.isDate && value) return dayjs(value).format("YYYY-MM-DD");
    if (col.isTime && value)
      return dayjs(value, ["HH:mm:ss", "HH:mm"]).format("hh:mm A");
    if (col.isCurrency) return formatCurrency(Number(value));
    if (
      col.isPercent &&
      (typeof value === "number" || typeof value === "string")
    )
      return `${value} ${col.isPercent}`;

    // Inline HLS Audio Player
    if (col.isAudio && value) {
      let urls: string[] = [];
      if (Array.isArray(value)) urls = value;
      else if (typeof value === "string") urls = [value];

      if (urls.length === 0 || !urls[0]) return "-";

      return (
        <div className="flex flex-col gap-2 my-1 min-w-[240px]">
          {urls.map((rawUrl: string, i: number) => {
            if (!rawUrl || !isValidUrl(rawUrl)) return null;
            return <HLSPlayer key={i} url={rawUrl} />;
          })}
        </div>
      );
    }

    // Handle URLs as links
    if (col.urlLink && typeof value === "string" && isValidUrl(value)) {
      return (
        <Link
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {value}
        </Link>
      );
    }

    // If ID field, prefix with #
    if (col.key === "_id" && value)
      return <p className="uppercase">{"#" + value.slice(-8)}</p>;

    // Booleans as string
    if (typeof value === "boolean") return value.toString();

    // Numbers - just show the number
    if (typeof value === "number") return value;

    // Objects (fallback)
    if (typeof value === "object") return col.fallback ?? "-";

    // Strings (with truncation)
    if (typeof value === "string") {
      const maxLength = col.length ?? 50;
      if (col.truncateWords) {
        const words = value.split(" ");
        if (words.length > maxLength)
          return words.slice(0, maxLength).join(" ") + " ...";
      } else if (value.length > maxLength)
        return value.slice(0, maxLength) + " ...";
      return value;
    }

    // Default fallback
    return col.fallback ?? "-";
  };

  return (
    <>
      <AdvancedPrintComponent targetRef={targetRef as any} />
      <div
        ref={targetRef}
        className="overflow-x-scroll no-scrollbar rounded-2xl"
      >
        <table className="min-w-full bg-whiteBg">
          <thead>
            <tr className="whitespace-nowrap">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ maxWidth: `calc(100% / ${columns.length + 1})` }}
                  className="p-3 text-xs text-iconBlack font-bold border border-infobg text-left cursor-pointer"
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && (
                    <>
                      {sort.key === col.key && sort.direction === "asc" ? (
                        <FaSortUp className="inline ml-2" />
                      ) : sort.key === col.key && sort.direction === "desc" ? (
                        <FaSortDown className="inline ml-2" />
                      ) : (
                        <FaSort className="inline ml-2" />
                      )}
                    </>
                  )}
                </th>
              ))}
              {operationsAllowed?.read && id === "" && (
                <th className="p-3 no-print border text-center text-xs text-iconBlack border-infobg font-bold">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredData?.length > 0 ? (
                filteredData.map((row: any, index: number) => (
                  <motion.tr
                    key={row.id || index}
                    className="border text-black border-infobg cursor-pointer"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {columns.map((col: any) => (
                      <td
                        key={col.key}
                        className="text-[11px] border text-iconBlack whitespace-nowrap border-infobg px-3 py-1.5"
                      >
                        {formatRowValue(row, col)}
                      </td>
                    ))}
                    {operationsAllowed?.read && (
                      <td className="text-nowrap no-print flex justify-center border-infobg px-3 h-12 my-auto">
                        <Actions
                          row={row}
                          type={type}
                          setData={setData}
                          setPaginate={setPaginate}
                          setFilteredData={setFilteredData}
                          setIsModalVisible={setIsModalVisible}
                          operationsAllowed={operationsAllowed}
                          onViewStats={onViewStats}
                          onManualPenalty={onManualPenalty}
                          additionalParams={additionalParams}
                        />
                      </td>
                    )}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    className="p-6 text-center text-xs text-gray-600"
                    colSpan={columns.length + (operationsAllowed?.read ? 1 : 0)}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FiInbox className="w-8 h-8 text-iconBlack opacity-60" />

                      <p className="text-base font-semibold text-iconBlack">
                        No Records Found!
                      </p>

                      <p className="text-xs text-iconBlack">
                        We couldn&apos;t find any data that matches your current
                        view.
                      </p>

                      <ul className="text-xs text-gray-500 list-disc list-inside text-left max-w-md">
                        <li>
                          Review or reset applied filters and search terms
                        </li>
                        <li>Ensure the date range includes valid entries</li>
                        <li>
                          Check if the selected status or category is correct
                        </li>
                        <li>
                          If this is a new section, consider adding your first
                          entry
                        </li>
                      </ul>

                      <span className="text-xs italic text-gray-400 mt-2">
                        Tip: Keep your filters broad to start, then narrow down.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Table;
