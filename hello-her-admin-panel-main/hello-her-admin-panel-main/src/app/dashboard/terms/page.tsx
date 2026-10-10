"use client";

import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Term ID" },
  // { key: "version", label: "Version", sortable: true },
  {
    key: "version",
    label: "Version",
    sortable: true,
    render: (value: number) => `v${value}`,
  },

  // { key: "content", label: "Content", sortable: true },
  {
    key: "content",
    label: "Content",
    render: (value: string) => {
      // Strip HTML tags and show first 100 characters
      const plainText = value.replace(/<[^>]*>/g, '');
      return plainText.length > 100
        ? `${plainText.substring(0, 100)}...`
        : plainText;
    },
  },
  // { key: "isActive", label: "Is Active", sortable: true },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    isMultiPurpose: true, multiPurposeProps: { type: "label" },
  },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    isDateTime: true,
  },
  {
    key: "updatedAt",
    label: "Last Modified",
    sortable: true,
    isDateTime: true,
  },

];

const filterOptions = [
  // { label: "Status", value: "isActive" },
  // { label: "Version", value: "version" },
  {label:"Term ID", value:"_id"},
  { label: "Content", value: "content" },
];

const Page: React.FC = () => {
  const formType = "Terms"; // Make sure this matches your endpoints configuration
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = { ...operationsAllowed, delete: true };

  if (loading && !updatedData && !error) return <Loader />;

  return (
    <AuthGuard>
      <Wrapper>
        {/* <div className="mb-4 p-4 bg-background text-primary border border-blue-200 rounded-lg">
          <p className="text-sm text-primary">
            <strong>Terms & Conditions Management:</strong> Only one terms document can be active at a time.
            Creating a new active terms will automatically deactivate the previous one.
          </p>
        </div> */}

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


// const Page: React.FC = () => {
//   const formType = "Terms";
//   const { data, loading, error } = useFetch(endpoints[formType]?.url);
//   const updatedData = data?.data?.result;
//   const paginationData = data?.data?.pagination;
//   let operationsAllowed = endpoints[formType]?.operations;
//   operationsAllowed = {
//     ...operationsAllowed,
//     delete: true,
//     update: true,
//     create: true,
//   };

//   if (loading && !updatedData && !error) return <Loader />;

//   return (
//     <AuthGuard>
//       <Wrapper>
//         <TableComponent
//           type={formType}
//           columns={columns}
//           data={updatedData}
//           filterOptions={filterOptions}
//           pagination_data={paginationData}
//           operationsAllowed={operationsAllowed}
//         />
//       </Wrapper>
//     </AuthGuard>
//   );
// };

// export default Page;
