"use client";

import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { stateFormField } from "../formtype/general";
import DynamicForm from "@/components/common/DynamicForm";
import { flattenOneLevelPreserveKeys, getSelectFormattedData, populateFormData, populateFormFields } from "@/hooks/general";

interface StateFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled = ["countryId"];

const toSelectValue = (value: any) => {
  if (value && typeof value === "object") return value._id ?? value.value ?? value.id ?? "";
  return value ?? "";
};

const StateForm: React.FC<StateFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formField, setFormField] = useState(
    data._id
      ? populateFormFields(stateFormField, data, disabled)
      : stateFormField
  );

  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(stateFormField, flattenOneLevelPreserveKeys(data)) : {}
  );

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const url = "/api/location/country";
        const params = { limit: 300, page: 1 };
        const response: any = await Fetch(url, params, 5000, true, false);
        if (response.success && response?.data?.result.length > 0) {
          const selectData = getSelectFormattedData(response?.data?.result);
          const selectedCountryId = toSelectValue(
            flattenOneLevelPreserveKeys(data)?.countryId
          );
          const updatedFormField = formField.map((obj: any) => {
            if (obj.name === "countryId") return { ...obj, options: selectData };
            return obj;
          });
          setFormField(updatedFormField);

          if (data?._id) {
            setFormData((prev: any) => ({
              ...prev,
              countryId: selectedCountryId,
            }));
          }
        }
      } catch (error) {
        console.log("Error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
    // eslint-disable-next-line
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id
        }`;

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
        {data?._id ? "Edit State Details" : "Add New State"}
      </h2>
      {!loading &&
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
      }
    </div>
  );
};

export default StateForm;
