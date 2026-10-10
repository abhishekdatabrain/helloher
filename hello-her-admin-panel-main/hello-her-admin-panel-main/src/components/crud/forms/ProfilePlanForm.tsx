"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { profilePlanFormFields } from "../formtype/general";
import {
    populateFormData,
    populateFormFields,
} from "@/hooks/general";
import type { FormField } from "@/hooks/types";

interface ProfilePlanFormProps {
    data?: any;
    onClose?: () => void;
    formType: keyof typeof endpoints;
    setPaginate?: (p: any) => void;
    setFilteredData?: (rows: any[]) => void;
}

const ProfilePlanForm: React.FC<ProfilePlanFormProps> = (props) => {
    const data = props.data ?? {};
    const formType = props.formType;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formField,] = useState<FormField[]>(
        data._id
            ? (populateFormFields(profilePlanFormFields as any, data) as FormField[])
            : (profilePlanFormFields as unknown as FormField[])
    );

    const [formData, setFormData] = useState<any>(
        data._id ? populateFormData(profilePlanFormFields as any, data) : {}
    );

    useEffect(() => {
        setLoading(false);
    }, []);

    const makeApiCall = async (updatedData: any) => {
        try {
            const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;

            const payload = {
                ...updatedData,
                amount: updatedData?.amount !== undefined ? Number(updatedData.amount) : undefined,
                durationDays:
                    updatedData?.durationDays !== undefined
                        ? Number(updatedData.durationDays)
                        : undefined,
            };

            setSubmitting(true);

            const response: any = data._id ? await Put(url, payload) : await Post(url, payload);

            if (response?.success) {
                const fetchUrl = `${endpoints[formType].url}`;
                const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
                if (resp?.success) props?.setFilteredData?.(resp?.data?.result);
                if (resp?.success && resp?.data?.pagination) props?.setPaginate?.(resp?.data?.pagination);
                props.onClose?.();
            } else {
                toast.error(response?.message || "Something went wrong!");
            }
        } catch (error: any) {
            console.log("Error: ", error);
            toast.error(error?.message || "Request failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Edit Profile Plan" : "Add New Profile Plan"}
            </h2>

            {!loading && (
                <DynamicForm
                    id={data._id}
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

export default ProfilePlanForm;
