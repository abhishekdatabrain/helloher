"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    { key: "_id", label: "Agreement ID" },
    { key: "title", label: "Title", sortable: true },
    { key: "version", label: "Version", sortable: true },
    { key: "isActive", label: "Status", isMultiPurpose: true, multiPurposeProps: { type: "label" }, sortable: true},
    { key: "createdAt", label: "Created At", sortable: true, isDateTime: true },
    { key: "updatedAt", label: "Updated At", sortable: true, isDateTime: true },
];

const filterOptions = [
    // { label: "Agreement ID", value: "_id" },
    { label: "Title", value: "title" },
    // { label: "Version", value: "version" },
    // { label: "Status", value: "isActive" },
];

const Page: React.FC = () => {
    const formType = "Agreement";
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