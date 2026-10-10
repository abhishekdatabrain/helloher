"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import {
  flattenOneLevelPreserveKeys,
  getSelectFormattedData,
  populateFormData,
  populateFormFields,
} from "@/hooks/general";
import { FormField } from "@/hooks/types";

interface UserFormProps {
  data?: any;
  onClose?: () => void;
  formType: keyof typeof endpoints;
  setPaginate?: (pagination: any) => void;
  setFilteredData?: (data: any) => void;
}

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const ageRangeOptions = [
  { label: "18 - 24", value: "18-24" },
  { label: "25 - 34", value: "25-34" },
  { label: "35 - 44", value: "35-44" },
  { label: "45 - 54", value: "45-54" },
  { label: "55+", value: "55+" },
];

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
};

const normalizeLanguageIds = (value: any, options: Array<{ value: string; label: string }> = []) => {
  return toArray(value)
    .map((lang: any) => {
      if (typeof lang === "object" && lang?._id) return String(lang._id);
      if (typeof lang === "string") {
        const found = options.find((opt) => opt.value === lang || opt.label === lang);
        return found ? String(found.value) : lang;
      }
      return lang ? String(lang) : "";
    })
    .filter(Boolean);
};

const buildFields = (languagesOptions: Array<{ label: string; value: string }> = []): FormField[] => [
  {
    type: "text",
    name: "name",
    label: "Full Name",
    placeholder: "Enter full name",
    required: true,
  },
  {
    type: "text",
    name: "phoneNumber",
    label: "Phone Number",
    placeholder: "Enter phone number",
    required: true,
  },
  {
    type: "email",
    name: "email",
    label: "Email",
    placeholder: "Enter email",
  },
  {
    type: "select",
    name: "gender",
    label: "Gender",
    placeholder: "Select gender",
    options: genderOptions,
  },
  {
    type: "date",
    name: "dateOfBirth",
    label: "Date of Birth",
    placeholder: "Select date of birth",
  },
  {
    type: "select",
    name: "ageRange",
    label: "Age Range",
    placeholder: "Select age range",
    options: ageRangeOptions,
  },
  {
    type: "textarea",
    name: "bio",
    label: "Bio",
    placeholder: "Enter bio",
    rows: 5,
  },
  {
    type: "select",
    name: "preferences.language",
    label: "Languages Known",
    placeholder: "Select languages",
    isMultiple: true,
    required: true,
    options: languagesOptions,
  },
  {
    type: "BlockToggle",
    name: "isBlocked",
    label: "Account Status",
  },
];

const EditUserForm: React.FC<UserFormProps> = ({
  data,
  formType,
  onClose,
  setPaginate,
  setFilteredData,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [languageOptions, setLanguageOptions] = useState<Array<{ label: string; value: string }>>([]);

  const normalizedData = useMemo(() => {
    const flat = data?._id ? flattenOneLevelPreserveKeys(data) : {};
    return {
      ...flat,
      isBlocked: data?._id ? Boolean(data?.isBlocked) : false,
      gender: flat?.gender || data?.gender || "other",
      ageRange: flat?.ageRange || data?.ageRange || "",
      "preferences.language": normalizeLanguageIds(
        flat?.["preferences.language"] ?? data?.preferences?.language ?? [],
        languageOptions,
      ),
    };
  }, [data, languageOptions]);

  const formFields = useMemo(() => {
    const fields = buildFields(languageOptions);
    return data?._id ? populateFormFields(fields, normalizedData) : fields;
  }, [data, languageOptions, normalizedData]);

  const [formData, setFormData] = useState<any>(
    data?._id
      ? populateFormData(buildFields(), normalizedData)
      : {
          gender: "other",
          isBlocked: false,
          "preferences.language": [],
        },
  );

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response: any = await Fetch(
          "/api/language/public",
          { pagination: false },
          5000,
          true,
          false,
        );

        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.result)
            ? response.data.result
            : [];

        const options = getSelectFormattedData(list).map((opt: any) => ({
          label: String(opt.label),
          value: String(opt.value),
        }));
        setLanguageOptions(options);
      } catch (error) {
        console.log("Error loading languages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, []);

  useEffect(() => {
    if (!data?._id) return;
    setFormData((prev: any) => ({
      ...prev,
      ...normalizedData,
      "preferences.language": normalizeLanguageIds(
        data?.preferences?.language ?? normalizedData?.["preferences.language"] ?? [],
        languageOptions,
      ),
    }));
  }, [data, languageOptions, normalizedData]);

  const makeApiCall = async (updatedData: any) => {
    try {
      setSubmitting(true);

      const payload = {
        ...updatedData,
        isBlocked: Boolean(updatedData.isBlocked),
      };

      if (payload["preferences.language"]) {
        payload.preferences = {
          ...(payload.preferences || {}),
          language: normalizeLanguageIds(payload["preferences.language"], languageOptions),
        };
        delete payload["preferences.language"];
      }

      const submitUrl = data?._id ? `/api/user/all/${data._id}` : "/api/user";
      const response: any = data?._id
        ? await Put(submitUrl, payload)
        : await Post(submitUrl, payload);

      if (response?.success) {
        const resp: any = await Fetch(
          endpoints[formType].url,
          {},
          5000,
          true,
          false,
        );

        if (resp?.success) setFilteredData?.(resp?.data?.result || []);
        if (resp?.success && resp?.data?.pagination) setPaginate?.(resp.data.pagination);

        onClose?.();
        toast.success(data?._id ? "User updated successfully" : "User created successfully");
      } else {
        toast.error(response?.message || "Something went wrong!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit User" : "Add New User"}
      </h2>
      {!loading && (
        <DynamicForm
          id={data?._id}
          returnAs="object"
          fields={formFields}
          formData={formData}
          submitting={submitting}
          onClose={onClose}
          setFormData={setFormData}
          makeApiCall={makeApiCall}
        />
      )}
    </div>
  );
};

export default EditUserForm;
