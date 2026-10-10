"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { queryFormFields } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import { flattenOneLevelPreserveKeys, populateFormData, populateFormFields } from "@/hooks/general";

interface QueryFormProps {
    data?: any;
    onClose?: any;
    formType: any;
    setPaginate?: any;
    setFilteredData?: any;
}

const QueryForm: React.FC<QueryFormProps> = (props: any) => {
    const data = props.data;
    const formType = props.formType;
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Initialize form fields and data on mount or when data changes
    useEffect(() => {
        if (data?._id) {
            console.log("Editing Query - Raw data:", data);
            const flattenedData = flattenOneLevelPreserveKeys(data);
            console.log("Flattened data:", flattenedData);
            const populatedData = populateFormData(queryFormFields, flattenedData);
            console.log("Populated form data:", populatedData);
            setFormData(populatedData);
        } else {
            setFormData({});
        }
    }, [data?._id, data]);

    const formField =
        data._id
            ? populateFormFields(queryFormFields, data)
            : queryFormFields;

    const makeApiCall = async (updatedData: any) => {
        try {
            console.log("=== FORM SUBMISSION START ===");
            console.log("Current formData state:", formData);
            console.log("updatedData parameter received:", updatedData);
            console.log("data._id:", data?._id);

            // If updatedData is empty, use formData state instead
            const dataToSend = Object.keys(updatedData).length > 0 ? updatedData : formData;
            console.log("Data to send after fallback:", dataToSend);

            if (Object.keys(dataToSend).length === 0) {
                toast.error("Please fill in at least one field to update");
                return;
            }

            const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;

            console.log("API URL:", url);

            // Transform capitalized values to lowercase for backend validation
            const normalizedData = { ...dataToSend };

            // Normalize role
            if (normalizedData.role === "User") normalizedData.role = "user";
            if (normalizedData.role === "Provider") normalizedData.role = "provider";

            // Normalize status - handle both "Under Review" and other multi-word values
            if (normalizedData.status) {
                normalizedData.status = normalizedData.status
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "_");  // Replace spaces with underscores
            }

            // Clean up empty strings and undefined values
            Object.keys(normalizedData).forEach(key => {
                if (normalizedData[key] === "" || normalizedData[key] === null) {
                    delete normalizedData[key];
                }
            });

            console.log("Final Normalized Data being sent:", normalizedData);

            setSubmitting(true);
            const response: any = data._id
                ? await Put(url, normalizedData, 20000)
                : await Post(url, normalizedData, 20000);

            console.log("Full API Response:", response);

            if (response?.success) {
                toast.success(response?.message || "Query updated successfully!");
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
                if (resp?.success) props?.setFilteredData(resp?.data?.result);
                if (resp?.success && resp?.data?.pagination)
                    props?.setPaginate(resp?.data?.pagination);
                props.onClose?.();
            } else {
                console.error("API Error Response:", response);
                const errorMsg = response?.message || response?.data?.message || "Failed to update query";
                toast.error(errorMsg);
            }
        } catch (error: any) {
            console.error("Exception Error:", error);
            console.error("Error Details:", {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data
            });
            toast.error(error?.message || "An error occurred while updating the query");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Edit Query Details" : "Add New Query"}
            </h2>
            <DynamicForm
                id={data._id}
                fields={formField}
                returnAs="formData"
                formData={formData}
                submitting={submitting}
                onClose={props?.onClose}
                setFormData={setFormData}
                makeApiCall={makeApiCall}
            />
        </div>
    );
};

export default QueryForm;
