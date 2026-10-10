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
    label: "State ID",
    sortable: true,
  },
  {
    key: "name",
    label: "State Name",
    sortable: true,
  },
  {
    key: "code",
    label: "State Code",
    sortable: true,
  },
  {
    key: "countryName",
    label: "Country Name",
    sortable: true,
  },
  {
    key: "countryCode",
    label: "Country Code",
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
  { label: "Name", value: "name" },
  { label: "Code", value: "code" },
];

const Page: React.FC = () => {
  const formType = "State";
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
