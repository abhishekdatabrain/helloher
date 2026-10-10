import { FiPlus } from "react-icons/fi";
import { FaFilter } from "react-icons/fa";
import { debounce } from "@/hooks/general";
// import { FaUpload } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import GenerateExcelButton from "../GenerateExcel";

interface HeaderProps {
  type: string;
  suffix?: string;
  filteredData: any[];
  handleAdd: () => void;
  handleReset: () => void;
  handleImport?: () => void;
  operationsAllowed: {
    create?: boolean;
    [key: string]: boolean | undefined;
  };
}

const Header: React.FC<HeaderProps> = ({
  type,
  suffix,
  handleAdd,
  handleReset,
  filteredData,
  // handleImport,
  operationsAllowed,
}) => {
  const { isDarkMode } = useAuth();
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 bg-whiteBg p-4 rounded-2xl shadow-sm">
      {/* Section Title */}
      <div>
        <h2 className="text-base font-semibold text-iconBlack">
          All {type}
          {suffix && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              {suffix}
            </span>
          )}
        </h2>
        <p className="text-xs italic text-iconBlack">
          Manage and monitor all {type.toLowerCase()} records efficiently.
        </p>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Export to Excel */}
        <GenerateExcelButton data={filteredData} />

        {/* <button
          type="button"
          onClick={handleImport}
          className={`flex items-center gap-2 px-4 py-2 text-xs text-white ${
            isDarkMode ? "bg-infobg" : "bg-primary"
          } rounded-lg transition hover:opacity-90`}
        >
          <FaUpload className="text-xs" />
          Import Data
        </button> */}

        {/* Reset Filters Button */}
        <button
          type="button"
          onClick={debounce(handleReset, 1000)}
          className={`flex items-center gap-2 px-4 py-2 text-xs text-white ${isDarkMode ? "bg-infobg" : "bg-primary"
            } rounded-lg transition hover:opacity-90`}
        >
          <FaFilter className="text-xs" />
          Clear Filters
        </button>

        {/* Add Button (Conditional) */}
        {operationsAllowed?.create && (
          <button
            type="button"
            onClick={handleAdd}
            className={`flex items-center gap-2 px-4 py-2 text-xs text-white ${isDarkMode ? "bg-infobg" : "bg-primary"
              } rounded-lg transition hover:opacity-90`}
          >
            <FiPlus className="text-xs" />
            Add {type}
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
