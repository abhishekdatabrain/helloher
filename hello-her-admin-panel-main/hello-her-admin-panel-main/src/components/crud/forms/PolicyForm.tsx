"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { policyFormType } from "../formtype/general";
import { populateFormData, populateFormFields, evaluateBooleanInput } from "@/hooks/general";

interface PolicyFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled: string[] = [];
const removed: string[] = [];

const PolicyForm: React.FC<PolicyFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formField] = useState(
    data?._id
      ? populateFormFields(policyFormType, data, disabled, removed)
      : policyFormType
  );

  const [formData, setFormData] = useState<any>(
    data?._id
      ? populateFormData(policyFormType, data)
      : { isActive: "active" }
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      if (!updatedData?.content || updatedData.content.trim() === "") {
        return toast.warn("Policy content is required");
      }

      const payload = {
        content: updatedData.content.trim(),
        isActive: evaluateBooleanInput(updatedData.isActive),
      };

      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;
      setSubmitting(true);

      const response: any = data._id
        ? await Put(url, payload)
        : await Post(url, payload);

      if (response.success) {
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
        if (resp?.success) props?.setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination)
          props?.setPaginate(resp?.data?.pagination);
        props.onClose?.();
      } else return toast.error("Something went wrong!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message || "Failed to save policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Privacy Policy" : "Create New Privacy Policy"}
      </h2>

      {!data?._id && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Creating a new policy will automatically increment the version number.
            If set as active, this will deactivate any previous active policy.
          </p>
        </div>
      )}

      {data?._id && data?.version && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-blue-800">
              <strong>Version:</strong> {data.version}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Status:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${data.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      )}

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

export default PolicyForm;
