"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "User ID" },
  { key: "username", label: "Full Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Assigned Role", sortable: true },
  {
    key: "status",
    label: "Account Status",
    sortable: true,
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
  },
  {
    key: "createdAt",
    label: "Date of Registration",
    sortable: true,
    isDateTime: true,
  },
  {
    key: "updatedAt",
    label: "Last Modified",
    sortable: true,
    isDateTime: true,
  },
];

const filterOptions = [
  { label: "Name", value: "username" },
  { label: "Email", value: "email" },
  { label: "Role", value: "role" },
  { label: "Status", value: "status" },
];

const Page: React.FC = () => {
  const formType = "Employee";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, delete: true };

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
