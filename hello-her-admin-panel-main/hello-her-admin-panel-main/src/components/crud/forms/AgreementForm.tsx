"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { agreementFormType } from "../formtype/general";
import { populateFormData, populateFormFields, evaluateBooleanInput } from "@/hooks/general";

const AgreementForm: React.FC<any> = (props) => {
    const { data, onClose, formType, setPaginate, setFilteredData } = props;
    const [submitting, setSubmitting] = useState(false);
    const [formField] = useState(
        data?._id ? populateFormFields(agreementFormType, data, [], []) : agreementFormType
    );
    const [formData, setFormData] = useState<any>(
        data?._id ? populateFormData(agreementFormType, data) : { isActive: "active" }
    );

    const makeApiCall = async (updatedData: any) => {
        try {
            const url = `${endpoints[formType].url}${data?._id ? "/" + data._id : ""}`;

            // Determine whether we received FormData (from DynamicForm) or plain object
            const isFormData = typeof updatedData?.get === "function";

            // extract title/pdf for validation
            let titleVal: string | null = null;
            let pdfVal: any = null;
            let isActiveVal: any = null;

            if (isFormData) {
                titleVal = (updatedData.get("title") as string) || null;
                pdfVal = updatedData.get("pdfUrl");
                isActiveVal = updatedData.get("isActive");
            } else {
                titleVal = updatedData?.title;
                pdfVal = updatedData?.pdfUrl;
                isActiveVal = updatedData?.isActive;
            }

            if (!titleVal?.trim() || !pdfVal) {
                return toast.warn("Title and PDF file are required");
            }

            setSubmitting(true);

            let response: any;
            if (isFormData) {
                // convert isActive from string to boolean before sending FormData
                updatedData.set("isActive", evaluateBooleanInput(isActiveVal) ? "true" : "false");
                response = data?._id ? await Put(url, updatedData) : await Post(url, updatedData);
            } else {
                // plain object path, normalize pdfVal like before
                let pdfUrlNormalized = pdfVal;
                if (Array.isArray(pdfUrlNormalized) && pdfUrlNormalized.length > 0) {
                    pdfUrlNormalized = pdfUrlNormalized[0].url || pdfUrlNormalized[0];
                } else if (
                    typeof pdfUrlNormalized === "object" &&
                    pdfUrlNormalized &&
                    (pdfUrlNormalized.url || pdfUrlNormalized.name)
                ) {
                    pdfUrlNormalized = pdfUrlNormalized.url || pdfUrlNormalized.name;
                }
                const payload = {
                    title: titleVal.trim(),
                    pdfUrl: pdfUrlNormalized,
                    isActive: evaluateBooleanInput(isActiveVal),
                };
                response = data?._id ? await Put(url, payload) : await Post(url, payload);
            }
            if (response?.success) {
                const resp: any = await Fetch(endpoints[formType].url, {}, 5000, false, false);
                if (resp?.success) {
                    setFilteredData(resp?.data?.result);
                    if (resp?.data?.pagination) setPaginate(resp?.data?.pagination);
                }
                // toast.success(`Agreement ${data?._id ? "updated" : "created"} successfully!`);
                onClose();
            } else toast.error("Something went wrong!");
        } catch (error: any) {
            toast.error(error?.message || "Failed to save agreement");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl pb-4 font-semibold text-gray-800">
                {data?._id ? "Edit Agreement" : "Create New Agreement"}
            </h2>
            {data?._id && data?.version && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    <strong>Version:</strong> {data.version} | <strong>Status:</strong>{" "}
                    <span className={data.isActive ? "text-green-600 font-semibold" : "text-gray-600"}>
                        {data.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            )}
            <DynamicForm
                id={data?._id}
                returnAs="formData"
                fields={formField}
                formData={formData}
                submitting={submitting}
                onClose={onClose}
                setFormData={setFormData}
                makeApiCall={makeApiCall}
            />
        </div>
    );
};

export default AgreementForm;
