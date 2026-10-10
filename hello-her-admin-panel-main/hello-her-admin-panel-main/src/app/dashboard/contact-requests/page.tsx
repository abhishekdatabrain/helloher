"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "id", label: "Query ID" },
  { key: "name", label: "Full Name", sortable: true },
  { key: "email", label: "Email Address", sortable: true },
  { key: "phone", label: "Phone Number", sortable: true },
  { key: "subject", label: "Subject", sortable: true },
  { key: "message", label: "Message" },
  {
    key: "status",
    label: "Status",
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
    sortable: true,
  },
  { key: "createdAt", label: "Received On", isDate: true, sortable: true },
];

const filterOptions = [
  { label: "Code", value: "code" },
  { label: "Type", value: "type" },
  { label: "Target", value: "target" },
];

const Page: React.FC = () => {
  const formType = "Coupon";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  const operationsAllowed = endpoints[formType]?.operations;

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
