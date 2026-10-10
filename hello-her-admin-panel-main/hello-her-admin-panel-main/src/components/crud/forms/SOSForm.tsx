"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { sosFormType } from "../formtype/general";
import { populateFormData, populateFormFields } from "@/hooks/general";

interface SosFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled: string[] = [];
const removed: string[] = [];

const SOSForm: React.FC<SosFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formField] = useState(
    data?._id
      ? populateFormFields(sosFormType, data, disabled, removed)
      : sosFormType
  );

  const [formData, setFormData] = useState<any>(
    data?._id
      ? populateFormData(sosFormType, data)
      : {}
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      // ✅ Validation
      if (!updatedData?.message || updatedData.message.trim() === "") {
        return toast.warn("SOS message is required");
      }

      const payload = {
        message: updatedData.message.trim(),
      };

      const url = `${endpoints[formType].url}${!data?._id ? "" : "/" + data._id}`;

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
        return toast.error("Something went wrong!");
      }

    } catch (error: any) {
      console.error("❌ Error:", error);
      toast.error(error?.message || "Failed to save SOS");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit SOS Message" : "Create SOS Message"}
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

export default SOSForm;