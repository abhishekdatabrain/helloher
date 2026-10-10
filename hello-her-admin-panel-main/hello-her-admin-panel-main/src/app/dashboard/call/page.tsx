"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
    { key: "_id", label: "User ID" },
    { key: "callerInfo.name", label: "Caller Name", sortable: true },
    { key: "calleeInfo.name", label: "Callee Name", sortable: true },
    { key: "totalSeconds", label: "Total Time (in sec)", sortable: true },
    { key: "perMinutePricePaise", label: "Price Per Minute (in paise)", sortable: true },
    { key: "status", label: "Status", sortable: true, isMultiPurpose: true, multiPurposeProps: { type: "label" } },
    { key: "recordingUrl", label: "Recording URL", sortable: true, isAudio: true },
    { key: "createdAt", label: "Created At", sortable: true, isDateTime: true },
];

const filterOptions = [
    { label: "Callee Name", value: "calleeInfo.name" },
    { label: "Caller Name", value: "callerInfo.name" },
    { label: "Status", value: "status" },
];

const Page: React.FC = () => {
    const formType = "Call Logs";
    const { data, loading, error } = useFetch(endpoints[formType]?.url);
    const updatedData = data?.data?.result;
    const paginationData = data?.data?.pagination;
    let operationsAllowed = endpoints[formType]?.operations;
    operationsAllowed = { ...operationsAllowed, delete: false };

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
