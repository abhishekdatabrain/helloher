"use client";

import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { roomForm } from "../formtype/general";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import {
  flattenObject,
  populateFormData,
  populateFormFields,
  getSelectFormattedData,
} from "@/hooks/general";
import RoomFeaturesSelector from "@/components/common/RoomFeaturesSelector";

interface RoomFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled = ["name"];

const RoomForm: React.FC<RoomFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formField, setFormFields] = useState(
    data._id ? populateFormFields(roomForm, data, disabled) : roomForm
  );

  const [formData, setFormData] = useState<any>(
    data._id
      ? populateFormData(
        roomForm,
        flattenObject(data, "", [
          "amenities",
          "features",
        ])
      )
      : {}
  );

  useEffect(() => {
    const fetchMultipleOptions = async () => {
      setLoading(true);
      try {
        const fieldRequests = [
          {
            fieldName: "property",
            url: "/api/property",
            params: { limit: 10000, status: "active", page: 1 },
          },
        ];
        const responses: any = await Promise.all(
          fieldRequests.map(({ url, params }) =>
            Fetch(url, params, 5000, true, false)
          )
        );
        const updatedFormField = formField.map((field: any) => {
          const reqIndex = fieldRequests.findIndex(
            (req) => req.fieldName === field.name
          );
          const response = responses[reqIndex];

          if (
            reqIndex !== -1 &&
            response?.success &&
            response?.data?.result?.length > 0
          ) {
            const selectData = getSelectFormattedData(response.data.result);
            return { ...field, options: selectData };
          }
          return field;
        });
        setFormFields(updatedFormField);
      } catch (error) {
        console.error("Error fetching form options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMultipleOptions();
    // eslint-disable-next-line
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${!data._id ? "" : "/" + data._id
        }`;
      setSubmitting(true);
      updatedData = { ...updatedData, features: formData?.features, amenities: formData?.amenities };
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
    <>
      <RoomFeaturesSelector data={data} setFormData={setFormData} />
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
    </>
  );
};

export default RoomForm;
