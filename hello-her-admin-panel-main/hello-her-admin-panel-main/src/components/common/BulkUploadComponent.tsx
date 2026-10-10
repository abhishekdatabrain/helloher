import { endpoints } from "@/data/endpoints";
import { Fetch, Post } from "@/hooks/apiUtils";
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  FiX,
  FiEye,
  FiPlus,
  FiFile,
  FiCopy,
  FiCheck,
  FiTrash2,
  FiEyeOff,
  FiLayers,
  FiUpload,
  FiSearch,
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiArrowRight,
  FiChevronDown,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

interface NestedField {
  path: string;
  value: any;
  type: "primitive" | "object" | "array";
}

interface ColumnMapping {
  mappedName: string;
  originalName: string;
  dataType: "string" | "number" | "date" | "boolean" | "object" | "array";
  isNested: boolean;
  isSelected: boolean;
  isRequired: boolean;
  nestedPath?: string;
  transformation?: "none" | "flatten" | "stringify" | "extract";
  extractKey?: string;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };
}

interface UploadedFile {
  file: File;
  id: string;
  data?: any[];
  sheets?: string[];
  errors?: string[];
  warnings?: string[];
  activeSheet?: string;
  columns?: ColumnMapping[];
  nestedStructure?: Record<string, NestedField[]>;
}

interface FieldSuggestion {
  path: string;
  type: string;
  examples: any[];
  frequency: number;
}

export default function AdvancedBulkUploadComponent(props: any) {
  const formType = props.data.name;
  const [previewRows, setPreviewRows] = useState(10);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "json" | "tree" | any>(
    "table"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "selected" | "required" | "nested"
  >("all");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Helper function to analyze nested structure
  const analyzeNestedStructure = (
    data: any[],
    maxDepth: number = 5
  ): Record<string, NestedField[]> => {
    const structure: Record<string, NestedField[]> = {};

    const traverse = (obj: any, path: string = "", depth: number = 0) => {
      if (depth > maxDepth || !obj || typeof obj !== "object") return;

      Object.keys(obj).forEach((key) => {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (!structure[currentPath]) {
          structure[currentPath] = [];
        }

        if (Array.isArray(value)) {
          structure[currentPath].push({
            path: currentPath,
            value: value,
            type: "array",
          });

          // Analyze array elements
          if (value.length > 0 && typeof value[0] === "object") {
            traverse(value[0], `${currentPath}[0]`, depth + 1);
          }
        } else if (value && typeof value === "object") {
          structure[currentPath].push({
            path: currentPath,
            value: value,
            type: "object",
          });

          traverse(value, currentPath, depth + 1);
        } else {
          structure[currentPath].push({
            path: currentPath,
            value: value,
            type: "primitive",
          });
        }
      });
    };

    data.slice(0, 100).forEach((row) => traverse(row)); // Analyze first 100 rows
    return structure;
  };

  // Helper function to get nested value using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => {
      if (key.includes("[") && key.includes("]")) {
        const [arrayKey, indexStr] = key.split("[");
        const index = parseInt(indexStr.replace("]", ""));
        return current?.[arrayKey]?.[index];
      }
      return current?.[key];
    }, obj);
  };

  // Helper function to set nested value using dot notation
  const setNestedValue = (obj: any, path: string, value: any): void => {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Generate field suggestions based on data analysis
  const generateFieldSuggestions = (data: any[]): FieldSuggestion[] => {
    const suggestions: Record<string, FieldSuggestion> = {};

    const analyzeObject = (obj: any, prefix: string = "") => {
      Object.keys(obj || {}).forEach((key) => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (!suggestions[fullPath]) {
          suggestions[fullPath] = {
            path: fullPath,
            type: Array.isArray(value) ? "array" : typeof value,
            frequency: 0,
            examples: [],
          };
        }

        suggestions[fullPath].frequency++;
        if (suggestions[fullPath].examples.length < 3) {
          suggestions[fullPath].examples.push(value);
        }

        if (value && typeof value === "object" && !Array.isArray(value)) {
          analyzeObject(value, fullPath);
        }
      });
    };

    data.slice(0, 50).forEach((row) => analyzeObject(row));
    return Object.values(suggestions).sort((a, b) => b.frequency - a.frequency);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processExcelFile = async (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetNames = workbook.SheetNames;
          const firstSheet = workbook.Sheets[sheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
            raw: false,
            defval: null,
          });

          if (jsonData.length === 0) {
            reject(new Error("File is empty"));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);

          // Process data and handle nested objects
          const processedData = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              let value = row[index];

              // Try to parse JSON strings for nested objects
              if (
                typeof value === "string" &&
                (value.startsWith("{") || value.startsWith("["))
              ) {
                try {
                  value = JSON.parse(value);
                } catch {
                  // Keep as string if parsing fails
                }
              }

              // Handle dot notation in headers
              if (header && header.includes(".")) {
                setNestedValue(obj, header, value);
              } else {
                obj[header || `Column_${index}`] = value;
              }
            });
            return obj;
          });

          // Analyze nested structure
          const nestedStructure = analyzeNestedStructure(processedData);
          const suggestions = generateFieldSuggestions(processedData);

          // Create enhanced column mappings
          const columns: ColumnMapping[] = [];

          // Add original flat columns
          headers.forEach((header) => {
            if (header) {
              columns.push({
                originalName: header,
                mappedName: header,
                dataType: "string",
                isSelected: true,
                isRequired: false,
                isNested: header.includes("."),
                nestedPath: header.includes(".") ? header : undefined,
                transformation: "none",
              });
            }
          });

          // Add suggested nested fields
          suggestions.slice(0, 20).forEach((suggestion) => {
            if (!columns.find((col) => col.originalName === suggestion.path)) {
              columns.push({
                originalName: suggestion.path,
                mappedName: suggestion.path.replace(/\./g, "_"),
                dataType: (suggestion.type as any) || "string",
                isSelected: suggestion.frequency > processedData.length * 0.5, // Auto-select if present in >50% of records
                isRequired: false,
                isNested: suggestion.path.includes("."),
                nestedPath: suggestion.path,
                transformation: "extract",
              });
            }
          });

          resolve({
            file,
            id: generateId(),
            data: processedData,
            columns,
            sheets: sheetNames,
            activeSheet: sheetNames[0],
            nestedStructure,
            errors: [],
            warnings: [],
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsProcessing(true);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setIsProcessing(true);
      await processFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (file) =>
        file.type.includes("spreadsheet") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".json")
    );

    try {
      const processedFiles = await Promise.all(
        validFiles.map((file) => processExcelFile(file))
      );

      setUploadedFiles((prev) => [...prev, ...processedFiles]);
      if (processedFiles.length > 0 && !activeFileId) {
        setActiveFileId(processedFiles[0].id);
      }
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateColumnMapping = (
    fileId: string,
    columnIndex: number,
    updates: Partial<ColumnMapping> | any
  ) => {
    setUploadedFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId && file.columns) {
          const newColumns = [...file.columns];
          newColumns[columnIndex] = { ...newColumns[columnIndex], ...updates };
          return { ...file, columns: newColumns };
        }
        return file;
      })
    );
  };

  const addCustomNestedColumn = (fileId: string, path?: string) => {
    setUploadedFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId && file.columns) {
          const newColumn: ColumnMapping = {
            originalName: path || `custom.field_${Date.now()}`,
            mappedName: path ? path.replace(/\./g, "_") : "custom_field",
            dataType: "string",
            isSelected: true,
            isRequired: false,
            isNested: true,
            nestedPath: path || `custom.field_${Date.now()}`,
            transformation: "extract",
          };
          return { ...file, columns: [...file.columns, newColumn] };
        }
        return file;
      })
    );
  };

  const validateData = (file: UploadedFile): Record<string, string[]> => {
    const errors: Record<string, string[]> = {};
    const selectedColumns = file.columns?.filter((col) => col.isSelected) || [];

    selectedColumns.forEach((column) => {
      const columnErrors: string[] = [];

      file.data?.forEach((row, index) => {
        const value =
          column.isNested && column.nestedPath
            ? getNestedValue(row, column.nestedPath)
            : row[column.originalName];

        // Required field validation
        if (
          column.isRequired &&
          (value === null || value === undefined || value === "")
        ) {
          columnErrors.push(`Row ${index + 1}: Required field is empty`);
        }

        // Type validation
        if (value !== null && value !== undefined) {
          switch (column.dataType) {
            case "number":
              if (isNaN(Number(value))) {
                columnErrors.push(`Row ${index + 1}: Invalid number format`);
              }
              break;
            case "date":
              if (isNaN(Date.parse(value))) {
                columnErrors.push(`Row ${index + 1}: Invalid date format`);
              }
              break;
          }
        }
      });

      if (columnErrors.length > 0) {
        errors[column.mappedName] = columnErrors.slice(0, 5); // Show first 5 errors
      }
    });

    return errors;
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    if (activeFileId === fileId) {
      const remaining = uploadedFiles.filter((file) => file.id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const removeColumn = (fileId: string, columnIndex: number) => {
    setUploadedFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId && file.columns) {
          const newColumns = file.columns.filter(
            (_, index) => index !== columnIndex
          );
          return { ...file, columns: newColumns };
        }
        return file;
      })
    );
  };

  const transformData = (file: UploadedFile) => {
    const selectedColumns = file.columns?.filter((col) => col.isSelected) || [];

    return file.data?.map((row) => {
      const transformedRow: any = {};

      selectedColumns.forEach((column) => {
        let value =
          column.isNested && column.nestedPath
            ? getNestedValue(row, column.nestedPath)
            : row[column.originalName];

        // Apply transformations
        switch (column.transformation) {
          case "stringify":
            value = JSON.stringify(value);
            break;
          case "flatten":
            if (typeof value === "object" && value !== null) {
              const flattened: any = {};
              const flattenObject = (obj: any, prefix: string = "") => {
                Object.keys(obj).forEach((key) => {
                  const newKey = prefix ? `${prefix}_${key}` : key;
                  if (
                    typeof obj[key] === "object" &&
                    obj[key] !== null &&
                    !Array.isArray(obj[key])
                  ) {
                    flattenObject(obj[key], newKey);
                  } else {
                    flattened[newKey] = obj[key];
                  }
                });
              };
              flattenObject(value);
              value = flattened;
            }
            break;
          case "extract":
            if (column.extractKey && typeof value === "object") {
              value = value[column.extractKey];
            }
            break;
        }

        // Apply default value
        if (
          (value === null || value === undefined || value === "") &&
          column.defaultValue
        ) {
          value = column.defaultValue;
        }

        // Handle nested mapping
        if (column.mappedName.includes(".")) {
          setNestedValue(transformedRow, column.mappedName, value);
        } else {
          transformedRow[column.mappedName] = value;
        }
      });

      return transformedRow;
    });
  };

  const handleSubmit = async () => {
    const activeFile = uploadedFiles.find((file) => file.id === activeFileId);
    if (!activeFile) return;

    const errors = validateData(activeFile);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert("Please fix validation errors before submitting");
      return;
    }

    const transformedData = transformData(activeFile);
    const selectedColumns =
      activeFile.columns?.filter((col) => col.isSelected) || [];

    console.log("Submitting nested data:", {
      fileName: activeFile.file.name,
      columns: selectedColumns,
      data: transformedData,
      totalRows: transformedData?.length || 0,
      nestedStructure: activeFile.nestedStructure,
    });

    // alert(
    //   `Successfully processed ${transformedData?.length || 0} rows with ${
    //     selectedColumns.length
    //   } columns (including nested fields)!`
    // );

    try {
      setSubmitting(true);
      const url = `${endpoints[formType].url}`;
      const response: any = await Post(url, transformedData as any);
      if (response.success) {
        const resp: any = await Fetch(url, {}, 5000, true, false);
        if (resp?.success) props?.setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination)
          props?.setPaginate(resp?.data?.pagination);
        props.onClose?.();
      } else return toast.error("Something went wrong!");
    } catch (error) {
      console.log("Error: ", error);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFile = uploadedFiles.find((file) => file.id === activeFileId);
  const selectedColumns =
    activeFile?.columns?.filter((col) => col.isSelected) || [];

  const filteredColumns = useMemo(() => {
    if (!activeFile?.columns) return [];

    const filtered = activeFile.columns.filter((column) => {
      if (
        searchTerm &&
        !column.originalName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !column.mappedName.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      switch (filterType) {
        case "selected":
          return column.isSelected;
        case "required":
          return column.isRequired;
        case "nested":
          return column.isNested;
        default:
          return true;
      }
    });

    return filtered;
  }, [activeFile?.columns, searchTerm, filterType]);

  const previewData = useMemo(() => {
    if (!activeFile?.data) return [];
    return transformData(activeFile)?.slice(0, previewRows) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, previewRows, selectedColumns]);

  const renderNestedValue = (
    value: any,
    depth: number = 0
  ): React.ReactNode => {
    if (depth > 3) return "..."; // Prevent infinite recursion

    if (value === null || value === undefined)
      return <span className="text-gray-400">null</span>;
    if (typeof value === "string")
      return <span className="text-green-600">&pos;{value}&pos;</span>;
    if (typeof value === "number")
      return <span className="text-blue-600">{value}</span>;
    if (typeof value === "boolean")
      return <span className="text-purple-600">{value.toString()}</span>;

    if (Array.isArray(value)) {
      return (
        <div className="ml-2">
          <span className="text-gray-600">[</span>
          {value.slice(0, 3).map((item, index) => (
            <div key={index} className="ml-4">
              {renderNestedValue(item, depth + 1)}
              {index < Math.min(value.length - 1, 2) && ","}
            </div>
          ))}
          {value.length > 3 && (
            <div className="ml-4 text-gray-400">
              ... {value.length - 3} more
            </div>
          )}
          <span className="text-gray-600">]</span>
        </div>
      );
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      return (
        <div className="ml-2">
          <span className="text-gray-600">{"{"}</span>
          {keys.slice(0, 3).map((key) => (
            <div key={key} className="ml-4">
              <span className="text-orange-600">&pos;{key}&pos;</span>:{" "}
              {renderNestedValue(value[key], depth + 1)}
            </div>
          ))}
          {keys.length > 3 && (
            <div className="ml-4 text-gray-400">
              ... {keys.length - 3} more properties
            </div>
          )}
          <span className="text-gray-600">{"}"}</span>
        </div>
      );
    }

    return String(value);
  };

  return (
    <div className="w-full pt-4 space-y-4">
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-indigo-700 text-white rounded-t-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Data Upload</h2>
              <p className="text-blue-100">
                Upload Excel/JSON files, map nested fields, and process complex
                data structures
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <FiLayers className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-4">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                            ${
                              isDragOver
                                ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
                                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                            } ${
              isProcessing ? "opacity-50 pointer-events-none" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                {isProcessing ? (
                  <FiRefreshCw className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <FiUpload className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {isProcessing
                    ? "Processing files..."
                    : "Drop your files here"}
                </p>
                <p className="text-gray-500">or click to browse</p>
                <p className="text-sm text-gray-400 mt-2">
                  Supports .xlsx, .xls, .csv, .json files with nested objects
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File Tabs */}
        {uploadedFiles.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {uploadedFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap text-sm font-medium transition-all
                                        ${
                                          activeFileId === file.id
                                            ? "border-blue-500 text-blue-600 bg-white"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                        }`}
                >
                  <FiFile className="w-4 h-4" />
                  <span className="truncate max-w-32">{file.file.name}</span>
                  <div className="flex items-center space-x-1">
                    {file.errors && file.errors.length > 0 && (
                      <FiAlertCircle className="w-3 h-3 text-red-500" />
                    )}
                    {file.warnings && file.warnings.length > 0 && (
                      <FiAlertCircle className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeFile && (
          <div className="border-t border-gray-200">
            {/* Controls */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Columns</option>
                    <option value="selected">Selected</option>
                    <option value="required">Required</option>
                    <option value="nested">Nested Only</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => addCustomNestedColumn(activeFile.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Nested Field</span>
                  </button>

                  <button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="flex items-center space-x-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    <FiSettings className="w-4 h-4" />
                    <span>Advanced</span>
                  </button>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {showPreview ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                    <span>{showPreview ? "Hide" : "Show"} Preview</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Column Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <FiLayers className="w-5 h-5" />
                    <span>Field Mapping ({filteredColumns.length})</span>
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedColumns.length} selected
                  </span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  {filteredColumns.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 divide-gray-200">
                      {filteredColumns.map((column, index) => (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-50 border rounded-lg transition-colors"
                        >
                          <div className="space-y-4">
                            {/* Column Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={column.isSelected}
                                  onChange={(e) =>
                                    updateColumnMapping(activeFile.id, index, {
                                      isSelected: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="flex items-center space-x-2">
                                  {column.isNested && (
                                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                      NESTED
                                    </div>
                                  )}
                                  {column.isRequired && (
                                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                      REQUIRED
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {Object.keys(validationErrors).includes(
                                  column.mappedName
                                ) && (
                                  <FiAlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <button
                                  onClick={() =>
                                    removeColumn(activeFile.id, index)
                                  }
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Column Details */}
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Original Path
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={column.originalName}
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 font-mono text-sm"
                                  />
                                  {column.isNested && (
                                    <div className="absolute right-2 top-2">
                                      <FiArrowRight className="w-4 h-4 text-blue-500" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Mapped Name
                                </label>
                                <input
                                  type="text"
                                  value={column.mappedName}
                                  onChange={(e) =>
                                    updateColumnMapping(activeFile.id, index, {
                                      mappedName: e.target.value,
                                    })
                                  }
                                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                  placeholder="output.field.name"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Type
                                  </label>
                                  <select
                                    value={column.dataType}
                                    onChange={(e) =>
                                      updateColumnMapping(
                                        activeFile.id,
                                        index,
                                        { dataType: e.target.value }
                                      )
                                    }
                                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="object">Object</option>
                                    <option value="array">Array</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transform
                                  </label>
                                  <select
                                    value={column.transformation}
                                    onChange={(e) =>
                                      updateColumnMapping(
                                        activeFile.id,
                                        index,
                                        { transformation: e.target.value }
                                      )
                                    }
                                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  >
                                    <option value="none">None</option>
                                    <option value="extract">Extract</option>
                                    <option value="flatten">Flatten</option>
                                    <option value="stringify">Stringify</option>
                                  </select>
                                </div>
                              </div>

                              {/* Advanced Options */}
                              {showAdvancedOptions && (
                                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                                  <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={column.isRequired}
                                        onChange={(e) =>
                                          updateColumnMapping(
                                            activeFile.id,
                                            index,
                                            { isRequired: e.target.checked }
                                          )
                                        }
                                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                      />
                                      <span className="text-sm text-gray-700">
                                        Required
                                      </span>
                                    </label>
                                  </div>

                                  {column.transformation === "extract" && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Extract Key
                                      </label>
                                      <input
                                        type="text"
                                        value={column.extractKey || ""}
                                        onChange={(e) =>
                                          updateColumnMapping(
                                            activeFile.id,
                                            index,
                                            { extractKey: e.target.value }
                                          )
                                        }
                                        placeholder="key to extract from object"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Default Value
                                    </label>
                                    <input
                                      type="text"
                                      value={column.defaultValue || ""}
                                      onChange={(e) =>
                                        updateColumnMapping(
                                          activeFile.id,
                                          index,
                                          { defaultValue: e.target.value }
                                        )
                                      }
                                      placeholder="default value if empty"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Validation Errors */}
                              {validationErrors[column.mappedName] && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <FiAlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-800">
                                      Validation Errors
                                    </span>
                                  </div>
                                  <ul className="text-sm text-red-700 space-y-1">
                                    {validationErrors[column.mappedName].map(
                                      (error, i) => (
                                        <li key={i}>• {error}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FiSearch className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No columns match your search criteria</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Preview */}
              {showPreview && (
                <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <FiEye className="w-5 h-5" />
                      <span>Data Preview</span>
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">View:</label>
                        <select
                          value={viewMode}
                          onChange={(e) => setViewMode(e.target.value)}
                          className="px-2 py-1 text-black border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="table">Table</option>
                          <option value="json">JSON</option>
                          <option value="tree">Tree</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Rows:</label>
                        <select
                          value={previewRows}
                          onChange={(e) =>
                            setPreviewRows(Number(e.target.value))
                          }
                          className="px-2 py-1 text-black border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={500}>500</option>
                          <option value={1000}>1000</option>
                          <option value={5000}>5000</option>
                          <option value={10000}>10000</option>
                          <option value={50000}>50000</option>
                          <option value={100000}>100000</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg max-h-[600px] overflow-auto">
                    {previewData.length > 0 && selectedColumns.length > 0 ? (
                      <div>
                        {viewMode === "table" && (
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                              <tr>
                                {selectedColumns.map((column, index) => (
                                  <th
                                    key={index}
                                    className="px-4 py-3 text-left font-semibold text-gray-700 border-b whitespace-nowrap"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span>{column.mappedName}</span>
                                      {column.isRequired && (
                                        <span className="text-red-500">*</span>
                                      )}
                                      {column.isNested && (
                                        <FiLayers className="w-3 h-3 text-blue-500" />
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 font-normal mt-1">
                                      {column.dataType}{" "}
                                      {column.transformation !== "none" &&
                                        `• ${column.transformation}`}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                  {selectedColumns.map((column, colIndex) => {
                                    const value = column.mappedName.includes(
                                      "."
                                    )
                                      ? getNestedValue(row, column.originalName)
                                      : row[column.originalName];

                                    return (
                                      <td
                                        key={colIndex}
                                        className="px-4 py-3 text-gray-800 max-w-xs"
                                      >
                                        <div
                                          className="truncate"
                                          title={
                                            typeof value === "object"
                                              ? JSON.stringify(value)
                                              : String(value)
                                          }
                                        >
                                          {typeof value === "object" &&
                                          value !== null ? (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                                              {Array.isArray(value)
                                                ? `[${value.length}]`
                                                : `{${
                                                    Object.keys(value).length
                                                  }}`}
                                            </span>
                                          ) : (
                                            <span
                                              className={`${
                                                value === null ||
                                                value === undefined ||
                                                value === ""
                                                  ? "text-gray-400 italic"
                                                  : ""
                                              }`}
                                            >
                                              {value === null ||
                                              value === undefined
                                                ? "null"
                                                : String(value) || "—"}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {viewMode === "json" && (
                          <div className="p-4">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                              {JSON.stringify(previewData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {viewMode === "tree" && (
                          <div className="p-4 space-y-4">
                            {previewData.map((row, rowIndex) => (
                              <div
                                key={rowIndex}
                                className="border border-gray-200 rounded-lg p-3"
                              >
                                <div className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                  <span>Row {rowIndex + 1}</span>
                                  <button
                                    onClick={() => {
                                      const nodeId = `row-${rowIndex}`;
                                      setExpandedNodes((prev) => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(nodeId)) {
                                          newSet.delete(nodeId);
                                        } else {
                                          newSet.add(nodeId);
                                        }
                                        return newSet;
                                      });
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    {expandedNodes.has(`row-${rowIndex}`) ? (
                                      <FiChevronDown className="w-4 h-4" />
                                    ) : (
                                      <FiChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                {expandedNodes.has(`row-${rowIndex}`) && (
                                  <div className="ml-4 space-y-2">
                                    {renderNestedValue(row)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FiEyeOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>
                          {selectedColumns.length === 0
                            ? "Please select at least one column to preview data"
                            : "No data to preview"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {activeFile.data?.length || 0}
                      </div>
                      <div className="text-blue-100 text-sm">Total Rows</div>
                    </div>
                    <FiFile className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {selectedColumns.length}
                      </div>
                      <div className="text-green-100 text-sm">
                        Selected Fields
                      </div>
                    </div>
                    <FiCheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {selectedColumns.filter((col) => col.isNested).length}
                      </div>
                      <div className="text-purple-100 text-sm">
                        Nested Fields
                      </div>
                    </div>
                    <FiLayers className="w-8 h-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {Object.keys(validationErrors).length}
                      </div>
                      <div className="text-red-100 text-sm">
                        Validation Errors
                      </div>
                    </div>
                    <FiAlertCircle className="w-8 h-8 text-red-200" />
                  </div>
                </div>
              </div>

              {/* Nested Structure Analysis */}
              {activeFile.nestedStructure &&
                Object.keys(activeFile.nestedStructure).length > 0 && (
                  <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <FiLayers className="w-5 h-5 text-indigo-600" />
                      <span>Detected Nested Structure</span>
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-700 mb-3">
                          Available Paths
                        </h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {Object.entries(activeFile.nestedStructure)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([path, fields]) => (
                              <div
                                key={path}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="font-mono text-sm text-gray-800">
                                    {path}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Type: {fields[0]?.type} • Found in{" "}
                                    {fields.length} records
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    addCustomNestedColumn(activeFile.id, path)
                                  }
                                  className="ml-3 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 transition-colors"
                                >
                                  <FiPlus className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-700 mb-3">
                          Sample Data Structure
                        </h5>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-64 overflow-auto">
                          <pre className="text-xs font-mono">
                            {activeFile.data && activeFile.data.length > 0
                              ? JSON.stringify(activeFile.data[0], null, 2)
                              : "No data available"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Field Suggestions */}
              {activeFile && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                    <FiCheckCircle className="w-5 h-5" />
                    <span>Quick Add Suggestions</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {generateFieldSuggestions(activeFile.data || [])
                      .slice(0, 8)
                      .filter(
                        (suggestion) =>
                          !activeFile.columns?.find(
                            (col) => col.originalName === suggestion.path
                          )
                      )
                      .map((suggestion) => (
                        <button
                          key={suggestion.path}
                          onClick={() =>
                            addCustomNestedColumn(
                              activeFile.id,
                              suggestion.path
                            )
                          }
                          className="inline-flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
                        >
                          <span className="font-mono">{suggestion.path}</span>
                          <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
                            {suggestion.type}
                          </span>
                          <FiPlus className="w-3 h-3" />
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Validation Summary */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center space-x-2">
                    <FiAlertCircle className="w-5 h-5" />
                    <span>
                      Validation Issues ({Object.keys(validationErrors).length})
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(validationErrors).map(([field, errors]) => (
                      <div
                        key={field}
                        className="bg-white rounded-md p-3 border border-red-200"
                      >
                        <div className="font-medium text-red-800 mb-1">
                          {field}
                        </div>
                        <ul className="text-sm text-red-700 space-y-1">
                          {errors.map((error, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-red-500">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">
                  Processing Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-md border border-blue-200">
                    <div className="text-blue-600 font-medium mb-1">
                      Input Data
                    </div>
                    <div className="text-gray-700">
                      • {activeFile?.data?.length || 0} total rows
                      <br />• {activeFile?.columns?.length || 0} detected fields
                      <br />•{" "}
                      {activeFile?.columns?.filter((col) => col.isNested)
                        .length || 0}{" "}
                      nested paths
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-blue-200">
                    <div className="text-blue-600 font-medium mb-1">
                      Selected Output
                    </div>
                    <div className="text-gray-700">
                      • {selectedColumns.length} mapped fields
                      <br />•{" "}
                      {
                        selectedColumns.filter((col) => col.isRequired).length
                      }{" "}
                      required fields
                      <br />•{" "}
                      {
                        selectedColumns.filter(
                          (col) => col.transformation !== "none"
                        ).length
                      }{" "}
                      with transformations
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-blue-200">
                    <div className="text-blue-600 font-medium mb-1">
                      Data Quality
                    </div>
                    <div className="text-gray-700">
                      • {Object.keys(validationErrors).length} validation errors
                      <br />•{" "}
                      {
                        selectedColumns.filter((col) => col.defaultValue).length
                      }{" "}
                      fields with defaults
                      <br />•{" "}
                      {Math.round(
                        (selectedColumns.length /
                          (activeFile?.columns?.length || 1)) *
                          100
                      )}
                      % field coverage
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add More Files</span>
                  </button>

                  <button
                    onClick={() => {
                      const errors = validateData(activeFile);
                      setValidationErrors(errors);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Validate Data</span>
                  </button>

                  <button
                    onClick={() => {
                      const transformedData = transformData(activeFile);
                      const dataStr =
                        "data:text/json;charset=utf-8," +
                        encodeURIComponent(
                          JSON.stringify(transformedData, null, 2)
                        );
                      const downloadAnchorNode = document.createElement("a");
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute(
                        "download",
                        `${activeFile.file.name.split(".")[0]}_processed.json`
                      );
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    disabled={selectedColumns.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      const config = {
                        fileName: activeFile.file.name,
                        mappings: selectedColumns.map((col) => ({
                          from: col.originalName,
                          to: col.mappedName,
                          type: col.dataType,
                          transformation: col.transformation,
                          required: col.isRequired,
                          nested: col.isNested,
                        })),
                      };
                      navigator.clipboard.writeText(
                        JSON.stringify(config, null, 2)
                      );
                      alert("Configuration copied to clipboard!");
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <FiCopy className="w-4 h-4" />
                    <span>Copy Config</span>
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={
                    selectedColumns.length === 0 ||
                    Object.keys(validationErrors).length > 0 ||
                    submitting
                  }
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  <FiCheck className="w-5 h-5" />
                  <span className="font-semibold">
                    Process Data ({selectedColumns.length} fields,{" "}
                    {activeFile?.data?.length || 0} rows)
                  </span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,.csv,.xlsx,.xls"
                onChange={() => {}}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
