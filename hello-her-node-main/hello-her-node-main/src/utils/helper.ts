import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;
import { toBoolean } from "validator";

/**
 * 🟢 Build the MongoDB aggregation pipeline based on query filters
 * @param {Record<string, any>} query - The query parameters to build the pipeline from
 * @returns {Object} - The constructed pipeline and matching stage
 */
export const getPipeline = (
  query: Record<string, any>,
  additionalStages?: any[] | Record<string, any>
) => {
  const {
    _id,
    user,
    type,
    role,
    status,
    userId,
    endDate,
    isActive,
    category,
    assignee,
    userType,
    groundId,
    createdBy,
    startDate,
    searchkey,
    countryId,
    paymentStatus,
    isPaid,
    isBlocked,
    isVerified,
    isOnline,
    isDeleted,
    isAdmin,
    gender,
    page = 1,
    limit = 10,
    search = "",
    sortDir = "desc",
    sortKey = "createdAt",
    entityId,
    providerId,
  } = query;

  const pageNumber = Math.max(parseInt(page, 10), 1);
  const limitNumber = Math.max(parseInt(limit, 10), 1);
  const basePipeline: any[] = [];
  const match: Record<string, any> = {};

  const safeObjectId = (val: any): mongoose.Types.ObjectId | any =>
    ObjectId.isValid(val) ? new ObjectId(val) : val;

  // ✅ Helper to convert string boolean to actual boolean
  const convertToBoolean = (value: any) => {
    if (value === undefined || value === null) return undefined;
    const strValue = String(value).toLowerCase().trim();
    const trueValues = ["true", "1", "yes"];
    const falseValues = ["false", "0", "no"];

    if (trueValues.includes(strValue)) return true;
    if (falseValues.includes(strValue)) return false;
    return undefined;
  };

  // Basic match filters
  if (type) match.type = type;
  if (role) match.role = role;
  if (status) match.status = status;
  if (_id) match._id = safeObjectId(_id);
  if (userType) match.userType = userType;
  if (user) match.user = safeObjectId(user);
  if (userId) match.userId = safeObjectId(userId);
  if (category) match.category = safeObjectId(category);
  if (assignee) match.assignee = safeObjectId(assignee);
  if (groundId) match.groundId = safeObjectId(groundId);
  if (paymentStatus) match.paymentStatus = paymentStatus;
  if (gender) match.gender = gender;
  if (createdBy) match.createdBy = safeObjectId(createdBy);
  if (countryId) match.countryId = safeObjectId(countryId);
  if (entityId) match.entityId = safeObjectId(entityId);
  if (providerId) match.providerId = safeObjectId(providerId);

  // ✅ Boolean filters with proper conversion
  if (isActive !== undefined) {
    const boolValue = convertToBoolean(isActive);
    if (boolValue !== undefined) {
      match.isActive = boolValue;
    } else {
      // allow string-based active/inactive filtering when not a boolean-like value
      match.isActive = isActive;
    }
  }

  if (isPaid !== undefined) {
    const boolValue = convertToBoolean(isPaid);
    if (boolValue !== undefined) match.isPaid = boolValue;
  }

  if (isBlocked !== undefined) {
    const boolValue = convertToBoolean(isBlocked);
    if (boolValue !== undefined) match.isBlocked = boolValue;
  }

  if (isVerified !== undefined) {
    const boolValue = convertToBoolean(isVerified);
    if (boolValue !== undefined) match.isVerified = boolValue;
  }

  if (isOnline !== undefined) {
    const boolValue = convertToBoolean(isOnline);
    if (boolValue !== undefined) match.isOnline = boolValue;
  }

  if (isDeleted !== undefined) {
    const boolValue = convertToBoolean(isDeleted);
    if (boolValue !== undefined) match.isDeleted = boolValue;
  }

  if (isAdmin !== undefined) {
    const boolValue = convertToBoolean(isAdmin);
    if (boolValue !== undefined) match.isAdmin = boolValue;
  }

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  if (Object.keys(match).length) basePipeline.push({ $match: match });

  // Add additional stages before faceting (lookups, projections, etc.)
  if (Array.isArray(additionalStages)) basePipeline.push(...additionalStages);
  else if (additionalStages && typeof additionalStages === "object")
    basePipeline.push(additionalStages);

  // Search (including multi-field)
  if (search && searchkey) {
    const keys = searchkey
      .split(",")
      .map((k: string) => k.trim())
      .filter(Boolean);

    if (keys.length > 1) {
      basePipeline.push({
        $match: {
          $or: keys.map((key: any) => ({
            [key]: { $regex: search, $options: "i" },
          })),
        },
      });
    } else {
      const key = keys[0];
      if (["_id", "category"].includes(key)) {
        basePipeline.push({ $addFields: { idStr: { $toString: `$${key}` } } });
        basePipeline.push({
          $match: { idStr: { $regex: search, $options: "i" } },
        });
        basePipeline.push({ $project: { idStr: 0 } });
      } else {
        basePipeline.push({
          $match: { [key]: { $regex: search, $options: "i" } },
        });
      }
    }
  }

  // Wrap in facet for pagination and total count
  const pipeline = [
    ...basePipeline,
    { $sort: { [sortKey]: sortDir === "asc" ? 1 : -1 } },
    {
      $facet: {
        data: [
          { $skip: (pageNumber - 1) * limitNumber },
          { $limit: limitNumber },
        ],
        total: [{ $count: "count" }],
      },
    },
    {
      $addFields: {
        totalCount: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
      },
    },
  ];

  return {
    pipeline,
    matchStage: match,
    options: { collation: { locale: "en", strength: 2 }, allowDiskUse: true },
  };
};

/**
 * 🟢 Format the result with pagination info
 * @param {number} pageNumber - Current page number
 * @param {number} limitNumber - Number of items per page
 * @param {number} totalResults - Total number of items
 * @param {Array<any>} results - The result set
 * @returns {Object} - The paginated result with pagination metadata
 */
export const paginationResult = (
  pageNumber: number,
  limitNumber: number,
  totalResults: number,
  results: any[]
) => {
  return {
    result: results,
    pagination: {
      currentPage: pageNumber,
      totalItems: totalResults,
      itemsPerPage: limitNumber,
      totalPages: Math.ceil(totalResults / limitNumber),
    },
  };
};

/**
 * 🟢 Convert a string to a valid MongoDB ObjectId
 * @param {string} id - The string to convert
 * @returns {ObjectId | null} - The ObjectId or null if invalid
 */
export const convertToObjectId = (id: string): mongoose.Types.ObjectId | null => {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.log("Invalid ObjectId:", error);
    return null;
  }
};

/**
 * 🟢 Check if a string is a valid MongoDB ObjectId
 * @param {string} id - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
// export const isValidObjectId = (id: string): boolean => {
//   try {
//     new ObjectId(id);
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

/**
 * 🟢 Check if a string is a valid MongoDB ObjectId
 * @param {string} id - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidObjectId = (id: string): boolean => {
  try {
    return ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};


/**
 * 🟢 Check if a string is a valid UUID
 * @param {string} uuid - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * 🟢 Check if a string is a valid email
 * @param {string} email - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * 🟢 Check if a string is a valid URL
 * @param {string} url - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidURL = (url: string): boolean => {
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9.-]+)(:[0-9]+)?(\/[^\s]*)?$/;
  return urlRegex.test(url);
};

/**
 * 🟢 Check if a string is a valid phone number
 * @param {string} phone - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(phone);
};

/**
 * 🟢 Check if a string is a valid date
 * @param {string} date - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * 🟢 Check if a string is a valid time
 * @param {string} time - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format
  return timeRegex.test(time);
};

/**
 * 🟢 Check if a string is a valid datetime
 * @param {string} datetime - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidDateTime = (datetime: string): boolean => {
  const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/; // ISO 8601 format
  return datetimeRegex.test(datetime);
};

/**
 * 🟢 Check if a string is a valid JSON
 * @param {string} jsonString - The string to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidJSON = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};


export function convertToSaudiTime(dateInput: any) {
  if (!dateInput) return "Invalid date";

  const date = new Date(dateInput);

  return date.toLocaleString("en-US", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
