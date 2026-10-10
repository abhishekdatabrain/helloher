"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import useFetch from "@/hooks/useFetch";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post } from "@/hooks/apiUtils";
import AuthGuard from "@/components/AuthGuard";
import Loader from "@/components/common/Loader";
import Wrapper from "@/components/common/Wrapper";
import TableComponent from "@/components/common/Table";

const columns = [
  { key: "_id", label: "Policy ID" },
  { key: "name", label: "Name", sortable: true },
  { key: "amount", label: "amount", sortable: true },
  { key: "durationDays", label: "Duration Days", sortable: true },
  { key: "description", label: "Description", sortable: true },
  {
    key: "createdAt",
    label: "Date",
    sortable: true,
    isDateTime: true,
  },
];

const filterOptions = [
  { label: "Policy ID", value: "_id" },
  { label: "Content", value: "content" },
  // { label: "Version", value: "version" },
];

const Page: React.FC = () => {
  const formType = "Profile Plan";
  const { data, loading, error } = useFetch(endpoints[formType]?.url);
  const [featureEnabled, setFeatureEnabled] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const updatedData = data?.data?.result;
  const paginationData = data?.data?.pagination;
  let operationsAllowed = endpoints[formType]?.operations;
  operationsAllowed = {
    ...operationsAllowed,
    delete: true,
    update: true,
    create: true,
  };

  // Fetch feature status on mount
  useEffect(() => {
    const fetchFeatureStatus = async () => {
      try {
        const response: any = await Fetch("/api/profile-plan/feature/status", {}, 5000, false, false);
        if (response?.success) {
          setFeatureEnabled(response?.data?.enabled ?? true);
        }
      } catch (error) {
        console.error("Error fetching feature status:", error);
      }
    };
    fetchFeatureStatus();
  }, []);

  const handleToggleFeature = async () => {
    try {
      setToggleLoading(true);
      const response: any = await Post(
        "/api/profile-plan/feature/toggle",
        { enabled: !featureEnabled },
        5000
      );

      if (response?.success) {
        setFeatureEnabled(!featureEnabled);
        // toast.success(
        //   `Paid profile feature ${!featureEnabled ? "enabled" : "disabled"}`
        // );
      } else {
        toast.error(response?.message || "Failed to toggle feature");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error toggling feature");
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading && !updatedData && !error) return <Loader />;

  return (
    <AuthGuard>
      <Wrapper>
        {/* Feature Toggle Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Paid Profile Feature</h3>
              <p className="text-sm text-gray-600 mt-1">
                {featureEnabled
                  ? "Feature is currently enabled. Users can purchase paid profiles."
                  : "Feature is currently disabled. Users cannot purchase paid profiles."}
              </p>
            </div>
            <button
              onClick={handleToggleFeature}
              disabled={toggleLoading}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${featureEnabled
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-500 hover:bg-gray-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {toggleLoading ? "Updating..." : featureEnabled ?  "Enable":"Disable" }
            </button>
          </div>
        </div>

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
