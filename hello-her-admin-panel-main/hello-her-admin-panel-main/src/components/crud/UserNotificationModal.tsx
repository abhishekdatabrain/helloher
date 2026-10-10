import {
  MdCancel,
  MdAssignmentTurnedIn,
  MdNotificationsActive,
} from "react-icons/md";
import {
  MdMessage,
  MdSubtitles,
  MdInfoOutline,
  MdAnnouncement,
  MdOutlineSchool,
} from "react-icons/md";
import dayjs from "dayjs";
import { Post } from "@/hooks/apiUtils";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BiBriefcaseAlt2, BiBookAlt } from "react-icons/bi";
import Pagination from "@/components/common/table/Pagination";

const UserNotificationModal = ({ data: notifications }: any) => {
  const [loading, setLoading] = useState(false);
  const [paginate, setPaginate] = useState<any>({
    totalPages: notifications?.pagination?.totalPages ?? 1,
    totalItems: notifications?.pagination?.totalItems ?? 0,
    currentPage: notifications?.pagination?.currentPage ?? 1,
    itemsPerPage: notifications?.pagination?.itemsPerPage ?? 10,
  });
  const [notification, setNotification] = useState<any[]>(notifications?.result);
  const fetchNotifications = async (searchParams: any) => {
    setLoading(true);
    try {
      const baseUrl = "/api/user/all/notifications";
      const params = {
        page: searchParams?.page ?? 1,
        limit: searchParams?.limit ?? 10,
      };
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const url = `${baseUrl}?${queryString}`;
      const response: any = await Post(url, {}, 5000, true);
      if (response?.success) {
        setNotification(response.data?.result || []);
        setPaginate(response.data?.pagination);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "job-posted":
        return <BiBriefcaseAlt2 className="text-blue-600 w-5 h-5" />;
      case "job-applied":
        return <MdAssignmentTurnedIn className="text-green-600 w-5 h-5" />;
      case "job-expiring":
        return <MdCancel className="text-orange-600 w-5 h-5" />;
      case "course-added":
        return <BiBookAlt className="text-indigo-600 w-5 h-5" />;
      case "course-enrolled":
        return <MdOutlineSchool className="text-emerald-600 w-5 h-5" />;
      case "subscription-renewal":
        return <MdSubtitles className="text-green-500 w-5 h-5" />;
      case "subscription-expiring":
        return <MdSubtitles className="text-yellow-500 w-5 h-5" />;
      case "new-community-post":
        return <MdAnnouncement className="text-cyan-600 w-5 h-5" />;
      case "reply-on-post":
        return <MdMessage className="text-sky-500 w-5 h-5" />;
      case "admin-message":
        return <MdMessage className="text-red-500 w-5 h-5" />;
      case "general-alert":
        return <MdInfoOutline className="text-gray-500 w-5 h-5" />;
      default:
        return <MdNotificationsActive className="text-gray-400 w-5 h-5" />;
    }
  };
  return (
    <div className="w-full bg-white p-4 rounded-2xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base text-black font-semibold">
          All Notifications ({notification.length})
        </h2>
      </div>
      {/* notification */}
      <div className="space-y-2 min-h-[75vh]">
        {loading ? (
          <div className="text-center text-gray-400 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">No notifications available.</div>
        ) : (
          <AnimatePresence>
            {notification?.length > 0 &&
              notification.map((noti: any, index: number) => (
                <motion.div
                  key={noti._id}
                  role="listitem"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex justify-between cursor-pointer items-center bg-gradient-to-br from-green-200 via-green-100 to-green-300 rounded-lg p-3 py-2"
                  aria-label={`Notification: ${noti.title}`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">{getIcon(noti?.type)}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center font-sans space-x-2">
                        <p className="text-gray-900 text-xs font-semibold">
                          {noti?.title}
                        </p>
                        <div className="text-gray-500 text-xs space-x-2">
                          {noti?.from?.fullName &&
                            <span>
                              <strong>From:</strong> {noti?.from?.fullName} (
                              {noti?.from?.userType})
                            </span>
                          }
                          <span>•</span>
                          {noti?.to?.fullName &&
                            <span>
                              <strong>To:</strong> {noti?.to?.fullName} ({noti?.to?.userType})
                            </span>
                          }
                        </div>
                      </div>
                      <p className="text-gray-700 font-sans text-xs mb-1">
                        {noti?.message}
                      </p>
                    </div>
                  </div>
                  <time
                    dateTime={noti?.createdAt}
                    className="text-gray-800 text-xs whitespace-nowrap ml-4"
                    aria-label={`Notification date ${dayjs(noti?.createdAt).format(
                      "MMM D, YYYY - h:mm A"
                    )}`}
                  >
                    {dayjs(noti?.createdAt).format("MMMM DD, YYYY (dddd) - h:mm A")}
                  </time>
                </motion.div>
              ))}
          </AnimatePresence>
        )}
      </div>
      {notification.length > 0 && (
        <div className="mt-3">
          <Pagination
            paginate={paginate}
            fetchFilteredData={fetchNotifications}
          />
        </div>
      )}
    </div>
  );
};

export default UserNotificationModal;
