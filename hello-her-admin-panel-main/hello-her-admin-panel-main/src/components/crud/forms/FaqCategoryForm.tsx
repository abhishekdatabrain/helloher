"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { faqCategoryFormFields } from "../formtype/general";
import {
  populateFormData,
  populateFormFields,
  flattenOneLevelPreserveKeys,
} from "@/hooks/general";

interface FaqCategoryFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const FaqCategoryForm: React.FC<FaqCategoryFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [submitting, setSubmitting] = useState(false);
  const formField = data._id
    ? populateFormFields(faqCategoryFormFields, data)
    : faqCategoryFormFields;

  const [formData, setFormData] = useState<any>(
    data._id
      ? populateFormData(faqCategoryFormFields, flattenOneLevelPreserveKeys(data))
      : {}
  );

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id
        }`;
      updatedData = {
        ...updatedData,
        isActive: updatedData?.isActive === "active",
      };
      setSubmitting(true);
      const response: any = data._id
        ? await Put(url, updatedData)
        : await Post(url, updatedData);

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
        {data?._id ? "Edit Faqs Category Details" : "Add New Faqs Category"}
      </h2>
      <DynamicForm
        id={data._id}
        fields={formField}
        returnAs="object"
        formData={formData}
        submitting={submitting}
        onClose={props?.onClose}
        setFormData={setFormData}
        makeApiCall={makeApiCall}
      />
    </div>
  );
};

export default FaqCategoryForm;
