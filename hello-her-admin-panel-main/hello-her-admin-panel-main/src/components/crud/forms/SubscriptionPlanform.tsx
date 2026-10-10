"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { subscriptionPlanForm } from "../formtype/general";
import { evaluateBooleanInput, getSelectFormattedData, populateFormData, populateFormFields } from "@/hooks/general";

interface SubscriptionPlanformProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const SubscriptionPlanform: React.FC<SubscriptionPlanformProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formField, setFormFields] = useState(
    data._id
      ? populateFormFields(subscriptionPlanForm, data)
      : subscriptionPlanForm
  );

  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(subscriptionPlanForm, data) : { trialDays: 14, priority: 1, isActive: "active" }
  );

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const url = "/api/feature";
        const params = { limit: 100, page: 1 };
        const response: any = await Fetch(url, params, 5000, true, false);
        if (response.success && response?.data?.result.length > 0) {
          const selectData = getSelectFormattedData(response?.data?.result);
          const updatedFormField = formField.map((obj: any) => {
            if (obj.name === "features") return { ...obj, options: selectData };
            return obj;
          });
          setFormFields(updatedFormField);
        }
      } catch (error) {
        console.log("Error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatures();
    // eslint-disable-next-line
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id
        }`;

      updatedData = {
        ...updatedData,
        isActive: evaluateBooleanInput(updatedData?.isActive),
        isRecommended: evaluateBooleanInput(updatedData?.isRecommended),
        isCustomPricing: evaluateBooleanInput(updatedData?.isCustomPricing)
      }
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
        {data?._id ? "Edit Subscription Plan Details" : "Add New Subscription Plan"}
      </h2>
      {!loading &&
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
      }
    </div>
  );
};

export default SubscriptionPlanform;
