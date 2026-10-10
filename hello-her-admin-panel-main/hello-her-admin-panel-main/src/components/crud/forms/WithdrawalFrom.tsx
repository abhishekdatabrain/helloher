"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { withdrawalsFormType } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import { populateFormData, populateFormFields } from "@/hooks/general";

interface WithdrawalFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled: string[] = [];
const removed: string[] = [];

// Utility to normalize boolean inputs
const evaluateBooleanInput = (value: any) => (value === "active" || value === true ? true : false);

const WithdrawalForm: React.FC<WithdrawalFormProps> = (props: any) => {
  const { data, formType } = props;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formField] = useState(
    populateFormFields(withdrawalsFormType, data, disabled, removed)
  );

  const [formData, setFormData] = useState<any>(
    populateFormData(withdrawalsFormType, data)
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      if (!updatedData?.status) return toast.warn("Status is required");

      // Normalize boolean fields if needed
      updatedData = {
        ...updatedData,
        isPaid: evaluateBooleanInput(updatedData?.isPaid),
      };

      setSubmitting(true);

      // Use same pattern as VirtualHrForm / TestimonialForm
      const url = `${endpoints[formType].url}${!data?._id ? "" : "/" + data._id}`;
      const response: any = data?._id ? await Put(url, updatedData) : await Post(url, updatedData);

      if (response.success) {
        toast.success("Withdrawal status updated successfully");

        // Refresh the list
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
        if (resp?.success) props?.setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination)
          props?.setPaginate(resp?.data?.pagination);

        props?.onClose?.();
      } else {
        toast.error(response.message || "Something went wrong!");
      }
    } catch (error: any) {
      console.error("Withdrawal update error:", error);
      toast.error(error?.message || "Failed to update withdrawal status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Withdrawal" : "Add New Withdrawal"}
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

export default WithdrawalForm;
