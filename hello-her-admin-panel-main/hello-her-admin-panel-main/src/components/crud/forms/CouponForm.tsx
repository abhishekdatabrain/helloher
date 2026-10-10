"use client";
import {  useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import {
  deepUnflatten,
  flattenObject,
  populateFormData,
  populateFormFields,
} from "@/hooks/general";
import { couponFormFields } from "../formtype/general";

interface CouponFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const CouponForm: React.FC<CouponFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;

  const [submitting, setSubmitting] = useState(false);

  const [formField] = useState<any>(
    data._id ? populateFormFields(couponFormFields, data) : couponFormFields
  );

  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(couponFormFields, flattenObject(data)) : {}
  );

  
  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;
      let unflatten: any = deepUnflatten(updatedData);

      unflatten = {
        ...unflatten,
        isActive: unflatten.isActive === "active",
      };

      setSubmitting(true);

      const response: any = data._id ? await Put(url, unflatten) : await Post(url, unflatten);

      if (response.success) {
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
        if (resp?.success) props?.setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination) props?.setPaginate(resp?.data?.pagination);
        props.onClose?.();
      } else {
        return toast.error("Something went wrong!");
      }
    } catch (error) {
      console.log("Error: ", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Coupon Details" : "Add New Coupon"}
      </h2>
      <DynamicForm
        id={data._id}
        returnAs="object"
        fields={formField}     // {/* ← still an array of field configs */}
        formData={formData}
        submitting={submitting}
        onClose={props?.onClose}
        setFormData={setFormData}
        makeApiCall={makeApiCall}
      />
    </div>
  );
};

export default CouponForm;
