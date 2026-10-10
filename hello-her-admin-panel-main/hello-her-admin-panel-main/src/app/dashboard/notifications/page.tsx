"use client";

import { Fetch } from "@/hooks/apiUtils";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Wrapper from "@/components/common/Wrapper";
import { AnimatePresence, motion } from "framer-motion";
import {
  MdCancel,
  MdMessage,
  MdSubtitles,
  MdInfoOutline,
  MdAnnouncement,
  MdOutlineSchool,
  MdAssignmentTurnedIn,
  MdNotificationsActive,
} from "react-icons/md";
import dayjs from "dayjs";
import { BiBriefcaseAlt2, BiBookAlt } from "react-icons/bi";
import Pagination from "@/components/common/table/Pagination";

export default function NotificationPanel() {
  const [loading, setLoading] = useState(false);
  const [paginate, setPaginate] = useState<any>({
    totalPages: 1,
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async (searchParams: any) => {
    setLoading(true);
    try {
      const baseUrl = "/api/user/notifications";
      const params = {
        page: searchParams?.page ?? 1,
        limit: searchParams?.limit ?? 10,
      };
      const queryString = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      const url = `${baseUrl}?${queryString}`;
      const response: any = await Fetch(url, {}, 5000, true);
      if (response?.success) {
        setNotifications(response.data?.result || []);
        setPaginate(response.data?.pagination);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications({});
  }, []);

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
    <AuthGuard>
      <Wrapper>
        <div className="w-full bg-whiteBg rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-iconBlack">
              Notifications{" "}
              <span className="text-sm text-iconBlack">
                ({paginate.totalItems})
              </span>
            </h2>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-gray-400 text-sm">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                No notifications available.
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((noti: any, index: number) => (
                  <motion.div
                    key={noti._id}
                    role="listitem"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start bg-infobg rounded-lg p-2 transition duration-200"
                  >
                    <div className="flex-shrink-0 mt-1 mr-3">
                      {getIcon(noti?.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 items-center">
                          <p className="text-sm font-semibold text-iconBlack">
                            {noti?.title}
                          </p>
                          <div className="text-xs text-iconBlack">
                            {noti?.from?.fullName && (
                              <span className="mr-4">
                                <strong>From:</strong> {noti?.from?.fullName} (
                                {noti?.from?.userType})
                              </span>
                            )}
                            {noti?.to?.fullName && (
                              <span>
                                <strong>To:</strong> {noti?.to?.fullName} (
                                {noti?.to?.userType})
                              </span>
                            )}
                          </div>
                        </div>
                        <time
                          dateTime={noti?.createdAt}
                          className="text-xs text-iconBlack"
                        >
                          {dayjs(noti?.createdAt).format(
                            "MMMM DD, YYYY (dddd) - h:mm A"
                          )}
                        </time>
                      </div>
                      <p className="text-xs pt-0.5 text-iconBlack">
                        {noti?.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="mt-3">
            <Pagination
              paginate={paginate}
              fetchFilteredData={fetchNotifications}
            />
          </div>
        )}
      </Wrapper>
    </AuthGuard>
  );
}
