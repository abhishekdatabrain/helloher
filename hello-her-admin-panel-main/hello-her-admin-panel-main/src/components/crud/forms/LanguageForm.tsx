"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { languageFormType } from "../formtype/general";
import { populateFormData, populateFormFields } from "@/hooks/general";

interface LanguageFormProps {
    data?: any;
    onClose?: any;
    formType: any;
    setPaginate?: any;
    setFilteredData?: any;
}

const disabled: string[] = [];
const removed: string[] = [];

const LanguageForm: React.FC<LanguageFormProps> = (props: any) => {
    const data = props.data;
    const formType = props.formType;

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formField] = useState(
        data?._id
            ? populateFormFields(languageFormType, data, disabled, removed)
            : languageFormType
    );

    const [formData, setFormData] = useState<any>(
        data?._id
            ? populateFormData(languageFormType, data)
            : {}
    );

    useEffect(() => {
        setLoading(false);
    }, []);

    const makeApiCall = async (updatedData: any) => {
        try {
            let isActiveValue = updatedData.isActive;
            if (typeof isActiveValue === "string") {
                if (isActiveValue.toLowerCase() === "active") isActiveValue = true;
                else if (isActiveValue.toLowerCase() === "inactive") isActiveValue = false;
            }
            const payload = {
                label: updatedData.label?.trim(),
                value: updatedData.value?.trim(),
                isActive: isActiveValue,
            };
            // const payload: { [key: string]: any } = {
            //     label: updatedData.label?.trim(),
            //     value: updatedData.value?.trim(),
            //     isActive: evaluateBooleanInput(updatedData.isActive),
            // };
            // // If updating, ensure all fields are sent
            // if (props.data?._id) {
            //     Object.keys(payload).forEach((key) => {
            //         if (payload[key] === undefined) {
            //             payload[key] = props.data[key];
            //         }
            //     });
            // }

            const url = `${endpoints[formType].url}${!data?._id ? "" : "/" + data._id}`;

            setSubmitting(true);

            const response: any = data?._id
                ? await Put(url, payload)
                : await Post(url, payload);

            if (response.success) {
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);

                if (resp?.success) props?.setFilteredData(resp?.result);
                if (resp?.pagination) props?.setPaginate(resp?.pagination);

                props.onClose?.();
            } else {
                return toast.error("Something went wrong!");
            }

        } catch (error: any) {
            console.error("❌ Error:", error);
            toast.error(error?.message || "Failed to save language");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Edit Language" : "Create Language"}
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

export default LanguageForm;