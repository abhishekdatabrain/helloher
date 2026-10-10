import { FormField } from "@/hooks/types";
import { includes } from "@/hooks/polyfills";

export const serviceProviderFormType: FormField[] = [
  {
    type: "text",
    name: "name",
    label: "Provider Name",
    placeholder: "Enter provider full name",
    required: true,
  },
  {
    type: "text",
    name: "alias",
    label: "Alias / Display Name",
    placeholder: "Enter alias name (optional)",
  },
  {
    type: "number",
    name: "age",
    label: "Age",
    placeholder: "Enter provider age",
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
    placeholder: "Enter email (optional)",
    validation: (value) =>
      !value || includes(value, "@") ? null : "Invalid email",
  },
  {
    type: "text",
    name: "password",
    label: "Password",
    placeholder: "Enter password (provided by admin)",
    required: true,
  },
  {
    type: "select",
    name: "languages",
    label: "Languages Known",
    placeholder: "Select known languages",
    required: true,
    isMultiple: true,
    options: [], // will be populated dynamically from /api/language/public
  },
  {
    type: "select",
    name: "warning",
    label: "Warning Level",
    placeholder: "Select Warning level",
    required: true,
    options: [
      { label: "Clear", value: "clear" },
      { label: "Level 1", value: "level1" },
      { label: "Level 2", value: "level2" },
      { label: "Level 3", value: "level3" },
      { label: "Ignored Calls", value: "ignored_calls" },
      { label: "Low Online Hours", value: "low_online_hours" }
      // old swapd value 
      // { label: "clear", value: "Clear" },
      // { label: "level1", value: "Level 1" },
      // { label: "level2", value: "Level 2" },
      // { label: "level3", value: "Level 3" },
      // { label: "ignored_calls", value: "Ignored Calls" },
      // { label: "low_online_hours", value: "Low Online Hours" },
    ],
  },
  // {
  //   type: "number",
  //   name: "perMinutePricePaise",
  //   label: "Per Minute Price (in paise)",
  //   placeholder: "Enter per minute call rate (e.g. 1000 = ₹10)",
  //   required: true,
  // },
  // {
  //   type: "number",
  //   name: "commissionPercentage",
  //   label: "Commission Percentage (%)",
  //   placeholder: "Enter Commission Percentage (default 10%)",
  //   required: true,
  // },
  {
    type: "number",
    name: "incentive",
    label: "Incentive",
    placeholder: "Enter Incentive (default 0)",
    // required: false,
  },
  {
    type: "textarea",
    name: "bio",
    rows: 7,
    label: "Bio / Description",
    placeholder: "Enter a short bio (max 500 characters)",
  },
  {
    type: "file",
    name: "profilePicture",
    label: "Profile Picture",
    placeholder: "Upload a profile image (JPG, PNG)",
    // required: true,
  },
  {
    type: "audio",
    name: "audioSample",
    label: "Audio Sample",
    placeholder: "Upload audio sample (MP3, WAV)",
    accept: "audio/*",
    // required: true,
  },
  // ========== Face Verification ==========
  // {
  //   type: "br",
  //   name: "face-verification",
  //   widthFull: true,
  //   label: "Face Verification",
  // },
  // {
  //   type: "file",
  //   name: "faceVerificationPicture",
  //   label: "Face Verification Picture",
  //   placeholder: "Upload face verification image (JPG, PNG)",
  // },
  // {
  //   type: "select",
  //   name: "faceVerificationStatus",
  //   label: "Face Verification Status",
  //   placeholder: "Select verification status",
  //   options: [
  //     { label: "Verified", value: "verified" },
  //     { label: "Pending", value: "pending" },
  //     { label: "Unverified", value: "unverified" },
  //     { label: "Reverify", value: "reverify" },
  //   ],
  //   value: "unverified",
  // },
  // {
  //   type: "select",
  //   name: "role",
  //   label: "Role",
  //   placeholder: "Select role",
  //   required: true,
  //   value: "provider",
  //   options: [{ label: "Provider", value: "provider" }],
  // },
  {
    type: "choose",
    name: "isActive",
    label: "Activate this provider?",
    required: false,
  },
  {
    type: "choose",
    name: "isOnline",
    label: "Mark as online?",
    required: false,
  },


  // ========== Bank Account Details ==========
  {
    type: "br",
    name: "bank-info",
    widthFull: true,
    label: "Bank Account Details",
  },
  {
    type: "select",
    name: "bankAccount.bankName",
    label: "Bank Name",
    placeholder: "Select bank (active only)",
    // required: true,
    options: [], // loaded dynamically from /api/bank?isActive=true
  },
  {
    type: "text",
    name: "bankAccount.accountNumber",
    label: "Account Number",
    placeholder: "Enter bank account number",
    // required: true,
  },
  {
    type: "text",
    name: "bankAccount.ifscCode",
    label: "IFSC Code",
    placeholder: "Enter IFSC code (e.g., HDFC0001234)",
    // required: true,
  },
  {
    type: "text",
    name: "bankAccount.upiId",
    label: "UPI ID",
    placeholder: "Enter UPI ID (e.g., user@paytm)",
    // required: false,
  },
  {
    type: "text",
    name: "bankAccount.panNumber",
    label: "PAN Number",
    placeholder: "Enter PAN number (e.g., ABCDE1234F)",
    // required: true,
  },
  {
    type: "file",
    name: "aadharPhoto",
    label: "Aadhar Card Photo",
    placeholder: "Upload Aadhar card photo (JPG, PNG)",
    // required: true,
  },
  {
    type: "select",
    name: "kycStatus",
    label: "KYC Status",
    placeholder: "Select KYC Status",
    required: true,
    options: [
      { label: "Approve", value: "approve" },
      { label: "Reject", value: "reject" },
      { label: "Request Re-verify", value: "request_reverify" },
      { label: "Pending", value: "pending" }
    ],
  },
  {
    type: "choose",
    name: "flagSuspicious",
    label: "Flag as Suspicious",
    required: false,
  },
  {
    type: "choose",
    name: "isBlocked",
    label: "Block Provider?",
    required: false,
  },
  {
    type: "text",
    name: "remark",
    label: "KYC Remark",
    placeholder: "Add any remarks or notes (max 500 characters)",
    // rows: 2,
    required: false
  },
  {
    type: "text",
    name: "blockRemark",
    label: "Block Remark",
    placeholder: "Add any remarks for blocking the user",
    // rows: 2,
    required: false
  },
];
