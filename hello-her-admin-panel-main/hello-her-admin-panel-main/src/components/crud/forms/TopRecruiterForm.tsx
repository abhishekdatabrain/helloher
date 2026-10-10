"use client";

import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { endpoints } from "@/data/endpoints";
import { FaCheckCircle } from "react-icons/fa";
import Button from "@/components/common/Button";
import { Fetch, Post, Put } from "@/hooks/apiUtils";

interface TopRecruiterFormProps {
  data?: any;
  formType: any;
  onClose?: () => void;
  setPaginate?: (data: any) => void;
  setFilteredData?: (data: any) => void;
}

const checkboxOptions = [
  "Posts job openings consistently and clearly",
  "Responds promptly to candidate applications",
  "Schedules interviews without unnecessary delays",
  "Shares complete job details with applicants",
  "Follows up with shortlisted candidates regularly",
  "Provides clear feedback to candidates post-interview",
  "Maintains professionalism during all interactions",
  "Verifies candidate documents before final selection",
  "Offers transparency in job roles and compensation",
  "Updates hiring status in a timely manner",
  "Responds to candidate queries across platforms",
  "Maintains candidate data securely and ethically",
  "Avoids ghosting or unexplained hiring pauses",
  "Ensures smooth onboarding for selected candidates",
  "Collaborates efficiently with hiring partners or platforms"
];

const TopRecruiterForm: React.FC<TopRecruiterFormProps> = ({
  data = {},
  formType,
  onClose,
  setPaginate,
  setFilteredData,
}) => {
  const [status, setStatus] = useState("approved");
  const [score, setScore] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (data?.behaviors && Array.isArray(data.behaviors)) {
      setSelectedOptions(data.behaviors);
    }
  }, [data]);

  const handleCheckboxChange = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const makeApiCall = async () => {
    if (!selectedOptions.length) return toast.warn("Please select at least one performance indicator.");
    if (score === "" || Number(score) < 1) return toast.warn("Please enter a valid score above 0.");
    try {
      setSubmitting(true);
      const url = `${endpoints[formType].url}${data._id ? `/${data._id}` : ""}`;
      const payload = {
        score,
        status,
        slug: "top_recruiter",
        behaviors: selectedOptions,
      };
      const response: any = data._id ? await Put(url, payload) : await Post(url, payload);
      if (response?.success) {
        const fetchUrl = `${endpoints[formType].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
        if (resp?.success) {
          setFilteredData?.(resp.data.result);
          setPaginate?.(resp.data.pagination);
        }
        onClose?.();
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {data?._id ? "Edit Fast Responder Criteria" : "Assign Fast Responder Criteria"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Status Selector */}
        <div className="flex flex-col">
          <label htmlFor="status" className="text-sm font-semibold text-gray-800 mb-1">
            Review Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 text-black rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          >
            <option value="pending">Pending – Awaiting Review</option>
            <option value="approved">Approved – Passed All Criteria</option>
            <option value="rejected">Rejected – Criteria Not Met</option>
          </select>
        </div>

        {/* Score Input */}
        <div className="flex flex-col">
          <label htmlFor="score" className="text-sm font-semibold text-gray-800 mb-1">
            Performance Score
          </label>
          <input
            id="score"
            type="number"
            value={score}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 0 && val <= 100) setScore(val);
              else if (e.target.value === "") setScore("");
            }}
            placeholder="e.g. 85"
            className="border border-gray-300 text-black rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min={0}
            max={100}
          />
          <p className="text-xs text-gray-500 mt-1">Enter a score between 0 and 100</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-2">
        {checkboxOptions.map((option) => (
          <label
            key={option}
            className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer transition-all ${selectedOptions.includes(option)
              ? "bg-blue-50 border-blue-500"
              : "hover:bg-gray-50"
              }`}
          >
            <input
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={() => handleCheckboxChange(option)}
              className="mt-1 accent-blue-600 w-4 h-4"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{option}</p>
              {selectedOptions.includes(option) && (
                <div className="flex items-center text-blue-600 text-xs mt-1">
                  <FaCheckCircle className="mr-1" /> Selected
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
      <div className="col-span-3 mt-5 flex justify-end gap-2">
        <Button
          type="submit"
          onClick={makeApiCall}
          isLoading={submitting}
          text={data?._id ? "Update" : "Submit"}
          classes="bg-blue-500 hover:!bg-blue-600 transition-colors duration-200 px-8 py-2 rounded-xl !border-none text-white font-semibold text-xs md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          text="Cancel"
          type="button"
          onClick={onClose}
          classes="bg-red-500 hover:!bg-red-600 transition-colors duration-200 px-8 py-2 rounded-xl !border-none text-white font-semibold text-xs md:text-base"
        />
      </div>
    </div>
  );
};

export default TopRecruiterForm;
