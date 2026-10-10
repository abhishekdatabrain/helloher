"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    { key: "_id", label: "Banner ID" },
    { key: "title", label: "Image", image: true, imageWithKey: "image" },
    // { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description", sortable: true },
    { key: "isActive", label: "Is Active", isMultiPurpose: true, multiPurposeProps: { type: "label" } },
    { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
    { key: "updatedAt", label: "Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Banner ID", value: "_id" },
    { label: "Title", value: "title" },
    { label: "Description", value: "description" },
    { label: "Is Active", value: "isActive" },
];

const Page: React.FC = () => {
    const formType = "Banner";
    const { data, loading, error } = useFetch(endpoints[formType]?.url);
    const updatedData = data?.data?.result;
    const paginationData = data?.data?.pagination;
    let operationsAllowed = endpoints[formType]?.operations;
    operationsAllowed = { ...operationsAllowed, delete: true };

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
