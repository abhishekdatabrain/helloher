"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { commissionFormFields } from "../formtype/general";
import { populateFormData, populateFormFields } from "@/hooks/general";

interface CommissionFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled: string[] = [];
const removed: string[] = [];

const CommissionForm: React.FC<CommissionFormProps> = (props: any) => {
  const { data, formType, setPaginate, setFilteredData, onClose } = props;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Populate form fields and data
  const [formField] = useState(
    data?._id
      ? populateFormFields(commissionFormFields, data, disabled, removed)
      : commissionFormFields
  );

  const [formData, setFormData] = useState<any>(
    data?._id ? populateFormData(commissionFormFields, data) : {}
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      // basic validations
      if (!updatedData.minSeconds || !updatedData.maxSeconds) {
        return toast.warn("Please enter both min and max seconds.");
      }
      if (updatedData.minSeconds >= updatedData.maxSeconds) {
        return toast.warn("Max seconds must be greater than min seconds.");
      }

      const payload = {
        minSeconds: Number(updatedData.minSeconds),
        maxSeconds: Number(updatedData.maxSeconds),
        providerSharePaise: Number(updatedData.providerSharePaise),
        adminSharePaise: Number(updatedData.adminSharePaise),
      };

      const url = `${endpoints[formType].url}${!data?._id ? "" : "/" + data._id}`;
      setSubmitting(true);
console.log("URL:", url);
      const response: any = data?._id
        ? await Put(url, payload)
        : await Post(url, payload);

      if (response.success) {
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);

        if (resp?.success) {
          setFilteredData?.(resp?.data?.result);
          setPaginate?.(resp?.data?.pagination);
        }
        toast.success(
          data?._id
            ? "Commission slab updated successfully!"
            : "New commission slab added!"
        );
        onClose?.();
      } else {
        toast.error("Something went wrong while saving commission slab!");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message || "Failed to save commission slab");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Commission Slab" : "Add New Commission Slab"}
      </h2>

      {!loading && (
        <DynamicForm
          id={data?._id}
          returnAs="object"
          fields={formField}
          formData={formData}
          submitting={submitting}
          onClose={onClose}
          setFormData={setFormData}
          makeApiCall={makeApiCall}
        />
      )}
    </div>
  );
};

export default CommissionForm;
