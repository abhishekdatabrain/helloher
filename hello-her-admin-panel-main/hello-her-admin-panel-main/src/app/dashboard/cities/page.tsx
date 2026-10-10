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
    label: "City ID",
    sortable: true,
  },
  {
    key: "name",
    label: "City Name",
    sortable: true,
  },
  {
    key: "stateName",
    label: "State Name",
  },
  {
    key: "stateCode",
    label: "State Code",
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
    key: "isCapital",
    label: "Is Capital",
    sortable: true,
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
  },
];

const filterOptions = [
  { label: "City Name", value: "name" },
  { label: "State Name", value: "stateName" },
  { label: "State Code", value: "stateCode" },
];

const Page: React.FC = () => {
  const formType = "City";
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
