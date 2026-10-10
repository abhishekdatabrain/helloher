"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    { key: "_id", label: "Query ID" },
    // { key: "role", label: "User Role" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "message", label: "Message" },
    { key: "status", label: "Status", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
    { key: "adminResponse", label: "Admin Response" },
    { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
    { key: "updatedAt", label: "Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Query ID", value: "_id" },
    { label: "Name", value: "name" },
    { label: "Email", value: "email" },
    { label: "Phone", value: "phone" },
    // { label: "Role", value: "role" },
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
                    additionalParams={{ type: "query", role: "ServiceProvider" }}
                />
            </Wrapper>
        </AuthGuard>
    );
};

export default Page;
