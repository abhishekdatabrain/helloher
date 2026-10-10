"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    { key: "_id", label: "Coupon ID" },
    { key: "couponName", label: "Coupon Name" },
    { key: "code", label: "Code" },
    { key: "discountPercentage", label: "Discount Percentage" },
    { key: "maxDiscountAmount", label: "Max Discount Amount" },
    { key: "description", label: "Description", sortable: true },
    { key: "expiryDate", label: "Expiry Date", sortable: true, isDate: true },
    { key: "isActive", label: "Is Active", isMultiPurpose: true },

    { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
    { key: "updatedAt", label: "Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Coupon ID", value: "_id" },
    { label: "Description", value: "description" },
    // { label: "Amount", value: "amount" },
    // { label: "Duration", value: "timeDuration" },
];

const Page: React.FC = () => {
    const formType = "Coupon";
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
