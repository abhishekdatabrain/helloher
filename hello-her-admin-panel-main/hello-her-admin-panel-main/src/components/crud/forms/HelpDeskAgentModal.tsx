"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { agentType } from "../formtype/general";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { populateFormData, populateFormFields } from "@/hooks/general";

interface AgentFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const AgentForm: React.FC<AgentFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [submitting, setSubmitting] = useState(false);
  const formField = data._id
    ? populateFormFields(agentType, data)
    : agentType;

  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(agentType, data) : {}
  );

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id
        }`;

      setSubmitting(true);
      const response: any = data._id
        ? await Put("/api/support/update-agent/" + data._id, updatedData)
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
        {data?._id ? "Edit Agent Details" : "Add New Agent Category"}
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

export default AgentForm;
