"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Withdrawal ID" },
  { key: "providerName", label: "Name", sortable: true },
  { key: "providerEmail", label: "Email Address", sortable: true },
  { key: "providerPhone", label: "Phone Number", sortable: true },
  { key: "amount", label: "Amount (Rs)", sortable: true },
  {
    key: "status",
    sortable: true,
    label: "Payment Status",
  },
  {
    key: "isPaid",
    sortable: true,
    label: "Is Paid",
  },
  {
    key: "bankAccounts[0].bankName",
    sortable: true,
    label: "Bank Name",
  },
  {
    key: "bankAccounts[0].accountNumber",
    sortable: true,
    label: "Account Number",
  },
  {
    key: "bankAccounts[0].ifscCode",
    sortable: true,
    label: "IFSC Code",
  },
  {
    key: "bankAccounts[0].upiId",
    sortable: true,
    label: "UPI ID",
  },
  {
    key: "createdAt",
    label: "Registered On",
    sortable: true,
    isDateTime: true,
  },
  {
    key: "updatedAt",
    label: "Last Updated On",
    sortable: true,
    isDateTime: true,
  },
];

const filterOptions = [
  { label: "Withdrawal ID", value: "_id" },
  { label: "Name", value: "providerName" },
  { label: "Email", value: "providerEmail" },
  { label: "Phone", value: "providerPhone" },
  { label: "Status", value: "status" },
  { label: "Bank Name", value: "bankAccounts.bankName" },
];

const Page: React.FC = () => {
  const formType = "Approved Withdrawals";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = {
    ...operationsAllowed,
    delete: false,
    read: true,
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