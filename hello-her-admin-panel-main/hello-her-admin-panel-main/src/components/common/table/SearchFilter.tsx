import React, { useEffect } from "react";
import { debounce } from "chart.js/helpers";
import { FilterOption } from "@/hooks/types";
import { BsFilterLeft } from "react-icons/bs";

interface SearchFilterProps {
  searchKey?: any;
  handleSearch: any;
  searchTerm: string;
  filterOptions: FilterOption[];
  setSearchTerm: (value: string) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchKey,
  searchTerm,
  handleSearch,
  setSearchTerm,
  filterOptions,
}) => {
  const [selectedOption, setSelectedOption] = React.useState(
    Array.isArray(filterOptions) && filterOptions.length > 0
      ? filterOptions[0]?.value
      : ""
  );

  useEffect(() => {
    if (searchKey) setSelectedOption(searchKey);
  }, [searchKey]);

  const handleSearchClick = () => {
    handleSearch(searchTerm, selectedOption);
  };

  return (
    <div>
      <p className="flex text-iconBlack font-medium gap-2 text-xs items-center pb-1">
        <BsFilterLeft size={20} /> Search
      </p>
      <div className="flex">
        {filterOptions && filterOptions?.length > 0 && (
          <select
            className="rounded-l-lg border border-r-0 outline-none focus:outline-none bg-whiteBg text-xs text-iconBlack border-secondary p-2"
            value={selectedOption}
            onChange={(e) => {
              setSearchTerm("");
              setSelectedOption(e.target.value);
            }}
          >
            {filterOptions.map((option) =>
              option.value ? (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ) : null
            )}
          </select>
        )}
        <input
          type="text"
          value={searchTerm}
          placeholder="Search here..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${
            filterOptions && filterOptions.length > 0
              ? "border border-l-0 rounded-lg rounded-l-none focus:ring-0"
              : "border rounded-lg focus:ring-2 focus:ring-primary/50"
          } px-3 text-xs bg-whiteBg text-iconBlack py-2 placeholder:text-iconBlack outline-none border-secondary w-full`}
        />
        <button
          type="button"
          className="px-3 ml-2 text-xs py-2 rounded-lg hover:scale-110 transition duration-200 bg-secondary text-white"
          onClick={debounce(handleSearchClick, 1000)}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchFilter;
