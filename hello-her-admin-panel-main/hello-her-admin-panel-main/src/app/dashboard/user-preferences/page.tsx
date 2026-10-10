"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  {
    key: "_id",
    label: "Preference ID",
    sortable: true,
  },
  {
    key: "userData.name",
    label: "User Name",
  },
  {
    key: "userData.email",
    label: "User Email",
  },
  {
    key: "tags",
    label: "Tags",
    sortable: false,
  },
  {
    key: "preferredLocations",
    label: "Preferred Location(s)",
    sortable: false,
  },
  {
    key: "propertyTypes",
    label: "Property Types",
    sortable: false,
  },
  {
    key: "amenities",
    label: "Amenities",
    sortable: false,
  },
  {
    key: "roomTypes",
    label: "Room Types",
    sortable: false,
  },
  {
    key: "minBudget",
    label: "Min Budget",
    sortable: true,
  },
  {
    key: "maxBudget",
    label: "Max Budget",
    sortable: true,
  },
  {
    key: "preferredGuests",
    label: "Guests",
    sortable: true,
  },
  {
    key: "preferredRatings",
    label: "Ratings",
    sortable: true,
  },
  {
    key: "preferredSorting",
    label: "Sorting Preference",
    sortable: false,
  },
  {
    key: "createdAt",
    label: "Submitted On",
    isDateTime: true,
    sortable: true,
  },
];

const filterOptions = [
  { label: "Preference ID", value: "_id" },
  { label: "User ID", value: "userId" },
  { label: "Tags", value: "tags" },
  { label: "Preferred Location", value: "preferredLocations" },
  { label: "Property Type", value: "propertyTypes" },
  { label: "Amenities", value: "amenities" },
  { label: "Room Type", value: "roomTypes" },
  { label: "Min Budget", value: "minBudget" },
  { label: "Max Budget", value: "maxBudget" },
  { label: "Guests", value: "preferredGuests" },
  { label: "Ratings", value: "preferredRatings" },
  { label: "Sorting Preference", value: "preferredSorting" },
];

const Page: React.FC = () => {
  const formType = "User Preference";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, update: false, delete: false };

  if (loading && !updatedData && !error) return <Loader />;

  return (
    <AuthGuard>
      <Wrapper>
        <TableComponent
          type={formType}
          columns={columns}
          data={updatedData}
          filterOptions={filterOptions}
          pagination_data={paginationData}
          operationsAllowed={operationsAllowed}
        />
      </Wrapper>
    </AuthGuard>
  );
};

export default Page;
