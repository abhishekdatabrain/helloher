"use client";

import { toast } from "react-toastify";
import { FaUserCircle } from "react-icons/fa";
import { Fetch, Post } from "@/hooks/apiUtils";
import React, { useEffect, useState } from "react";
import {
  MdClose,
  MdCheckCircle,
  MdOutlineNotes,
  MdOutlineCancel,
  MdOutlinePersonSearch,
  MdOutlineChangeCircle,
} from "react-icons/md";
import { endpoints } from "@/data/endpoints";

interface ReassignModalProps {
  type: any;
  ticketId: string;
  setPaginate: any;
  onClose: () => void;
  setFilteredData: any;
}

const statusOptions = [
  { label: "Assigned", value: "Assigned" },
  { label: "Cancelled", value: "Cancelled" },
];

const ReassignModal: React.FC<ReassignModalProps> = ({
  type,
  onClose,
  ticketId,
  setPaginate,
  setFilteredData,
}) => {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Assigned");
  const [selectedUser, setSelectedUser] = useState("");
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const fetchAssignableUsers = async () => {
      try {
        const response: any = await Fetch("/api/virtualhr", { limit: 1000, page: 1 }, 5000, true, false);
        if (response.success && Array.isArray(response?.data?.result)) {
          const options = response?.data?.result.map((user: any) => ({
            label: `${user.name} (${user.email})`,
            value: user._id,
          }));
          setUserOptions(options);
        }
      } catch (err) {
        console.log("Error fetching users", err);
      }
    };
    fetchAssignableUsers();
  }, []);

  const handleSubmit = async () => {
    if (status === "CANCELLED" && !note.trim()) return toast.error("Please enter a cancellation reason.");
    if (status !== "CANCELLED" && !selectedUser) return toast.error("Please select a user and enter a note.");

    setLoading(true);
    try {
      const urls: any = {
        "Bulk Hiring": "/api/bulkhiring/",
        "Job Requirement": "/api/jobrequirement/",
        "Project Based": "/api/projectbasedhiring/",
        "Virtual HR Request": "/api/virtualhrrequest/",
        "Exclusive Services": "/api/unifiedservicerequest/",
      }
      const baseUrl = urls[type];
      const body = { note, status, assignedTo: selectedUser };
      const response: any = await Post(`${baseUrl}${ticketId}/assign`, body);
      if (response.success) {
        const fetchUrl = `${endpoints[type].url}`;
        const resp: any = await Fetch(fetchUrl, {}, 5000, true, false);
        if (resp?.success) setFilteredData(resp?.data?.result);
        if (resp?.success && resp?.data?.pagination) setPaginate(resp?.data?.pagination);
        onClose();
      } else return toast.error("Something went wrong!");
    } catch (error) {
      console.log("Reassignment failed:", error);
      toast.error("Failed to update ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <MdOutlinePersonSearch className="text-blue-600 text-xl" />
          Update Ticket Assignment
        </h2>
      </div>

      {/* Status Selector */}
      <div>
        <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
          <MdOutlineChangeCircle className="text-gray-500" /> Select Status <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full border rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional Note/Cancellation Box */}
      {status === "CANCELLED" &&
        <div>
          <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
            {status === "CANCELLED" ? <MdOutlineCancel className="text-red-500" /> : <MdOutlineNotes />}
            {status === "CANCELLED" ? "Cancellation Reason" : "Note"}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder={status === "CANCELLED" ? "Why is this ticket being cancelled?" : "Enter note for reassignment"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {status === "CANCELLED"
              ? "This reason will be saved with cancellation logs."
              : "This note will be part of reassignment record."}
          </p>
        </div>
      }

      {/* Only show reassign dropdown if not cancelled */}
      {status !== "CANCELLED" && (
        <div>
          <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
            <FaUserCircle className="text-gray-500" /> Reassign To <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select user</option>
            {userOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          <MdClose /> Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
        >
          <MdCheckCircle /> {loading ? "Please wait..." : "Update"}
        </button>
      </div>
    </div>
  );
};

export default ReassignModal;
