"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { avatarFormFields } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import { flattenOneLevelPreserveKeys, populateFormData, populateFormFields } from "@/hooks/general";

interface AvatarFormProps {
    data?: any;
    onClose?: any;
    formType: any;
    setPaginate?: any;
    setFilteredData?: any;
}

const AvatarForm: React.FC<AvatarFormProps> = (props: any) => {
    const data = props.data || {};
    const formType = props.formType;
    const [submitting, setSubmitting] = useState(false);

    const formField =
        data._id
            ? populateFormFields(avatarFormFields, data)
            : avatarFormFields;

    const [formData, setFormData] = useState<any>(
        data._id ? populateFormData(avatarFormFields, flattenOneLevelPreserveKeys(data)) : {}
    );

    const makeApiCall = async (updatedData: any) => {
        try {
            // convert active/inactive strings to boolean for backend
            // support both plain objects and FormData
            const normalizeIsActive = (val: any) => {
                if (val === "active" || val === true) return true;
                if (val === "inactive" || val === false) return false;
                return val;
            };

            if (updatedData instanceof FormData) {
                const raw = updatedData.get("isActive");
                if (raw !== null) {
                    updatedData.set("isActive", String(normalizeIsActive(raw)));
                }
            } else {
                if (updatedData.hasOwnProperty("isActive")) {
                    updatedData.isActive = normalizeIsActive(updatedData.isActive);
                }
            }

            const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;

            setSubmitting(true);
            const response: any = data._id
                ? await Put(url, updatedData, 20000)
                : await Post(url, updatedData, 20000);

            if (response.success) {
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
                if (resp?.success) props?.setFilteredData(resp?.data?.result);
                if (resp?.success && resp?.data?.pagination)
                    props?.setPaginate(resp?.data?.pagination);
                props.onClose?.();
            } else return toast.error("Something went wrong!");
        } catch (error) {
            console.log("Error: ", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Edit Avatar" : "Add New Avatar"}
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

export default AvatarForm;
