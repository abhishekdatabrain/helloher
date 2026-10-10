"use client";

import { useState } from "react";
import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";
import UserStatsModal from "@/components/crud/modals/UserStatsModal";

// Table columns
const columns = [
  { key: "_id", label: "User ID" },
  { key: "name", label: "Name", sortable: true },
  // { key: "email", label: "Email Address", sortable: true },
  { key: "phoneNumber", label: "Phone Number", sortable: true },
  { key: "gender", label: "Gender / Sex", sortable: true, isMultiPurpose: true, multiPurposeProps: { type: "label" } },
  {
    key: "status",
    label: "Account Status",
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
  },
  {
    key: "ageRange",
    sortable: true,
    label: "Age Range",
  },
  {
    key: "preferences.language",
    sortable: true,
    label: "Language",
  },
  {
    key: "isVerified",
    sortable: true,
    label: "Is Mobile Verified?",
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" }
  },
  {
    key: "isOnline",
    sortable: true,
    label: "Is User Online?",
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" }
  },
  {
    key: "isBlocked",
    sortable: true,
    label: "Blocked?",
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" }
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
  { label: "User ID", value: "_id" },
  // { label: "Email", value: "email" },
  { label: "Status", value: "status" },
  { label: "Full Name", value: "name" },
  { label: "Phone Number", value: "phoneNumber" },
];

const Page: React.FC = () => {
  const formType = "Users";
  const [selectedUserForStats, setSelectedUserForStats] = useState<{ id: string; name: string } | null>(null);
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = {
    ...operationsAllowed,
    delete: true,
    create: true,
    update: true,
  };

  const handleViewStats = (row: any) => {
    setSelectedUserForStats({ id: row._id, name: row.name });
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
        {selectedUserForStats && (
          <UserStatsModal
            userId={selectedUserForStats.id}
            userName={selectedUserForStats.name}
            onClose={() => setSelectedUserForStats(null)}
          />
        )}
      </Wrapper>
    </AuthGuard>
  );
};

export default Page;
