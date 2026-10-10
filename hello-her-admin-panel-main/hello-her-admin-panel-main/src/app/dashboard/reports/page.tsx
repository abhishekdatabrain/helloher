"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Report ID" },
  { key: "reporterId.name", label: "Reporter Name" },
  { key: "reporterId.email", label: "Reporter Email" },
  { key: "reportedUserId.name", label: "Reported User Name" },
  { key: "reportedUserId.email", label: "Reported User Email" },
  { key: "message", label: "Message" },
  { key: "adminRemark", label: "Admin's Remark" },
  { key: "status", label: "Status", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
  { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
  { key: "updatedAt", label: "Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Report ID", value: "_id" },
];

const Page: React.FC = () => {
    const formType = "Reports";
    const { data, loading, error } = useFetch(endpoints[formType]?.url);
    const updatedData = data?.data?.result;
    const paginationData = data?.data?.pagination;
    const operationsAllowed = { ...endpoints[formType]?.operations, create: false };

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
