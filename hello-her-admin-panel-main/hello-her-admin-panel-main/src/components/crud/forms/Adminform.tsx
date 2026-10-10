"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import { userFormType } from "../formtype/userFormType";
import DynamicForm from "@/components/common/DynamicForm";
import { getSelectFormattedData, populateFormData, populateFormFields } from "@/hooks/general";

interface DealerFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled = ["email", "password"];
const removed = ["password"];

const UserForm: React.FC<DealerFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initialAdminData = data?._id
    ? {
      ...data,
      role: data.roleId ?? data.role?._id ?? data.role,
    }
    : { role: "" };

  const [formField, setFormFields] = useState(data._id
    ? populateFormFields(userFormType, initialAdminData, disabled, removed)
    : userFormType);
  const [formData, setFormData] = useState<any>(
    data._id ? populateFormData(userFormType, initialAdminData) : { role: "" }
  );


  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const url = "/api/role";
        const params = { pagination: false };
        const response: any = await Fetch(url, params, 5000, true, false);
        if (response.success && response?.data?.result.length > 0) {
          const selectData = getSelectFormattedData(response?.data?.result);
          const updatedFormField = formField.map((obj: any) => {
            if (obj.name === "role") return { ...obj, options: selectData };
            return obj;
          });
          setFormFields(updatedFormField);

          if (!data?._id) {
            const adminRole = response?.data?.result.find(
              (role: any) => String(role?.name || "").toLowerCase() === "admin"
            );
            if (adminRole) {
              setFormData((prev: any) => ({
                ...prev,
                role: adminRole._id,
              }));
            }
          }
        }
      } catch (error) {
        console.log("Error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
    // eslint-disable-next-line
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      if (!data?._id && !updatedData?.password)
        return toast.warn("Please add password");
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
        {data?._id ? "Edit Employee Details" : "Add New Employee"}
      </h2>
      {!loading &&
        <DynamicForm
          id={data?._id}
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

export default UserForm;
