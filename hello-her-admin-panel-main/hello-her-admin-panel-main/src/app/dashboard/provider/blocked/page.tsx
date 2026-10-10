"use client";

import { useState } from "react";
import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";
import ProviderStatsModal from "@/components/crud/modals/ProviderStatsModal";

const columns = [
  // { key: "_id", label: "User ID" },
  { key: "providerId", label: "Provider ID", sortable: true },
  { key: "name", label: "Full Name", sortable: true },
  { key: "phoneNumber", label: "Phone Number", sortable: true },
  { key: "age", label: "Age", sortable: true },
  { key: "bankAccount[0].bankName", label: "Bank Name", sortable: true },

  // { key: "commissionPercentage", label: "Commission Percentage", sortable: true },
  { key: "totalEarnings", label: "Total Earnings", sortable: true },
  {
    key: "isBlocked",
    sortable: true,
    isMultiPurpose: true,
    label: "Blocked?",
    multiPurposeProps: {
      type: "select",
      options: ["true", "false"],
    },
  },
  {
    key: "isActive",
    label: "Account Active",
    sortable: true,
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
  },
  { key: "kycStatus", label: "KYC Status", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
  { key: "isOnline", label: "Online Status", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
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
  { label: "Provider Id", value: "providerId" },
  { label: "Full Name", value: "name" },
  { label: "Phone Number", value: "phoneNumber" },
  { label: "Bank Name", value: "bankAccount.bankName" },
  // { label: "Age", value: "age" },
  // { label: "Status", value: "status" },
];

const Page: React.FC = () => {
  const formType = "ServiceProviders";
  const [selectedProviderForStats, setSelectedProviderForStats] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, delete: true };

  const handleViewStats = (row: any) => {
    setSelectedProviderForStats({
      id: row._id,
      name: row.name,
    });
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
          onViewStats={handleViewStats}
          additionalParams={{ isBlocked: true }}
        />
        {selectedProviderForStats && (
          <ProviderStatsModal
            providerId={selectedProviderForStats.id}
            providerName={selectedProviderForStats.name}
            onClose={() => setSelectedProviderForStats(null)}
          />
        )}
      </Wrapper>
    </AuthGuard>
  );
};

export default Page;
