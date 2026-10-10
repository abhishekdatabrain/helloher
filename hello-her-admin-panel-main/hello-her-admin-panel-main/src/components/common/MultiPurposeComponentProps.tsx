import React from "react";

interface MultiPurposeComponentProps {
  _id: any;
  text: string;
  type: "label" | "button" | "select";
  onClick?: any; // Click handler for button
  options?: string[]; // Options for select dropdown
  onSelectChange?: any; // Handler for select change
}

const colorMapping: Record<string, string> = {
  // User Types
  Popular: "bg-blue-500",
  Custom: "bg-green-600",
  Contractor: "bg-purple-500",

  // Job Types
  Contract: "bg-purple-500",
  Full_time: "bg-green-600",
  Part_time: "bg-yellow-500",
  Freelance: "bg-blue-400",
  Temporary: "bg-orange-500",
  Volunteer: "bg-pink-500",
  Internship: "bg-indigo-500",
  Consulting: "bg-teal-500",

  // Work Modes
  Remote: "bg-blue-500",
  Hybrid: "bg-yellow-600",
  On_site: "bg-gray-600",
  Flexible: "bg-green-500",

  // Experience Levels
  Entry: "bg-green-400",
  Junior: "bg-blue-400",
  Mid: "bg-yellow-500",
  Senior: "bg-orange-500",
  Lead: "bg-purple-500",
  Principal: "bg-teal-500",
  Director: "bg-indigo-500",
  Executive: "bg-pink-500",
  VP: "bg-red-600",
  C_level: "bg-black",

  // Job Status
  Draft: "bg-gray-400",
  Paused: "bg-yellow-500",
  Upcoming: "bg-yellow-500",
  Filled: "bg-blue-500",
  Expired: "bg-red-500",
  Pending_approval: "bg-orange-500",

  Low: "bg-red-400",
  High: "bg-red-600",
  Medium: "bg-red-500",
  Pending_verification: "bg-yellow-500",
  Normal: "bg-green-400",
  Assigned: "bg-green-500",
  Critical: "bg-red-700",

  // Member Status
  Joined: "bg-green-500",
  Invited: "bg-blue-400",
  Removed: "bg-red-500",
  Blocked: "bg-red-700",

  // Join Source
  Invite: "bg-blue-500",
  Direct: "bg-green-400",

  // Statuses
  Open: "bg-blue-500",
  Closed: "bg-gray-600",
  On_hold: "bg-yellow-500",
  Resolved: "bg-green-600",
  In_progress: "bg-orange-500",
  "In progress": "bg-orange-500",
  Re_assigned: "bg-purple-500",

  // Boolean
  True: "bg-green-500",
  False: "bg-red-500",

  // Statuses
  New: "bg-blue-500",
  Pending: "bg-yellow-500",
  Ongoing: "bg-orange-500",
  Approved: "bg-green-600",
  Completed: "bg-green-500",
  Accepted: "bg-blue-600",
  Requested: "bg-blue-400",
  Rejected: "bg-red-600",
  Cancelled: "bg-red-500",
  Refunded: "bg-purple-500",

  // Payment Methods
  Cash: "bg-yellow-600",
  Online: "bg-green-500",
  Offline: "bg-gray-500",

  // Activity
  Active: "bg-green-500",
  Inactive: "bg-red-500",

  // User type or general
  Individual: "bg-blue-400",

  // ApplicationStatus
  Hired: "bg-green-600",
  Applied: "bg-blue-500",
  Offered: "bg-indigo-500",
  Interview: "bg-yellow-500",
  Withdrawn: "bg-gray-500",
  Shortlisted: "bg-purple-500",
  Under_review: "bg-orange-500",
  Offer_declined: "bg-red-500",
  Offer_accepted: "bg-green-500",

  // CommunityStatus
  Archived: "bg-gray-400",
  Suspended: "bg-red-700",

  // Access Types
  Free: "bg-green-400",
  Paid: "bg-yellow-600",
  Premium: "bg-purple-600",

  // Query/Issue Status (lowercase enum values)
  pending: "bg-yellow-500",
  under_review: "bg-orange-500",
  resolved: "bg-green-500",
  escalated: "bg-red-500",
  closed: "bg-gray-600",

  //KYC Status
  approve: "bg-green-500",
  reject: "bg-red-500",
  request_reverify: "bg-orange-500",

  male: "bg-blue-500",
  female: "bg-pink-500",

  //call status
  initiated: "bg-blue-400",          // Call started but not ringing yet
  ringing: "bg-indigo-500",          // Phone is ringing
  connected: "bg-green-500",         // Call answered and ongoing
  processing: "bg-yellow-500",       // Call processing / handling
  ended: "bg-gray-500",              // Call completed
  failed: "bg-red-500",              // Call failed
  missed: "bg-orange-500",           // Call not answered
  insufficient_balance: "bg-red-600", // Not enough balance for call
  debit_call_auto: "bg-purple-500",  // Auto-debit call
  earning_call_auto: "bg-teal-500",  // Auto-earning call
  
  // Fallback
  Default: "bg-gray-400",
};

function capitalize(str: any) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const MultiPurposeComponent: React.FC<MultiPurposeComponentProps> = ({
  _id,
  type,
  text,
  onClick,
  options = [],
  onSelectChange,
}) => {
  const commonStyles = `px-3 py-1.5 rounded-lg text-white capitalize flex items-center justify-center text-[11px] font-bold`;

  const selectValue = options.includes(text) ? text : "";
  switch (type) {
    case "label":
      return (
        <span
          className={`${commonStyles} ${colorMapping[text] || colorMapping[capitalize(text)] || colorMapping["Default"]
            }`}
        >
          {text.split("_").join(" ")}
        </span>
      );

    case "button":
      return (
        <button
          className={`${commonStyles} ${colorMapping[text] || colorMapping["Default"]
            } cursor-pointer hover:opacity-90`}
          onClick={() => onClick({ _id: _id })}
        >
          {text}
        </button>
      );

    case "select":
      return (
        <div className="relative w-full">
          <select
            value={selectValue}
            className={`${commonStyles} min-w-full appearance-none outline-none relative pr-8 ${colorMapping[text] || colorMapping[capitalize(text)] || colorMapping["Default"]
              } text-black`}
            onChange={(e) =>
              onSelectChange &&
              onSelectChange({ _id: _id, status: e.target.value })
            }
          >
            {/* <option value="" disabled>
              --Select--
            </option> */}
            {options.map((option, index) => (
              <option
                key={index}
                value={option}
                disabled={option === selectValue}
              >
                {option}
              </option>
            ))}
          </select>
          <span className="absolute inset-y-0 text-white right-4 flex items-center pointer-events-none">
            ▼
          </span>
        </div>
      );

    default:
      return null;
  }
};

export default MultiPurposeComponent;
