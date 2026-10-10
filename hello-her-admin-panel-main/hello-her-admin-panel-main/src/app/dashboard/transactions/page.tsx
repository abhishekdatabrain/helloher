"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Transaction ID" },
  { key: "entityInfo.name", label: "Name", sortable: true },
  { key: "entityInfo.email", label: "Email Address", sortable: true },
  { key: "entityInfo.phoneNumber", label: "Phone Number", sortable: true },
  { key: "amount", label: "Amount (Rs)", sortable: true },
  {key:"entityType", label: "Role", sortable: true},
  {
    key: "status",
    sortable: true,
    label: "Status",
  },
  {
    key: "type",
    sortable: true,
    label: "Transaction Type",
  },
  {
    key: "createdAt",
    label: "Date",
    sortable: true,
    isDateTime: true,
  },
  
];

const filterOptions = [
  { label: "Transaction ID", value: "_id" },
  { label: "Name", value: "entityInfo.name" },
  // { label: "Amount", value: "amount" },
  { label: "email", value: "entityInfo.email" },
  { label: "Phone Number", value: "entityInfo.phoneNumber" },
  { label: "Role", value: "entityType" },
  { label: "Status", value: "status" },
  { label: "Transaction Type", value: "type" },

];

const Page: React.FC = () => {
  const formType = "Transactions";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = {
    ...operationsAllowed,
    delete: false,
    update: false,
    create: false,
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
