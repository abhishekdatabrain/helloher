"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";
import Wrapper from "@/components/common/Wrapper";
import { getAccessPoints } from "@/hooks/general";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "ID", sortable: true },
  { key: "question", label: "Question", sortable: true },
  { key: "answer", label: "Answer", sortable: false },
  { key: "categoryName", label: "Category", sortable: true },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    isMultiPurpose: true,
    multiPurposeProps: { type: "label" },
  },
  { key: "createdAt", label: "Date Created", sortable: true, isDateTime: true },
  { key: "updatedAt", label: "Last Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
  { label: "Question", value: "question" },
  { label: "Category", value: "categoryName" },
];

const Page: React.FC = () => {
  const formType = "FAQs";
  const { data, loading, error } = useFetch(formType);
  const updatedData = data?.data.result;
  const paginationData = data?.data.pagination;

  const { user } = useAuth();
  const operationsAllowed =
    endpoints[formType]?.operations || getAccessPoints(user, formType);

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
