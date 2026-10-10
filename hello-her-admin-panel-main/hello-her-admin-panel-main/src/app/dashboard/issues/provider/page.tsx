"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    { key: "_id", label: "Issue ID" },
    // { key: "role", label: "User Role" },
    { key: "name", label: "Name" },
    // { key: "email", label: "Email" },
    { key: "phone", label: "Email/Mobile" },
    { key: "priority", label: "Priority", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
    { key: "issueCategory", label: "Category" },
    { key: "message", label: "Message" },
    { key: "adminResponse", label: "Admin Response" },
    { key: "status", label: "Status", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
    { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
    { key: "updatedAt", label: "Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Issue ID", value: "_id" },
    { label: "Name", value: "name" },
    { label: "Email", value: "email" },
    { label: "Category", value: "issueCategory" },
    { label: "Status", value: "status" },
];

const Page: React.FC = () => {
    const formType = "Helpdesk";
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
                    additionalParams={{ type: "issue", role: "ServiceProvider" }}
                />
            </Wrapper>
        </AuthGuard>
    );
};

export default Page;
