"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { propertyForm } from "../formtype/general";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import {
  deepUnflatten,
  flattenObject,
  getSelectFormattedData,
  populateFormData,
  populateFormFields,
} from "@/hooks/general";

interface PropertyFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled = ["name"];

const PropertyForm: React.FC<PropertyFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formField, setFormFields] = useState(
    data._id ? populateFormFields(propertyForm, data, disabled) : propertyForm
  );

  const [formData, setFormData] = useState<any>(
    data._id
      ? populateFormData(
          propertyForm,
          flattenObject(data, "", [
            "amenities",
            "features",
            "houseRules",
            "nearbyPlaces",
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
            fieldName: "owner",
            url: "/api/user/property",
            params: { limit: 1000, page: 1 },
          },
          {
            url: "/api/amenity",
            fieldName: "amenities",
            params: { limit: 10000, page: 1 },
          },
          {
            url: "/api/nearbyplaces",
            fieldName: "nearbyPlaces",
            params: { limit: 100000, page: 1 },
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
      const url = `${endpoints[formType].url}${
        !data._id ? "" : "/" + data._id
      }`;
      let unflatten: any = deepUnflatten(updatedData);
      unflatten = {
        ...unflatten,
        isVerified: unflatten.isVerified === "active",
        partiesAllowed: unflatten.partiesAllowed === "active",
        smokingAllowed: unflatten.smokingAllowed === "active",
        childrenAllowed: unflatten.childrenAllowed === "active",
      };
      setSubmitting(true);
      const response: any = data._id
        ? await Put(url, unflatten)
        : await Post(url, unflatten);

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
        {data?._id ? "Edit Property Details" : "Add New Property"}
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

export default PropertyForm;
