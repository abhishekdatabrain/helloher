"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { bankFormType } from "../formtype/general";
import { populateFormData, populateFormFields } from "@/hooks/general";

interface BankFormProps {
    data?: any;
    onClose?: any;
    formType: any;
    setPaginate?: any;
    setFilteredData?: any;
}

const disabled: string[] = [];
const removed: string[] = [];

const BankForm: React.FC<BankFormProps> = (props: any) => {
    const data = props.data;
    const formType = props.formType;

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formField] = useState(
        data?._id
            ? populateFormFields(bankFormType, data, disabled, removed)
            : bankFormType
    );

    const [formData, setFormData] = useState<any>(
        data?._id
            ? populateFormData(bankFormType, data)
            : {}
    );

    useEffect(() => {
        setLoading(false);
    }, []);

    const makeApiCall = async (updatedData: any) => {
        try {
            // Convert isActive from string ('active'/'inactive') to boolean
            let isActiveValue = updatedData.isActive;
            if (typeof isActiveValue === "string") {
                if (isActiveValue.toLowerCase() === "active") isActiveValue = true;
                else if (isActiveValue.toLowerCase() === "inactive") isActiveValue = false;
            }
            const payload = {
                name: updatedData.name?.trim(),
                isActive: isActiveValue,
            };

            const url = `${endpoints[formType].url}${!data?._id ? "" : "/" + data._id
                }`;

            setSubmitting(true);

            const response: any = data?._id
                ? await Put(url, payload)
                : await Post(url, payload);

            if (response.success) {
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);

                if (resp?.success) props?.setFilteredData(resp?.data?.result);
                if (resp?.success && resp?.data?.pagination)
                    props?.setPaginate(resp?.data?.pagination);

                props.onClose?.();
            } else {
                toast.error("Something went wrong!");
            }
        } catch (error: any) {
            console.error("❌ Error:", error);
            toast.error(error?.message || "Failed to save bank");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Edit Bank" : "Create Bank"}
            </h2>

            {!loading && (
                <DynamicForm
                    id={data?._id}
                    returnAs="object"
                    fields={formField}
                    formData={formData}
                    submitting={submitting}
                    onClose={props?.onClose}
                    setFormData={setFormData}
                    makeApiCall={makeApiCall}
                />
            )}
        </div>
    );
};

export default BankForm;