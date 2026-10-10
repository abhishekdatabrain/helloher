"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { bannerFormFields } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import { flattenOneLevelPreserveKeys, populateFormData, populateFormFields } from "@/hooks/general";

interface BannerFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const BannerForm: React.FC<BannerFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [submitting, setSubmitting] = useState(false);
  const formField =
    data._id
      ? populateFormFields(bannerFormFields, data)
      : bannerFormFields;

  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(bannerFormFields, flattenOneLevelPreserveKeys(data)) : {}
  );

  const normalizeBannerType = (value: any) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "home" || normalized === "recharge") return normalized;
    if (String(value).trim() === "Home") return "home";
    if (String(value).trim() === "Recharge") return "recharge";
    return normalized;
  };

  const makeApiCall = async (updatedData: any) => {
    try {
      const payload =
        updatedData instanceof FormData ? updatedData : { ...updatedData };

      if (payload instanceof FormData) {
        payload.set("type", normalizeBannerType(payload.get("type")));
      } else {
        payload.type = normalizeBannerType(payload.type);
      }

      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id
        }`;

      setSubmitting(true);
      const response: any = data._id
        ? await Put(url, payload, 20000)
        : await Post(url, payload, 20000);

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
        {data?._id ? "Edit Banner Details" : "Add New Banner"}
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

export default BannerForm;
