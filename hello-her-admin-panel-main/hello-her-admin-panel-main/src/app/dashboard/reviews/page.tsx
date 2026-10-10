"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Review ID" },
  { key: "user.name", label: "User Name" },
  { key: "user.phoneNumber", label: "User Phone" },
  { key: "provider.name", label: "Listener Name"},
  { key: "rating", label: "Star Rating", sortable: true },
  { key: "review", label: "User Review / Feedback"},
  { key: "createdAt", label: "Submitted On", sortable: true, isDateTime: true },
];

const filterOptions = [
  { label: "Rating", value: "rating" },
  { label: "Review Text", value: "review" },
];

const Page: React.FC = () => {
  const formType = "Review";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result ?? data?.result;
  const paginationData = data?.data?.pagination ?? data?.pagination;
  const operationsAllowed = endpoints[formType]?.operations || {
    read: true,
    create: true,
    update: false,
    delete: true,
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
