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
    label: "SOS ID",
    sortable: true,
  },
  {
    key: "message",
    label: "SOS Message",
    sortable: true,
  },
{
    key: "createdAt",
    label: "Created On",
    sortable: true,
    isDateTime: true,
  },
  {
    key: "updatedAt",
    label: "Updated On",
    sortable: true,
    isDateTime: true,
  },
];

const filterOptions = [
  { label: "Message", value: "message" },
];

const Page: React.FC = () => {
  const formType = "SOS";
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
