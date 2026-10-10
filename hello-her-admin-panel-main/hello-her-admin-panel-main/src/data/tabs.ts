import {
  FaBan,
  FaHome,
  FaTags,
  FaLock,
  FaList,
  FaPhone,
  FaImage,
  FaUsers,
  FaGavel,
  FaSmile,
  FaCircle,
  FaWallet,
  FaUserTie,
  FaComments,
  FaUsersCog,
  FaHandshake,
  FaShieldAlt,
  FaCalculator,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaFileContract,
  FaQuestionCircle,
  FaExclamationTriangle,
  FaStar,
} from "react-icons/fa";
import {
  MdOutlineMap,
  MdLocalOffer,
  MdAutorenew,
  MdSecurity,
  MdArticle,
  MdReceipt,
  MdPeople,
} from "react-icons/md";
import { RiCoupon3Fill } from "react-icons/ri";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { AiOutlineClockCircle } from "react-icons/ai";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

export const tabs = [
  {
    id: 1,
    icon: FaHome,
    label: "Executive Dashboard",
    href: "/dashboard",
    pageTitle: "Executive Dashboard — Property Operations",
    permission: "Dashboard",
    tabs: [],
  },

  // ==================== IDENTITY & ACCESS ====================
  {
    id: 2,
    icon: FaUsersCog,
    label: "Identity & Access",
    pageTitle: "Identity & Access Management",
    permission: "accessControl",
    href: "",
    tabs: [
      {
        id: 21,
        icon: MdPeople,
        href: "/dashboard/admins",
        label: "Employee Directory",
        pageTitle: "Employee Directory & Administration",
        permission: "manageEmployees",
      },
      {
        id: 22,
        icon: MdSecurity,
        label: "Role-Based Access",
        href: "/dashboard/role-management",
        pageTitle: "Role & Permission Management",
        permission: "roleManagement",
      },
    ],
  },

  {
    id: 3,
    icon: FaUserTie,
    label: "Service Provider Management",
    href: "",
    pageTitle: "Service Provider Management",
    permission: "manageServiceProviders",
    tabs: [
      {
        id: 31,
        icon: FaList,
        label: "All Service Providers",
        href: "/dashboard/provider",
        pageTitle: "All Service Providers",
        permission: "viewAllServiceProviders",
      },
      {
        id: 32,
        icon: FaBan,
        label: "Blocked Service Providers",
        href: "/dashboard/provider/blocked",
        pageTitle: "Blocked Service Providers",
        permission: "viewBlockedServiceProviders",
      },
      {
        id: 33,
        icon: FaCircle,
        label: "Online Service Providers ",
        href: "/dashboard/provider/online",
        pageTitle: "Online Service Providers",
        permission: "viewOnlineServiceProviders",
      },
      {
        id: 34,
        icon: FaPaperPlane,
        label: "Service Providers Request",
        href: "/dashboard/provider/request",
        pageTitle: "Service Providers Request",
        permission: "manageProviderRequests",
      },
    ],
  },
  {
    id: 101,
    icon: FaImage,
    label: "Avatar Management",
    href: "/dashboard/avatar",
    pageTitle: "Avatar Management",
    permission: "Avatar Management",
    tabs: [],
  },
  {
    id: 4,
    icon: FaUsers,
    label: "User Accounts",
    href: "",
    pageTitle: "End-User Account Management",
    permission: "manageUserAccounts",
    tabs: [
      {
        id: 41,
        icon: FaList,
        label: "All User",
        href: "/dashboard/users",
        pageTitle: "All User",
        permission: "viewAllUsers",
      },
      {
        id: 42,
        icon: FaBan,
        label: "Blocked User",
        href: "/dashboard/users/blocked",
        pageTitle: "Blocked User",
        permission: "viewBlockedUsers",
      },
      {
        id: 43,
        icon: FaWallet,
        label: "Paid User",
        href: "/dashboard/users/paid",
        pageTitle: "Paid User",
        permission: "viewPaidUsers",
      },
      // {
      //   id: 44,
      //   icon: FaTimesCircle,
      //   label: "Unpaid User",
      //   href: "/dashboard/users/unpaid",
      //   pageTitle: "Unpaid User",
      //   permission: "viewUnpaidUsers",
      // },
    ]
  },

  {
    id: 5,
    icon: FaComments,
    label: "Communications Hub",
    href: "/dashboard/conversation",
    pageTitle: "Unified Conversations",
    permission: "manageCommunications",
  },

  {
    id: 6,
    icon: FaGavel,
    label: "Call Penality Management",
    href: "/dashboard/penality",
    pageTitle: "Call Penality Management",
    permission: "manageCallPenalties",
  },

  {
    id: 7,
    icon: FaPhone,
    label: "Telephony Administration",
    href: "/dashboard/call",
    pageTitle: "Telephony Administration",
    permission: "manageTelephony",
    tabs: [],
  },

  {
    id: 8,
    icon: FaMoneyBillTransfer,
    label: "Billing & Revenue Operations",
    pageTitle: "Billing & Revenue Operations",
    permission: "manageBilling",
    href: "",
    tabs: [
      {
        id: 81,
        icon: MdAutorenew,
        label: "Recharge Catalog",
        href: "/dashboard/recharge",
        pageTitle: "Recharge Plan Catalog",
        permission: "manageRechargeCatalog",
      },
      {
        id: 82,
        icon: MdLocalOffer,
        label: "Profile Plans",
        href: "/dashboard/recharge/profile-plan",
        pageTitle: "Profile Recharge Plan Catalog",
        permission: "manageProfilePlans",
      },
      {
        id: 83,
        icon: MdReceipt,
        label: "Customer Recharge Ledger",
        href: "/dashboard/transactions/user",
        pageTitle: "User Recharge Transactions",
        permission: "viewCustomerRechargeLedger",
      },
      {
        id: 84,
        icon: FaList,
        label: "Transaction Ledger",
        href: "/dashboard/transactions",
        pageTitle: "All Transactions Ledger",
        permission: "viewTransactionLedger",
      },
      {
        id: 85,
        icon: RiCoupon3Fill,
        label: "Coupons",
        href: "/dashboard/coupon",
        pageTitle: "Coupon",
        permission: "manageCoupons",
      },
    ],
  },

  {
    id: 9,
    icon: FaFileContract,
    label: "Terms, Policies & Agreement",
    href: "",
    pageTitle: "Terms, Policies & Agreement",
    permission: "managePolicies",
    tabs: [
      {
        id: 91,
        icon: FaFileContract,
        label: "Terms of Service",
        href: "/dashboard/terms",
        pageTitle: "Terms of Service Management",
        permission: "manageTermsOfService",
      },
      {
        id: 92,
        icon: FaShieldAlt,
        label: "Privacy Policy",
        href: "/dashboard/privacy",
        pageTitle: "Privacy Policy Management",
        permission: "managePrivacyPolicy",
      },
      {
        id: 93,
        icon: FaHandshake,
        label: "Agreement",
        href: "/dashboard/agreement",
        pageTitle: "Agreement Management",
        permission: "manageAgreement",
      },
    ],
  },

  {
    id: 10,
    icon: FaWallet,
    label: "Payouts & Withdrawals",
    href: "",
    pageTitle: "Payouts & Withdrawals",
    permission: "managePayouts",
    tabs: [
      {
        id: 101,
        icon: AiOutlineClockCircle,
        label: "Pending Withdrawals",
        href: "/dashboard/withdrawals",
        pageTitle: "Pending Withdrawals",
        permission: "viewPendingWithdrawals",
      }, {
        id: 102,
        icon: FaCheckCircle,
        label: "Approved Withdrawals",
        href: "/dashboard/withdrawals/approved",
        pageTitle: "Approved Withdrawals",
        permission: "viewApprovedWithdrawals",
      }, {
        id: 103,
        icon: FaTimesCircle,
        label: "Rejected Withdrawals",
        href: "/dashboard/withdrawals/rejected",
        pageTitle: "Rejected Withdrawals",
        permission: "viewRejectedWithdrawals",
      },
    ],
  },
  {
    id: 11,
    icon: FaCalculator,
    label: "Commission Slabs",
    href: "/dashboard/commission",
    pageTitle: "Commission Slabs",
    permission: "manageCommissions",
    tabs: [],
  },
  {
    id: 11,
    icon: FaComments,
    label: "Chat Commission Management",
    href: "/dashboard/chat-commission",
    pageTitle: "Chat Commission Management",
    permission: "manageCommissions",
    tabs: [],
  },
  {
    id: 12,
    icon: FaSmile,
    label: "Feedback (User)",
    href: "",
    pageTitle: "Feedback (User)",
    permission: "manageUserFeedback",
    tabs: [
      {
        id: 121,
        icon: FaExclamationTriangle,
        label: "User's Issues",
        href: "/dashboard/issues/user",
        pageTitle: "User's Issues Management",
        permission: "viewUserIssues",
      },
      {
        id: 123,
        icon: FaSmile,
        label: "User's Feedback",
        href: "/dashboard/feedback/user",
        pageTitle: "User's Feedback Management",
        permission: "viewUserFeedback",
      },
      {
        id: 124,
        icon: FaStar,
        label: "Call Reviews & Ratings",
        href: "/dashboard/reviews",
        pageTitle: "Call Reviews & Ratings",
        permission: "viewUserFeedback",
      },
    ]
  },
  {
    id: 13,
    icon: FaSmile,
    label: "Feedback (Provider)",
    href: "",
    pageTitle: "Feedback (Provider)",
    permission: "manageProviderFeedback",
    tabs: [
      {
        id: 131,
        icon: FaExclamationTriangle,
        label: "Provider's Issues",
        href: "/dashboard/issues/provider",
        pageTitle: "Provider's Issues Management",
        permission: "viewProviderIssues",
      },
      {
        id: 132,
        icon: FaQuestionCircle,
        label: "Provider's Query",
        href: "/dashboard/query/provider",
        pageTitle: "Provider's Query Management",
        permission: "viewProviderQueries",
      },
      {
        id: 133,
        icon: FaSmile,
        label: "Provider's Feedback",
        href: "/dashboard/feedback/provider",
        pageTitle: "Provider's Feedback Management",
        permission: "viewProviderFeedback",
      },
      {
        id: 134,
        icon: FaFileContract,
        label: "Provider's Reports",
        href: "/dashboard/reports",
        pageTitle: "Provider's Reports Management",
        permission: "viewProviderExperience",
      },
    ],
  },
  {
    id: 14,
    icon: MdArticle,
    label: "Content Management",
    href: "",
    pageTitle: "Content Management",
    permission: "manageContent",
    tabs: [
      {
        id: 141,
        icon: FaImage,
        label: "Banners",
        href: "/dashboard/banner",
        pageTitle: "Banner Management",
        permission: "manageBanners",
      },
    ],
  },
  {
    id: 15,
    icon: FaLock,
    label: "System Records",
    href: "",
    pageTitle: "System Management",
    permission: "manageSystemRecords",
    tabs: [
      {
        id: 151,
        icon: FaLock,
        label: "OTP Logs",
        href: "/dashboard/otp-logs",
        pageTitle: "OTP History",
        permission: "viewOtpLogs",
      },
      {
        id: 152,
        icon: GiEarthAsiaOceania,
        label: "Manage Countries",
        href: "/dashboard/countries",
        pageTitle: "Country Management",
        permission: "manageCountries",
      },
      {
        id: 153,
        icon: MdOutlineMap,
        label: "Manage States",
        href: "/dashboard/states",
        pageTitle: "State Management",
        permission: "manageStates",
      },
      {
        id: 154,
        icon: HiOutlineBuildingOffice2,
        label: "Manage Cities",
        href: "/dashboard/cities",
        pageTitle: "City Management",
        permission: "manageCities",
      },
      {
        id: 155,
        icon: FaPhone,
        label: "Manage SOS",
        href: "/dashboard/sos",
        pageTitle: "SOS Management",
        permission: "manageSOS",
      },
      {
        id: 156,
        icon: FaWallet,
        label: "Manage Banks",
        href: "/dashboard/banks",
        pageTitle: "Bank Management",
        permission: "manageBanks"
      },
      {
        id: 157,
        icon: FaComments,
        label: "Manage Languages",
        href: "/dashboard/language",
        pageTitle: "Language Management",
        permission: "manageLanguages"
      }
    ],
  },
];

type TabItem = {
  id: number;
  icon: any;
  href: string;
  label: string;
  tabs?: TabItem[];
  pageTitle: string;
  permission: string;
  parent?: string; // added to reflect combineParentTabs behavior
};

export const reverseFormatPermission = (
  formattedPermission: string
): string => {
  return formattedPermission
    .replace(/\s+/g, "")
    .replace(/^\w/, (str) => str.toLowerCase());
};

export const flattenTabs = (tabList: TabItem[]): TabItem[] => {
  const flatList: TabItem[] = [];

  const formatPermission = (permission: string): string => {
    return permission
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toLowerCase())
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const recurse = (tabs: TabItem[], parent?: string) => {
    for (const tab of tabs) {
      const permission = formatPermission(tab?.permission);
      const { tabs: nested, ...rest } = tab;
      if (nested && nested.length > 0) recurse(nested, tab.label);
      else
        flatList.push({
          ...rest,
          permission,
          ...(parent ? { parent } : {}),
        });
    }
  };

  recurse(tabList);
  return flatList;
};

export const combineParentTabs = (tabList: TabItem[]): TabItem[] => {
  const combinedList: TabItem[] = [];

  tabList.forEach((tab: TabItem) => {
    if (tab.parent) {
      let parentTab = combinedList.find((item) => item.label === tab.parent);

      if (!parentTab) {
        parentTab = {
          href: "",
          tabs: [],
          id: Date.now(),
          icon: tab.icon,
          label: tab.parent,
          permission: tab.parent,
          pageTitle: `${tab.parent} Overview`,
        };
        combinedList.push(parentTab);
      }

      parentTab.tabs?.push({
        id: tab.id,
        label: tab.label,
        href: tab.href,
        pageTitle: tab.pageTitle,
        permission: tab.permission,
        icon: tab.icon || FaTags,
      });
    } else {
      combinedList.push({
        id: tab.id,
        label: tab.label,
        href: tab.href,
        pageTitle: tab.pageTitle,
        permission: tab.permission,
        icon: tab.icon || FaTags,
      });
    }
  });

  return combinedList;
};
