"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Role ID" },
  { key: "name", label: "Name", sortable: true },
  { key: "description", label: "Description", sortable: true, length: 75 },
  {
    key: "createdAt",
    label: "Created On",
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
  { label: "Role Name", value: "name" },
  { label: "Description", value: "description" },
];

const Page: React.FC = () => {
  const formType = "Role Management";
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
