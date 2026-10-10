"use client";

import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import { PropertyCityFormField } from "../formtype/general";
import {
  populateFormData,
  populateFormFields,
  getSelectFormattedData,
  flattenOneLevelPreserveKeys,
} from "@/hooks/general";

interface PropertyCityFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled = ["countryId", "stateId"]

const PropertyCityForm: React.FC<PropertyCityFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formField, setFormField] = useState<any[]>(
    data._id ? populateFormFields(PropertyCityFormField, data, disabled) : PropertyCityFormField
  );

  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(PropertyCityFormField, flattenOneLevelPreserveKeys(data)) : {}
  );

  // Fetch country and state dropdown options (especially for edit mode)
  useEffect(() => {
    const fetchInitialOptions = async () => {
      try {
        const cityUrl = "/api/location/city";
        const cityRes: any = await Fetch(cityUrl, { limit: 300000, page: 1 }, 5000, true, false);
        const cityOptions = getSelectFormattedData(cityRes?.data?.result || []);
        console.log(cityOptions)
        const updatedFields = formField.map((obj: any) =>
          obj.name === "cityId" ? { ...obj, options: cityOptions } : obj
        );
        setFormField(updatedFields);
      } catch (err) {
        console.log("Error initializing form: ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialOptions();
    // eslint-disable-next-line
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id}`;
      setSubmitting(true);

      const response: any = data._id
        ? await Put(url, updatedData)
        : await Post(url, updatedData);

      if (response.success) {
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);

        if (resp?.success) props?.setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination) {
          props?.setPaginate(resp?.data?.pagination);
        }

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
        {data?._id ? "Edit City Details" : "Add New City"}
      </h2>
      {!loading && (
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
      )}
    </div>
  );
};

export default PropertyCityForm;
