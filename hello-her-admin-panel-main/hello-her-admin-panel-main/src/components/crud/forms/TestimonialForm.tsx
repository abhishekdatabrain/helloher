"use client";

import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { testimonialField } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import {
  makeFormData,
  populateFormData,
  populateFormFields,
  getSelectFormattedData,
  flattenOneLevelPreserveKeys,
} from "@/hooks/general";

interface TestimonialFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const TestimonialForm: React.FC<TestimonialFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formField, setFormField] = useState(
    data._id ? populateFormFields(testimonialField, data) : testimonialField
  );

  const [formData, setFormData] = useState<any>(
    data._id
      ? populateFormData(testimonialField, flattenOneLevelPreserveKeys(data))
      : {}
  );

  useEffect(() => {
    const fetchCategrory = async () => {
      try {
        const url = "/api/blogcategory";
        const params = { limit: 5000, page: 1, isActive: true };
        const response: any = await Fetch(url, params, 5000, true, false);
        if (response.success && response?.data?.result.length > 0) {
          const selectData = getSelectFormattedData(response?.data?.result);
          const updatedFormField = formField.map((obj: any) => {
            if (obj.name === "categoryId")
              return { ...obj, options: selectData };
            return obj;
          });
          setFormField(updatedFormField);
        }
      } catch (error) {
        console.log("Error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategrory();
    // eslint-disable-next-line
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${
        !data._id ? "" : "/" + data._id
      }`;

      setSubmitting(true);
      updatedData = {
        ...updatedData,
        isActive: updatedData?.isActive === "active",
      };
      updatedData = makeFormData(updatedData);
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
        {data?._id ? "Edit Testimonial Details" : "Add New Testimonial"}
      </h2>
      {!loading && (
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
      )}
    </div>
  );
};

export default TestimonialForm;
