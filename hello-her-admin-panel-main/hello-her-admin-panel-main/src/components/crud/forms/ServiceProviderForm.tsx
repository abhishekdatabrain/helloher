"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch } from "@/hooks/apiUtils";
import { serviceProviderFormType } from "../formtype/providerFormType";
import DynamicForm from "@/components/common/DynamicForm";
import { populateFormData, populateFormFields } from "@/hooks/general";
import { buildApiUrl, normalizeBaseUrl } from "@/utils/apiUrl";
//import { serviceProviderInactiveFormType } from "../formtype/general";

interface ServiceProviderFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const disabled = ["phoneNumber"];
const removed = ["password"];

const BACKEND_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080"
);

const normalizeLanguageIds = (value: any, options: Array<{ value: string; label: string }> = []) => {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  return selected
    .map((lang: any) => {
      if (typeof lang === "object" && lang?._id) return String(lang._id);
      if (typeof lang === "string") {
        const found = options.find(
          (opt) => opt.value === lang || opt.label === lang,
        );
        return found ? String(found.value) : lang;
      }
      return lang ? String(lang) : "";
    })
    .filter(Boolean);
};

const ServiceProviderForm: React.FC<ServiceProviderFormProps> = (props: any) => {
  const data = props.data;
  const formType = props.formType;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formField, setFormField] = useState(
    data?._id
      ? populateFormFields(serviceProviderFormType, data, disabled, removed)
      : serviceProviderFormType
  );
  const [formData, setFormData] = useState<any>(
    data?._id ? populateFormData(serviceProviderFormType, data) : { role: "provider" }
  );

  useEffect(() => {
    const loadLanguageOptions = async () => {
      try {
        const response = await fetch(
          buildApiUrl(BACKEND_URL, "api/language/public?pagination=false")
        );
        if (!response.ok) {
          console.warn("Failed to fetch languages", response.status);
          return;
        }

        const json = await response.json();
        const languagesFromAPI =
          Array.isArray(json?.data) ? json.data :
            Array.isArray(json?.data?.result) ? json.data.result :
              Array.isArray(json?.result) ? json.result : [];

        const options = languagesFromAPI.map((lang: any) => ({
          label: lang.label || lang.value || lang.name || "",
          value: String(lang._id),
        }));

        setFormField((prev: any) =>
          prev.map((f: any) =>
            f.name === "languages" ? { ...f, options } : f
          )
        );

        if (data?._id && data.languages) {
          const normalizedIds = normalizeLanguageIds(data.languages, options);
          if (normalizedIds.length > 0) {
            setFormData((prev: any) => ({
              ...prev,
              languages: normalizedIds,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading language options", error);
      }
    };

    const loadBankOptions = async () => {
      try {
        const response = await fetch(
          buildApiUrl(BACKEND_URL, "api/bank?isActive=true&pagination=false")
        );
        if (!response.ok) {
          console.warn("Failed to fetch banks", response.status);
          return;
        }

        const json = await response.json();
        const bankList =
          Array.isArray(json?.data?.result)
            ? json.data.result
            : Array.isArray(json?.data)
              ? json.data
              : Array.isArray(json?.result)
                ? json.result
                : [];

        const ringOptions = bankList.map((bank: any) => ({
          label: bank.name,
          value: bank._id,
        }));

        setFormField((prev: any) =>
          prev.map((f: any) =>
            f.name === "bankAccount.bankName" ? { ...f, options: ringOptions } : f
          )
        );

        // If provider has existing bankAccount value, keep it (prefer_id if possible)
        if (data?._id && data?.bankAccount) {
          const bankAccount = Array.isArray(data.bankAccount)
            ? data.bankAccount[0]
            : data.bankAccount;

          if (bankAccount?.bankName) {
            let bankNameValue = bankAccount.bankName;

            // bankName may be object with _id optionally from populated result
            if (typeof bankNameValue === "object" && bankNameValue?._id) {
              bankNameValue = bankNameValue._id;
            }

            // if we have string name and options list, map to matching id
            if (typeof bankNameValue === "string") {
              const found = ringOptions.find(
                (opt: { value: string; label: string }) =>
                  opt.value === bankNameValue || opt.label === bankNameValue,
              );
              if (found) bankNameValue = found.value;
            }

            setFormData((prev: any) => ({
              ...prev,
              "bankAccount.bankName": bankNameValue,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading bank options", error);
      }
    };

    loadLanguageOptions();
    loadBankOptions();
  }, [data]);

  useEffect(() => {
    // If editing, populate bank account data
    if (data?._id && data?.bankAccount) {
      const bankAccount = Array.isArray(data.bankAccount)
        ? data.bankAccount[0]
        : data.bankAccount;

      if (bankAccount) {
        setFormData((prev: any) => ({
          ...prev,
          "bankAccount.bankName": bankAccount.bankName || "",
          "bankAccount.accountNumber": bankAccount.accountNumber || "",
          "bankAccount.ifscCode": bankAccount.ifscCode || "",
          "bankAccount.upiId": bankAccount.upiId || "",
          "bankAccount.panNumber": bankAccount.panNumber || "",
          // "bankAccount.aadharPhoto": bankAccount.aadharPhoto || "",
        }));
      }
    }
    setLoading(false);
  }, [data]);

  const makeApiCall = async (updatedData: any) => {
    try {
      console.log("Form Data Being Submitted:", updatedData);

      const languageField = formField.find((field: any) => field.name === "languages");
      const languageOptions = Array.isArray(languageField?.options) ? languageField.options : [];
      const normalizedLanguages = normalizeLanguageIds(updatedData?.languages, languageOptions);
      const normalizedUpdatedData = {
        ...updatedData,
        languages: normalizedLanguages,
      };

      // Validation for required fields on create
      if (!data?._id) {
        if (!normalizedUpdatedData?.phoneNumber) {
          return toast.warn("Phone number is required");
        }
        if (!normalizedUpdatedData?.password) {
          return toast.warn("Password is required");
        }
        if (!normalizedUpdatedData?.name) {
          return toast.warn("Name is required");
        }
        if (!normalizedUpdatedData?.age) {
          return toast.warn("Age is required");
        }
        if (!normalizedUpdatedData?.languages || normalizedUpdatedData?.languages.length === 0) {
          return toast.warn("At least one language is required");
        }
      }

      // Validate bank account fields if any are provided
      const hasBankFields =
        updatedData["bankAccount.bankName"] ||
        updatedData["bankAccount.accountNumber"] ||
        updatedData["bankAccount.ifscCode"] ||
        updatedData["bankAccount.upiId"] ||
        updatedData["bankAccount.panNumber"]
      // updatedData["aadharPhoto"];

      if (hasBankFields) {
        // Optional: Add bank account specific validations
        if (updatedData["bankAccount.ifscCode"] &&
          updatedData["bankAccount.ifscCode"].length !== 11) {
          return toast.warn("IFSC code must be 11 characters");
        }
        if (updatedData["bankAccount.panNumber"] &&
          updatedData["bankAccount.panNumber"].length !== 10) {
          return toast.warn("PAN number must be 10 characters");
        }
      }

      // Convert to FormData for file uploads
      const formDataToSend = new FormData();

      // Append all fields to FormData
      Object.keys(normalizedUpdatedData).forEach((key) => {
        let value = normalizedUpdatedData[key];

        // Skip confirmPassword - don't send to backend
        // if (key === "confirmPassword") {
        //   return;
        // }

        if (key === "isActive" || key === "isOnline" || key === "isBlocked" || key === "flagSuspicious") {
          if (value === "active" || value === true || value === "true") {
            value = true;
          } else if (value === "inactive" || value === false || value === "false") {
            value = false;
          }
        }

        // Handle file uploads (profilePicture, aadharPhoto)
        if (value instanceof File) {
          console.log(`Appending file: ${key}`, value.name);
          formDataToSend.append(key, value);
        }
        // Handle FileList
        else if (value instanceof FileList) {
          Array.from(value).forEach((file) => {
            console.log(`Appending file from FileList: ${key}`, file.name);
            formDataToSend.append(key, file);
          });
        }
        // Handle arrays
        else if (Array.isArray(value)) {
          // For file arrays
          if (value.length > 0 && value[0] instanceof File) {
            value.forEach((file) => {
              console.log(`Appending file from array: ${key}`, file.name);
              formDataToSend.append(key, file);
            });
          }
          // For languages array
          else if (key === "languages") {
            value.forEach((lang) => formDataToSend.append(key, String(lang)));
          }
          // For other arrays
          else {
            value.forEach((item) => formDataToSend.append(key, item));
          }
        }
        // Handle nested bank account fields
        else if (key.startsWith("bankAccount.")) {
          if (value) {
            console.log(`Appending bank field: ${key}`, value);
            formDataToSend.append(key, value);
          }
        }
        // Handle regular fields
        else if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(key, value.toString());
        }
      });

      // Log FormData contents for debugging
      console.log("=== FormData contents ===");
      for (const pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.log("=========================");

      const baseUrl = endpoints[formType]?.url || "/api/provider";
      const fullUrl = buildApiUrl(
        BACKEND_URL,
        `${baseUrl}${!data?._id ? "" : "/" + data._id}`
      );
      const method = data?._id ? "PUT" : "POST";

      console.log("=== API Request Info ===");
      console.log("backend url", BACKEND_URL);
      console.log("baseurl", baseUrl);
      console.log("Full URL:", fullUrl);
      console.log("Method:", method);
      console.log("========================");

      setSubmitting(true);

      const token = localStorage.getItem("adminToken");

      const response = await fetch(fullUrl, {
        method: method,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formDataToSend,
      });

      console.log("=== Response Info ===");
      console.log("Status:", response.status);
      console.log("====================");

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response is not JSON:", text.substring(0, 500));
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          data?._id
            ? "Service provider updated successfully"
            : "Service provider created successfully"
        );

        // Refresh the provider list
        const fetchUrl = `${endpoints[formType].url}`;
        console.log("loggin fetch url", fetchUrl);
        const resp: any = await Fetch(fetchUrl, {}, 15000, true, false);
        if (resp?.success) props?.setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination)
          props?.setPaginate(resp?.data?.pagination);
        props?.onClose?.();
      } else {
        toast.error(result.message || "Something went wrong!");
      }
    } catch (error: any) {
      console.error("=== Error Details ===");
      console.error("Error:", error?.message);
      console.error("====================");
      toast.error(error?.message || "Failed to save service provider");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Service Provider Details" : "Add New Service Provider"}
      </h2>
      {!loading && (
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
      )}
    </div>
  );
};

export default ServiceProviderForm;
