"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { helpdeskUpdateFields } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import { flattenOneLevelPreserveKeys, populateFormData, populateFormFields } from "@/hooks/general";

interface HelpdeskFormProps {
    data?: any;
    onClose?: any;
    formType: any;
    setPaginate?: any;
    setFilteredData?: any;
    additionalParams?: Record<string, any>;
}

const HelpdeskForm: React.FC<HelpdeskFormProps> = (props: any) => {
    const data = props.data;
    const formType = props.formType;
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (data?._id) {
            const flattenedData = flattenOneLevelPreserveKeys(data);
            const populatedData = populateFormData(helpdeskUpdateFields, flattenedData);
            setFormData(populatedData);
        } else {
            setFormData({});
        }
    }, [data?._id, data]);

    const formField = data._id ? populateFormFields(helpdeskUpdateFields, data) : helpdeskUpdateFields;

    const makeApiCall = async (updatedData: any) => {
        try {
            const dataToSend = Object.keys(updatedData).length > 0 ? updatedData : formData;
            if (Object.keys(dataToSend).length === 0) {
                toast.error("Please fill in at least one field to update");
                return;
            }

            // Remove empty values
            const normalizedData: any = { ...dataToSend };
            Object.keys(normalizedData).forEach((key) => {
                if (normalizedData[key] === "" || normalizedData[key] === null || normalizedData[key] === undefined) {
                    delete normalizedData[key];
                }
            });

            const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;

            setSubmitting(true);
            const response: any = data._id
                ? await Put(url, normalizedData, 20000)
                : await Post(url, normalizedData, 20000);

            if (response?.success) {
                toast.success(response?.message || "Ticket updated successfully");
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(
                    fetchUrl,
                    { ...(props?.additionalParams ?? {}) },
                    5000,
                    true,
                    false
                );
                if (resp?.success) props?.setFilteredData(resp?.data?.result);
                if (resp?.success && resp?.data?.pagination) props?.setPaginate(resp?.data?.pagination);
                props.onClose?.();
            } else {
                toast.error(response?.message || "Something went wrong!");
            }
        } catch (error: any) {
            console.error("Error: ", error);
            toast.error(error?.message || "An error occurred while updating the ticket");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Update Ticket" : "Create Ticket"}
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

export default HelpdeskForm;
