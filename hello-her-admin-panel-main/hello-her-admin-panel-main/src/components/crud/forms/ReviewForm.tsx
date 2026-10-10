"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { endpoints } from "@/data/endpoints";
import { Fetch, Post } from "@/hooks/apiUtils";

interface ReviewFormProps {
  data?: any;
  onClose?: any;
  formType: any;
  setPaginate?: any;
  setFilteredData?: any;
}

const ReviewForm: React.FC<ReviewFormProps> = (props: any) => {
  const formType = props.formType;

  const [providers, setProviders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [provRes, userRes]: [any, any] = await Promise.all([
          Fetch("api/provider", { limit: 10, page: 1 }, 5000, true, false),
          Fetch("api/user/all", { limit: 10, page: 1 }, 5000, true, false),
        ]);

        if (provRes?.success) {
          setProviders(provRes?.data?.result || provRes?.data || []);
        }
        if (userRes?.success) {
          setUsers(userRes?.data?.result || userRes?.data || []);
        }
      } catch (err) {
        console.error("Error fetching providers/users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProvider) {
      return toast.warn("Please select a Listener / Provider");
    }
    if (!selectedUser) {
      return toast.warn("Please select a User");
    }
    if (!rating || rating < 1 || rating > 5) {
      return toast.warn("Rating must be between 1 and 5");
    }

    try {
      setSubmitting(true);
      const payload = {
        provider: selectedProvider,
        user: selectedUser,
        rating: Number(rating),
        review: reviewText.trim(),
      };

      const url = endpoints[formType]?.url || "api/rating";
      const response: any = await Post(url, payload);

      if (response?.success || response?.status === 201 || response?._id) {
        toast.success("Review added successfully!");

        // Refetch table data
        const resp: any = await Fetch(url, {}, 5000, true, false);
        if (resp?.success) {
          props?.setFilteredData(resp?.data?.result || []);
          if (resp?.data?.pagination) {
            props?.setPaginate(resp?.data?.pagination);
          }
        }
        props.onClose?.();
      } else {
        toast.error(response?.message || "Failed to add review");
      }
    } catch (error: any) {
      console.error("Error adding review:", error);
      toast.error(error?.message || "Failed to add review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading form data...</div>;
  }

  return (
    <div className="p-2">
      <h2 className="text-xl pb-4 font-semibold text-gray-800 border-b mb-4">
        Add Review for Listener
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Listener / Provider <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            required
          >
            <option value="">-- Select Listener --</option>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>
                {p.alias || p.name} ({p.phoneNumber || p._id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select User <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            required
          >
            <option value="">-- Select User --</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name || "User"} ({u.phoneNumber || u._id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Star Rating (1 - 5) <span className="text-red-500">*</span>
          </label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            required
          >
            <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
            <option value={3}>⭐⭐⭐ (3 Stars)</option>
            <option value={2}>⭐⭐ (2 Stars)</option>
            <option value={1}>⭐ (1 Star)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Review / Feedback Text (100–200 words)
          </label>
          <textarea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write user review here..."
            className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Add Review"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
