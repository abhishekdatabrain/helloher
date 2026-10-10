"use client";

import { debounce } from "@/hooks/general";
import { FilterOption } from "@/hooks/types";
import { BsFilterLeft } from "react-icons/bs";
import React, { useEffect, useState, useMemo } from "react";

interface LightSearchFilterProps {
  searchKey?: string;
  searchTerm: string;
  filterOptions: FilterOption[];
  setSearchTerm: (value: string) => void;
  handleSearch: (term: string, key: string) => void;
}

const LightSearchFilter: React.FC<LightSearchFilterProps> = ({
  searchKey,
  searchTerm,
  handleSearch,
  setSearchTerm,
  filterOptions,
}) => {
  const [selectedOption, setSelectedOption] = useState(
    filterOptions?.[0]?.value ?? ""
  );

  useEffect(() => {
    if (searchKey) setSelectedOption(searchKey);
  }, [searchKey]);

  const debouncedSearch = useMemo(() => {
    return debounce((value: string, key: string) => {
      if (value.trim().length >= 2) {
        handleSearch(value.trim(), key);
      }
    }, 1000);
  }, [handleSearch]);

  // ✅ Trigger debounce only on change
  useEffect(() => {
    if (searchTerm === "") return;
    debouncedSearch(searchTerm, selectedOption);
  }, [searchTerm, selectedOption, debouncedSearch]);

  return (
    <div className="mb-5">
      <p className="flex text-black font-medium gap-2 text-sm items-center pb-1">
        <BsFilterLeft size={18} />
        <span className="italic">Search & Filter</span>
      </p>

      <div className="flex w-full items-stretch">
        {/* Filter Dropdown */}
        {filterOptions?.length > 0 && (
          <select
            className="rounded-l-lg border border-r-0 outline-none focus:outline-none bg-white text-sm text-black border-secondary p-2.5"
            value={selectedOption}
            onChange={(e) => {
              setSearchTerm(""); // Clear input when option changes
              setSelectedOption(e.target.value);
            }}
          >
            {filterOptions.map(
              (option) =>
                option.value && (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
            )}
          </select>
        )}

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          placeholder="Type to search..."
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            if (val.trim().length === 0) {
              // Clear case
              handleSearch("", selectedOption);
            }
          }}
          className={`${filterOptions?.length > 0
            ? "border border-l-0 rounded-lg rounded-l-none focus:ring-0"
            : "border rounded-lg focus:ring-2 focus:ring-primary/50"
            } px-3 text-sm bg-white text-black py-2 placeholder:text-black outline-none border-secondary w-full`}
        />

        {/* 🔕 Removed Search Button */}
      </div>
    </div>
  );
};

export default LightSearchFilter;
