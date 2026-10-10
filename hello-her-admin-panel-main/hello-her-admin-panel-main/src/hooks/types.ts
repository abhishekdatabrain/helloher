export type MultiPurposeProps = {
  options?: string[];
  type: "label" | "button" | "select";
};

export enum UserType {
  WORKER = "worker",
  EMPLOYER = "employer",
  CONTRACTOR = "contractor",
}

export enum PlanType {
  FREE = "free",
  BASIC = "basic",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
  PROFESSIONAL = "professional",
}

export enum PropertyType {
  LOFT = "loft",
  VILLA = "villa",
  HOUSE = "house",
  CONDO = "condo",
  RETAIL = "retail",
  STUDIO = "studio",
  OFFICE = "office",
  TOWNHOUSE = "townhouse",
  APARTMENT = "apartment",
  PENTHOUSE = "penthouse",
  WAREHOUSE = "warehouse",
  COMMERCIAL = "commercial",
}

export enum TransactionType {
  SALE = "sale",
  RENT = "rent",
  LEASE = "lease",
}

export enum ListingStatus {
  SOLD = "sold",
  DRAFT = "draft",
  ACTIVE = "active",
  RENTED = "rented",
  PENDING = "pending",
  INACTIVE = "inactive",
}

export enum BillingCycle {
  MONTHLY = "monthly",
  ANNUALLY = "annually",
  LIFETIME = "lifetime",
  QUARTERLY = "quarterly",
  SEMI_ANNUALLY = "semi_annually",
  PAY_AS_YOU_GO = "pay_as_you_go",
}


export enum Currency {
  INR = "INR",
}

export enum PlanStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum CommunityPrivacy {
  PUBLIC = "public",
  PRIVATE = "private",
}

export enum CommunityType {
  TECH = "tech",
  OTHER = "other",
  GAMING = "gaming",
  SPORTS = "sports",
  HEALTH = "health",
  GENERAL = "general",
  CREATIVE = "creative",
  BUSINESS = "business",
  EDUCATION = "education",
}

export enum CommunityStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum CourseStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
  COMPLETED = "completed",
}

export enum PriorityLevel {
  LOW = "low",
  HIGH = "high",
  MEDIUM = "medium",
  CRITICAL = "critical",
}

export enum CourseType {
  ONLINE = "online",
  OFFLINE = "offline",
}

export type ColConfig = {
  key: string;
  image?: boolean;
  length?: number;
  prefix?: string;
  suffix?: string;
  joiner?: string;
  isAMPm?: boolean;
  isTime?: boolean;
  isDate?: boolean;
  fallback?: string;
  urlLink?: boolean;
  isPercent?: string;
  jsonFormat?: boolean;
  isDateTime?: boolean;
  isCurrency?: boolean;
  imageWithKey?: string;
  isMultiPurpose?: boolean;
  truncateWords?: boolean;
  multiPurposeProps?: MultiPurposeProps;
  transform?: "uppercase" | "lowercase" | "capitalize";
  isAudio?: boolean;
};

export interface FilterOption {
  label: string;
  value: string;
}

export enum RoomType {
  GYM = "gym",
  POOL = "pool",
  ATTIC = "attic",
  GARDEN = "garden",
  OFFICE = "office",
  GARAGE = "garage",
  BALCONY = "balcony",
  TERRACE = "terrace",
  BEDROOM = "bedroom",
  KITCHEN = "kitchen",
  LAUNDRY = "laundry",
  STORAGE = "storage",
  BATHROOM = "bathroom",
  BASEMENT = "basement",
  LIVING_ROOM = "living_room",
  DINING_ROOM = "dining_room",
}

export interface FormField {
  name: string;
  fields?: any[],
  label: string;
  customClasses?: any;
  type:
  | "text"
  | "group"
  | "label"
  | "br"
  | "button"
  | "arrayOfString"
  | "warehouse"
  | "packing"
  | "billing"
  | "purchaseForm"
  | "productBillingForm"
  | "stockTransferForm"
  | "email"
  | "password"
  | "richTextEditor"
  | "file"
  | "document"
  | "audio"
  | "date"
  | "multipleFiles"
  | "select"
  | "checkbox"
  | "radio"
  | "number"
  | "textarea"
  | "choose"
  | "BlockToggle"
  | "stringNumeric"
  | "productForm";
  value?: any;
  rows?: number;
  min?: number;
  max?: number;
  minDate?: any;
  maxDate?: any;
  options?: any;
  accept?: string;
  maxFiles?: number;
  currentDate?: any;
  maxSizeMB?: number;
  maxLength?: number;
  multiple?: boolean;
  isVideo?: boolean;
  required?: boolean;
  widthFull?: boolean;
  isMultiple?: boolean;
  placeholder?: string;
  confirmPlaceholder?: string;
  validation?: (value: any) => string | null;
  isDisabled?: boolean;
}
