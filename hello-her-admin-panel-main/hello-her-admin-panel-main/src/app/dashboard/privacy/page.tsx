"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Policy ID" },
  { key: "version", label: "Version", sortable: true },
  { key: "content", label: "Content", sortable: true },
  { key: "isActive", label: "Is Active",isMultiPurpose: true, multiPurposeProps: { type: "label" }, sortable: true },
    {
    key: "createdAt",
    label: "Date",
    sortable: true,
    isDateTime: true,
  },
    
];

const filterOptions = [
  { label: "Policy ID", value: "_id" },
  { label: "Content", value: "content" },
  // { label: "Version", value: "version" },
];

const Page: React.FC = () => {
  const formType = "Policy";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = {
    ...operationsAllowed,
    delete: true,
    update: true,
    create: true,
  };

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
