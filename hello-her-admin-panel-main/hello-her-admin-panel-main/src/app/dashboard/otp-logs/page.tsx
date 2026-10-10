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
    label: "OTP ID",
    sortable: false,
  },
  {
    key: "phoneNumber",
    label: "Mobile Number",
    sortable: true,
  },
  {
    key: "otp",
    label: "OTP Code",
    sortable: false,
  },
  {
    key: "verified",
    label: "Verified",
    sortable: true,
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
  },
  {
    key: "createdAt",
    label: "Created At",
    isDateTime: true,
    sortable: true,
  },
  {
    key: "expiresAt",
    label: "Expires At",
    isDateTime: true,
    sortable: true,
  },
];

const filterOptions = [
  { label: "Mobile Number", value: "phoneNumber" },
];

const Page: React.FC = () => {
  const formType = "OTP";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, create: false, delete: false, update: false };

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
