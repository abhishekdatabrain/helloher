import React from "react";
import ItemsPage from "./ItemsPage";
import DateFilter from "./DateFilter";
import SearchFilter from "./SearchFilter";
// import CustomDropdown from "./CustomDropdown";
import { FilterOption } from "@/hooks/types";

interface FiltersProps {
  endDate: string;
  startDate: string;
  handleSearch: any;
  searchTerm: string;
  hideDateFilter?: boolean;
  filterOptions: FilterOption[];
  paginate: { itemsPerPage: number };
  setEndDate: (value: string) => void;
  setStartDate: (value: string) => void;
  setSearchTerm: (value: string) => void;
  fetchFilteredData: (params?: Record<string, any>) => void;
}

const Filters: React.FC<FiltersProps> = ({
  endDate,
  paginate,
  searchTerm,
  startDate,
  setEndDate,
  setStartDate,
  setSearchTerm,
  handleSearch,
  filterOptions,
  hideDateFilter,
  fetchFilteredData,
}) => {
  return (
    <div className="flex flex-wrap gap-4 bg-whiteBg p-2 md:p-4 pt-2.5 rounded-2xl justify-between items-end mb-3">
      {/* Search Filter */}
      <SearchFilter
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        setSearchTerm={setSearchTerm}
        filterOptions={filterOptions}
      />

      {/* <CustomDropdown
        options={[]}
        label="Status"
        selectedValue={""}
        placeholder={"Select"}
        onChange={() => {}}
        // hideDropdown={true}
      /> */}

      {/* Pagination Filter */}
      <ItemsPage fetchFilteredData={fetchFilteredData} paginate={paginate} />

      {/* Date Range Filter */}
      {!hideDateFilter && (
        <DateFilter
          endDate={endDate}
          startDate={startDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          fetchFilteredData={fetchFilteredData}
        />
      )}
    </div>
  );
};

export default Filters;
