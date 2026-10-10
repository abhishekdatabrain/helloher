import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import React, { useState, useRef } from "react";
import {
  FiX,
  FiCheck,
  FiUsers,
  FiLoader,
  FiFilter,
  FiDownload,
  FiSettings,
  FiFileText,
  FiCalendar,
} from "react-icons/fi";
import { toast } from "react-toastify";

interface ExportConfig {
  filename: string;
  sheetName: string;
  includeTimestamp: boolean;
  selectedColumns: string[];
  dateFormat: string;
}

const GenerateExcelButton = ({ data }: { data: any[] }) => {
  const { isDarkMode } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const configRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<ExportConfig>({
    filename: "data_export",
    sheetName: "Data Items",
    includeTimestamp: true,
    selectedColumns: [],
    dateFormat: "YYYY-MM-DD",
  });

  // Get available columns from data
  const availableColumns = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0] || {});
  }, [data]);

  React.useEffect(() => {
    if (availableColumns.length > 0 && config.selectedColumns.length === 0) {
      setConfig((prev) => ({ ...prev, selectedColumns: availableColumns }));
    }
  }, [availableColumns, config.selectedColumns.length]);

  const formatDataForExport = (rawData: any[]) => {
    if (!rawData || rawData.length === 0) return [];

    return rawData.map((item) => {
      const formattedItem: any = {};

      config.selectedColumns.forEach((column) => {
        let value = item[column];

        // Format dates if specified
        if (
          value instanceof Date ||
          (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
        ) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toLocaleDateString();
          }
        }

        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = "";
        }

        formattedItem[column] = value;
      });

      return formattedItem;
    });
  };

  const simulateProgress = () => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          setExportProgress(progress);
          clearInterval(interval);
          resolve();
        } else {
          setExportProgress(progress);
        }
      }, 100);
    });
  };

  const handleGenerateExcel = async () => {
    if (!data || data.length === 0) {
      toast.warn("No data available to generate Excel file.");
      return;
    }

    if (config.selectedColumns.length === 0) {
      toast.warn("Please select at least one column to export.");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate processing time for large datasets
      if (data.length > 100) {
        await simulateProgress();
      }

      const formattedData = formatDataForExport(data);
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);

      const timestamp = config.includeTimestamp
        ? `_${new Date().toISOString().replace(/[:.-]/g, "_").split("T")[0]}`
        : "";

      const filename = `${config.filename}${timestamp}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Excel file "${filename}" downloaded successfully!`);
    } catch (error) {
      console.error("Error generating Excel file:", error);
      toast.error(
        "An error occurred while generating the Excel file. Please try again."
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setShowConfig(false);
    }
  };

  const toggleColumnSelection = (column: string) => {
    setConfig((prev) => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(column)
        ? prev.selectedColumns.filter((col) => col !== column)
        : [...prev.selectedColumns, column],
    }));
  };

  const selectAllColumns = () => {
    setConfig((prev) => ({
      ...prev,
      selectedColumns: availableColumns,
    }));
  };

  const deselectAllColumns = () => {
    setConfig((prev) => ({
      ...prev,
      selectedColumns: [],
    }));
  };

  // Close config panel when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        configRef.current &&
        !configRef.current.contains(event.target as Node)
      ) {
        setShowConfig(false);
      }
    };

    if (showConfig) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showConfig]);

  const isDataEmpty = !data || data.length === 0;

  return (
    <div className="relative">
      {/* Main Button */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleGenerateExcel}
          disabled={isExporting || isDataEmpty}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium text-white rounded-lg transition-all duration-200 ${
            isDarkMode ? "bg-infobg" : "bg-primary"
          } disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95 ${
            isExporting ? "cursor-wait" : ""
          }`}
        >
          {isExporting ? (
            <FiLoader className="text-base animate-spin" />
          ) : (
            <FiDownload className="text-base" />
          )}
          {isExporting ? "Exporting..." : "Export to Excel"}
        </button>

        <button
          onClick={() => setShowConfig(!showConfig)}
          disabled={isExporting || isDataEmpty}
          className={`p-2 text-xs font-medium text-white rounded-lg transition-all duration-200 ${
            isDarkMode ? "bg-infobg" : "bg-primary"
          } disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95`}
          title="Export Settings"
        >
          <FiSettings className="text-base" />
        </button>
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isDarkMode ? "bg-infobg" : "bg-primary"
            }`}
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div
          ref={configRef}
          className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
        >
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FiSettings size={16} />
                Export Settings
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* File Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FiFileText size={14} className="inline mr-1" />
                  Filename
                </label>
                <input
                  type="text"
                  value={config.filename}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, filename: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs text-black border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter filename"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sheet Name
                </label>
                <input
                  type="text"
                  value={config.sheetName}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      sheetName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs text-black border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter sheet name"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeTimestamp"
                  checked={config.includeTimestamp}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      includeTimestamp: e.target.checked,
                    }))
                  }
                  className="text-blue-600"
                />
                <label
                  htmlFor="includeTimestamp"
                  className="text-xs text-gray-700 flex items-center gap-1"
                >
                  <FiCalendar size={14} />
                  Include timestamp in filename
                </label>
              </div>
            </div>

            {/* Column Selection */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <FiFilter size={14} />
                  Select Columns ({config.selectedColumns.length}/
                  {availableColumns.length})
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={selectAllColumns}
                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    All
                  </button>
                  <button
                    onClick={deselectAllColumns}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {availableColumns.map((column) => (
                  <label
                    key={column}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={config.selectedColumns.includes(column)}
                      onChange={() => toggleColumnSelection(column)}
                      className="text-blue-600"
                    />
                    <span className="text-xs text-gray-700 capitalize">
                      {column
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Info */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <FiUsers size={14} />
                  Total Records: {data?.length || 0}
                </span>
                <span>Selected: {config.selectedColumns.length} columns</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateExcel}
              disabled={config.selectedColumns.length === 0}
              className={`px-3 py-2 text-xs font-medium text-white rounded-lg transition-all duration-200 flex items-center gap-1 ${
                isDarkMode
                  ? "bg-infobg hover:bg-opacity-90"
                  : "bg-primary hover:bg-opacity-90"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <FiCheck size={14} />
              Export Now
            </button>
          </div>
        </div>
      )}

      {/* Empty State Tooltip */}
      {/* {isDataEmpty && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
          No data available for export
        </div>
      )} */}
    </div>
  );
};

export default GenerateExcelButton;
