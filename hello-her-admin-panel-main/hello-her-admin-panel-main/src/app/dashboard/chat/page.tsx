"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "User ID" },
  { key: "senderInfo.name", label: "Sender's Name", sortable: true },
  { key: "senderRole", label: "Sender's Role", sortable: true },
  { key: "receiverInfo.name", label: "Receiver's Name", sortable: true },
  { key: "text", label: "Message", sortable: true },
  { key: "isRead", label: "Message Read", sortable: true },
  // {
  //   key: "status",
  //   label: "Account Status",
  //   sortable: true,
  //   isMultiPurpose: true,
  //   multiPurposeProps: { type: "label" },
  // },
  {
    key: "createdAt",
    label: "Message Sent On",
    sortable: true,
    isDateTime: true,
  },
  // {
  //   key: "updatedAt",
  //   label: "Last Modified",
  //   sortable: true,
  //   isDateTime: true,
  // },
];

const filterOptions = [
  { label: "Sender's Name", value: "senderInfo.name" },
  { label: "Receiver's Name", value: "receiverInfo.name" },
  // { label: "Role", value: "senderRole" },
  // { label: "Status", value: "status" },
];

const Page: React.FC = () => {
  const formType = "Chat";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, delete: false };

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
