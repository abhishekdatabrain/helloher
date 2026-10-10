"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    // { key: "_id", label: "ID" },
    // { key: "name", label: "Name", sortable: true },
    {
        image: true,
        key: "name",
        label: "Name",
        imageWithKey: "imageUrl",
    },
    { key: "gender", label: "Gender", sortable: true, isMultiPurpose: true, multiPurposeProps: { type: "label" } },

    // { key: "imageUrl", label: "Avatar", isImage: true },
    { key: "isActive", label: "Active", sortable: true, isMultiPurpose: true, multiPurposeProps: { type: "label" } },
    { key: "createdAt", label: "Created At", sortable: true, isDateTime: true },
    { key: "updatedAt", label: "Updated At", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Name", value: "name" },
    { label: "Gender", value: "gender" },
];

const Page: React.FC = () => {
    const formType = "Avatar";
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
