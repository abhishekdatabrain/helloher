"use client";

import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post, Put } from "@/hooks/apiUtils";
import DynamicForm from "@/components/common/DynamicForm";
import {
  populateFormData,
  populateFormFields,
  flattenOneLevelPreserveKeys,
} from "@/hooks/general";
import { rechargePlanFormType } from "../formtype/general";
// ✅ Use the shared FormField type so it matches what DynamicForm / hooks expect
import type { FormField } from "@/hooks/types";

interface RechargePlanFormProps {
  data?: any;
  onClose?: () => void;
  formType: keyof typeof endpoints;
  setPaginate?: (p: any) => void;
  setFilteredData?: (rows: any[]) => void;
}

const RechargePlanForm: React.FC<RechargePlanFormProps> = (props) => {
  const data = props.data ?? {};
  const formType = props.formType;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Ensure the state is typed with the *shared* FormField[]
  const [formField, setFormField] = useState<FormField[]>(
    data._id
      ? (populateFormFields(
          rechargePlanFormType as unknown as FormField[],
          data
        ) as FormField[])
      : (rechargePlanFormType as unknown as FormField[])
  );

  // ✅ Normalize couponId for edit mode using props.data directly in useMemo
  const initialCouponId: string | null = useMemo(() => {
    const coupon = props.data?.couponId;
    if (!coupon) return null;

    if (typeof coupon === "object" && coupon !== null) {
      return coupon._id ?? null;
    }

    return (coupon as string) ?? null;
  }, [props.data]);

  const [formData, setFormData] = useState<any>(
    data._id
      ? {
          ...populateFormData(
            rechargePlanFormType as unknown as FormField[],
            flattenOneLevelPreserveKeys(data)
          ),
          // Make sure the select field (coupon dropdown) holds the coupon _id
          select: initialCouponId || null,
        }
      : {}
  );

  // Fetch coupons and inject into the select field named "select"
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const url = "/api/coupon";
        const params = {}; // { limit: 5000, page: 1, isActive: true };
        const response: any = await Fetch(url, params, 5000, true, false);

        if (response?.success && Array.isArray(response?.data?.result)) {
          const now = new Date();

          const optionsFromApi = response.data.result
            .filter((c: any) => {
              // only active & not expired
              const rawExpiry = c?.expiryDate?.$date ?? c?.expiryDate;
              const notExpired = rawExpiry ? new Date(rawExpiry) >= now : true;
              return c.isActive === true && notExpired;
            })
            .map((c: any) => ({
              label: String(c._id),
              value: `${c.code} — ${c.discountPercentage ?? 0}% (Max Discount ₹${
                c.maxDiscountAmount ?? "∞"
              })`,
            }));

          // Optional: allow clearing coupon
          const options = [...optionsFromApi];

          const updatedFormField: FormField[] = (formField as FormField[]).map(
            (obj: FormField) => {
              if (obj.name === "select") {
                return { ...obj, options } as FormField;
              }
              return obj;
            }
          );

          setFormField(updatedFormField);
        }
      } catch (error) {
        console.log("Error fetching coupons: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeApiCall = async (updatedData: any) => {
    try {
      const url = `${endpoints[formType].url}${
        !data._id ? "" : "/" + data._id
      }`;

      // normalize payload
      const couponId =
        updatedData?.select === "" ? null : updatedData?.select ?? null;

      const payload: any = {
        ...updatedData,
        amount:
          updatedData?.amount !== undefined && updatedData?.amount !== null
            ? Number(updatedData.amount)
            : undefined,
        timeDuration:
          updatedData?.timeDuration !== undefined &&
          updatedData?.timeDuration !== null
            ? Number(updatedData.timeDuration)
            : undefined,
        couponId, // backend expects ObjectId or null
      };

      setSubmitting(true);

      const response: any = data._id
        ? await Put(url, payload)
        : await Post(url, payload);

      if (response?.success) {
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);

        if (resp?.success) props?.setFilteredData?.(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination)
          props?.setPaginate?.(resp?.data?.pagination);

        props.onClose?.();
      } else {
        toast.error(response?.message || "Something went wrong!");
      }
    } catch (error: any) {
      console.log("Error: ", error);
      toast.error(error?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4 font-semibold text-gray-800">
        {data?._id ? "Edit Recharge Plan" : "Add New Recharge Plan"}
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

export default RechargePlanForm;
