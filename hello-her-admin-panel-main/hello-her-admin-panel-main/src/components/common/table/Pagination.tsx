import { useAuth } from "@/context/AuthContext";
import { debounce } from "@/hooks/general";
import { useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiMoreHorizontal,
  FiInfo,
} from "react-icons/fi";

interface Paginate {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface PaginationProps {
  paginate: Paginate;
  fetchFilteredData: (params: { page: number }) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  paginate,
  fetchFilteredData,
}) => {
  const { isDarkMode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInput, setPageInput] = useState(paginate.currentPage.toString());

  useEffect(() => {
    setPageInput(paginate.currentPage.toString());
  }, [paginate.currentPage]);

  const handlePageChange = async (page: number) => {
    if (
      page < 1 ||
      page > paginate.totalPages ||
      page === paginate.currentPage
    ) {
      return;
    }

    setIsLoading(true);
    await debounce(() => fetchFilteredData({ page }), 100)();
    setTimeout(() => setIsLoading(false), 300);
  };

  const handlePageInputSubmit = (e?: any) => {
    if (e) e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= paginate.totalPages) {
      handlePageChange(page);
      setShowPageInput(false);
    }
  };

  const generatePageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, paginate.currentPage - delta);
      i <= Math.min(paginate.totalPages - 1, paginate.currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (paginate.currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (paginate.currentPage + delta < paginate.totalPages - 1) {
      rangeWithDots.push("...", paginate.totalPages);
    } else if (paginate.totalPages > 1) {
      rangeWithDots.push(paginate.totalPages);
    }

    return rangeWithDots;
  };

  const startItem = (paginate.currentPage - 1) * paginate.itemsPerPage + 1;
  const endItem = Math.min(
    paginate.totalItems,
    paginate.itemsPerPage * paginate.currentPage
  );
  const progressPercent =
    ((paginate.currentPage - 1) / (paginate.totalPages - 1)) * 100;

  return (
    <div className="bg-whiteBg rounded-b-2xl overflow-hidden mt-3">
      {/* Progress Bar */}
      <div className="h-1 bg-green-100">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPercent || 0}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Info Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FiInfo className="iconBlack flex-shrink-0" size={16} />
            <div className="text-xs text-iconBlack">
              <span className="font-semibold">
                Showing {startItem.toLocaleString()} to{" "}
                {endItem.toLocaleString()}
              </span>
              <span className="mx-1">of</span>
              <span className="font-semibold">
                {paginate.totalItems.toLocaleString()}
              </span>
              <span className="ml-1">entries</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-iconBlack">
            <span>
              Page {paginate.currentPage} of {paginate.totalPages}
            </span>
            <div className="w-px h-4 bg-gray-300" />
            <button
              onClick={() => setShowPageInput(!showPageInput)}
              className="text-iconBlack hover:underline font-medium transition-colors duration-200"
            >
              Go to page
            </button>
          </div>
        </div>

        {/* Page Input */}
        {showPageInput && (
          <div className="p-3 bg-infobg rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-iconBlack whitespace-nowrap">
                Jump to page:
              </span>
              <input
                min="1"
                type="number"
                value={pageInput}
                max={paginate.totalPages}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePageInputSubmit(e)}
                className="w-14 px-2 py-1 text-xs border bg-infobg text-iconBlack border-iconBlack rounded-lg focus:outline-none focus:border-iconBlack"
                autoFocus
              />
              <button
                onClick={handlePageInputSubmit}
                className={`px-3 py-1 text-xs ${
                  isDarkMode ? "bg-iconBlack" : "bg-primary"
                }  text-white rounded-md transition-colors duration-200`}
              >
                Go
              </button>
              <button
                onClick={() => setShowPageInput(false)}
                className={`px-3 py-1 text-xs ${
                  isDarkMode ? "bg-iconBlack" : "bg-primary"
                }  text-white rounded-md transition-colors duration-200`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Previous Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={paginate.currentPage === 1 || isLoading}
              className="group flex items-center gap-1 border border-iconBlack text-sm text-iconBlack hover:bg-infobg hover:text-iconBlack rounded-md px-3 py-1.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-iconBlack"
              title="First page"
            >
              <FiChevronsLeft
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="hidden sm:inline">First</span>
            </button>

            <button
              onClick={() => handlePageChange(paginate.currentPage - 1)}
              disabled={paginate.currentPage === 1 || isLoading}
              className="group flex items-center gap-1 border border-iconBlack text-sm text-iconBlack hover:bg-infobg hover:text-iconBlack rounded-md px-3 py-1.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-iconBlack"
            >
              <FiChevronLeft
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              Previous
            </button>
          </div>

          {/* Page Numbers */}
          {paginate.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {generatePageNumbers().map((page, index) => (
                <div key={index}>
                  {page === "..." ? (
                    <p className="px-2 py-1 text-iconBlack">
                      <FiMoreHorizontal size={16} />
                    </p>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      disabled={isLoading}
                      className={`min-w-[32px] h-8 text-xs font-medium rounded-lg transition-all duration-200 ${
                        page === paginate.currentPage
                          ? isDarkMode
                            ? "bg-iconBlack text-white transform scale-105"
                            : "bg-primary text-white transform scale-105"
                          : isDarkMode
                          ? "text-iconBlack hover:bg-iconBlack hover:text-white"
                          : "text-iconBlack hover:bg-primary hover:text-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {page}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Next Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(paginate.currentPage + 1)}
              disabled={
                paginate.currentPage === paginate.totalPages || isLoading
              }
              className="group flex items-center gap-1 border border-iconBlack text-sm text-iconBlack hover:bg-infobg hover:text-iconBlack rounded-md px-3 py-1.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-iconBlack"
            >
              Next
              <FiChevronRight
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
            </button>

            <button
              onClick={() => handlePageChange(paginate.totalPages)}
              disabled={
                paginate.currentPage === paginate.totalPages || isLoading
              }
              className="group flex items-center gap-1 border border-iconBlack text-sm text-iconBlack hover:bg-infobg hover:text-iconBlack rounded-md px-3 py-1.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-iconBlack"
              title="Last page"
            >
              <span className="hidden sm:inline">Last</span>
              <FiChevronsRight
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-iconBlack">
            <div className="w-4 h-4 border-2 border-iconBlack border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
