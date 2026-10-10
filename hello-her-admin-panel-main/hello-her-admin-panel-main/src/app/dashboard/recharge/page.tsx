"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

// const columns = [
//   { key: "_id", label: "Plan ID" },
//   { key: "rechargeName", label: "Name", sortable: true },
//   { key: "description", label: "Description", sortable: true },
//   { key: "couponId.couponName", label: "Coupon Name", sortable: true },
//   { key: "couponId.code", label: "Coupon Code", sortable: true },
//   { key: "discountApplied", label: "Coupon Discount", sortable: true },
//   { key: "finalAmount", label: "Final Amount (₹)", sortable: true },
//   { key: "amount", label: "Base Amount", sortable: true, render: (value: number) => `₹${value}`, },
//   { key: "keywords", label: "Keywords", sortable: true, render: (value: number) => `₹${value}`, },
//   {
//     key: "timeDuration",
//     label: "Duration (in Min.)",
//     sortable: true,
//     render: (value: number) => {
//       if (value < 60) return `${value} min`;
//       const hours = Math.floor(value / 60);
//       const mins = value % 60;
//       if (mins === 0) return `${hours}h`;
//       return `${hours}h ${mins}m`;
//     },
//   },
//   { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
//   { key: "updatedAt", label: "Updated On", sortable: true, isDateTime: true },
// ];

const columns = [
  { key: "_id", label: "Recharge Plan ID" },
  { key: "rechargeName", label: "Recharge Plan Name", sortable: true },
  { key: "couponId.couponName", label: "Applied Coupon Name", sortable: true },
  { key: "couponId.code", label: "Applied Coupon Code", sortable: true },
  { key: "discountApplied", label: "Discount Amount (₹)", sortable: true },
  { key: "finalAmount", label: "Payable Amount (₹)", sortable: true },
  { key: "amount", label: "Base Price (₹)", sortable: true, render: (value: number) => `₹${value}` },
  {
    key: "timeDuration",
    label: "Call Duration (Minutes)",
    sortable: true,
    render: (value: number) => {
      if (value < 60) return `${value} min`;
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    },
  },
  { key: "createdAt", label: "Created On", sortable: true, isDateTime: true },
  { key: "updatedAt", label: "Last Updated On", sortable: true, isDateTime: true },
];

const filterOptions = [
  { label: "Plan ID", value: "_id" },
  { label: "Description", value: "description" },
  // { label: "Amount", value: "amount" },
  // { label: "Duration", value: "timeDuration" },
];

const Page: React.FC = () => {
  const formType = "Recharge";
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
