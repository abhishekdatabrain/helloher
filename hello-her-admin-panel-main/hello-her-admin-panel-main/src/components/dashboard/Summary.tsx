"use client";

import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Fetch, Post } from "@/hooks/apiUtils";
import { FaFileAlt } from "react-icons/fa";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCallback, useEffect, useState } from "react";
import { FaHeart, FaCommentAlt, FaShare } from "react-icons/fa"
import { formatCompactNumber } from "@/hooks/general";
const BarChart = dynamic(() => import("@/components/chart/Barchart"), {
  ssr: false, // 🚫 Disable Server Side Rendering for this component
});

dayjs.extend(relativeTime);

const Summary = () => {
  const [posting, setPosting] = useState<any>({});
  const [userStats, setUserStats] = useState<any>({});
  const [jobListing, setJobListing] = useState<any>({});
  const [notifications, setNotifications] = useState<any>({});

  const fetchCurrentNotifications = useCallback(async () => {
    try {
      const [notifRes, jobRes, postRes, userRes]: any = await Promise.all([
        Post("/api/user/all/notifications", {}, 5000, true).catch((err) => {
          console.log("Notifications API failed:", err);
          return null;
        }),
        Fetch("/api/job?page=1&limit=4", {}, 5000, true, false).catch((err) => {
          console.log("Jobs API failed:", err);
          return null;
        }),
        Fetch("/api/forumpost?page=1&limit=3", {}, 5000, true, false).catch((err) => {
          console.log("Forum Posts API failed:", err);
          return null;
        }),
        Fetch("/api/dashboard/user-stats", {}, 5000, true, false).catch((err) => {
          console.log("User Stats API failed:", err);
          return null;
        }),
      ]);

      if (postRes?.success) setPosting(postRes.data);
      if (jobRes?.success) setJobListing(jobRes.data);
      if (userRes?.success) setUserStats(userRes.data);
      if (notifRes?.success) setNotifications(notifRes.data);
    } catch (err) {
      console.log("fetchCurrentNotifications error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentNotifications();
  }, [fetchCurrentNotifications]);

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <div className="w-full bg-whiteBg py-3 px-2.5 rounded-xl">
          <div className="flex justify-between gap-4 border-b border-infobg pb-3 items-center">
            <h2 className="font-semibold text-iconBlack text-xs">
              Community Posts ({posting?.pagination?.totalItems})
            </h2>
            <Link href={"/dashboard/community/posts"} className="text-white bg-orange-500 text-[10px] rounded-md whitespace-nowrap px-2 py-1">
              View Details
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {posting?.result?.length > 0 && posting?.result.map((post: any) => (
              <div key={post._id} className="flex items-start space-x-2">
                {post?.attachments?.length > 0 ?
                  <Image src={post?.attachments[0]?.url} alt="Image" className="min-h-8 object-contain border border-iconBlack min-w-8 max-h-8 max-w-8 aspect-square rounded-full" width={48} height={48} />
                  :
                  <div
                    className={`min-h-8 min-w-8 flex justify-center items-center aspect-square rounded-full bg-yellow-500`}
                  >
                    <FaFileAlt color="white" />
                  </div>
                }
                <div className="flex w-full flex-col">
                  <span className="font-bold text-iconBlack text-xs line-clamp-1">
                    {post.title}
                  </span>
                  <div className="h-5 overflow-hidden">
                    <p className="gap-0.5 flex flex-wrap mt-1">
                      <span className="text-[8px] bg-infobg px-1 py-0.5 rounded text-iconBlack">
                        {post?.communityDetails?.name}
                      </span>
                      {post?.tags?.map((tag: string) => {
                        return <span key={tag} className="text-[8px] bg-infobg px-1 py-0.5 rounded text-iconBlack">
                          {tag}
                        </span>
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <FaHeart className="w-3 h-3 text-rose-500" />
                      <span className="text-xs">{post?.likes ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCommentAlt className="w-3 h-3 text-blue-500" />
                      <span className="text-xs">{post?.commentsCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaShare className="w-3 h-3 text-green-500" />
                      <span className="text-xs">{post?.shares ?? 0}</span>
                    </div>
                  </div>
                  <span className="text-iconBlack text-[10px] leading-1 line-clamp-2">
                    {post.content}
                  </span>
                  <span className="text-right italic font-semibold text-[10px] mt-1 flex flex-col">
                    {post.userData && (
                      <span className="text-iconBlack capitalize">
                        - {post?.userData?.fullName} ({dayjs(post.createdAt).fromNow()})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full bg-whiteBg py-3 px-2.5 rounded-xl">
          <div className="flex justify-between gap-4 border-b border-infobg pb-3 items-center">
            <h2 className="font-semibold text-iconBlack text-xs">
              App Traffic
            </h2>
            <Link href={"/dashboard/users/worker"} className="text-white bg-orange-500 text-[10px] rounded-md whitespace-nowrap px-2 py-1">
              View Details
            </Link>
          </div>
          {userStats && userStats?.length > 0 &&
            <BarChart userStats={userStats} />
          }
        </div>
        <div className="w-full bg-whiteBg py-3 px-2.5 rounded-xl">
          <div className="flex justify-between gap-3 border-b border-infobg pb-3 items-center">
            <h2 className="font-semibold text-iconBlack text-xs">
              Recent Activity ({formatCompactNumber(notifications?.pagination?.totalItems)})
            </h2>
            <Link href={"/dashboard/notifications"} className="text-white bg-orange-500 text-[10px] rounded-md whitespace-nowrap px-2 py-1">
              View Details
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {notifications?.result?.length > 0 && notifications?.result.slice(0, 5)?.map((activity: any) => (
              <div key={activity._id} className="flex items-start space-x-2">
                <div
                  className={`min-h-8 min-w-8 flex justify-center items-center aspect-square rounded-full bg-orange-500`}
                >
                  <FaFileAlt color="white" />
                </div>
                <div className="flex w-full flex-col">
                  <span className="font-bold text-iconBlack text-xs line-clamp-1">
                    {activity.title}
                  </span>
                  <span className="text-gray-500 text-[10px] leading-1 line-clamp-2">
                    {activity.message}
                  </span>
                  <span className="text-right italic font-semibold text-[10px] mt-1 flex flex-col">
                    {activity.to && (
                      <span className="text-iconBlack capitalize">
                        - {activity?.to?.fullName} ({dayjs(activity.createdAt).fromNow()})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full bg-whiteBg py-3 px-2.5 rounded-xl">
          <div className="flex justify-between gap-4 border-b border-infobg pb-3 items-center">
            <h2 className="font-semibold text-iconBlack text-xs">
              Job Listings ({jobListing?.pagination?.totalItems})
            </h2>
            <Link href={"/dashboard/jobs"} className="text-white bg-orange-500 text-[10px] rounded-md whitespace-nowrap px-2 py-1">
              View Details
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {jobListing?.result?.length > 0 && jobListing?.result.map((listing: any) => (
              <div key={listing._id} className="flex items-start space-x-2">
                {listing?.profilePicUrl ?
                  <Image src={listing?.profilePicUrl} alt="Image" className="min-h-8 object-contain border border-iconBlack min-w-8 max-h-8 max-w-8 aspect-square rounded-full" width={48} height={48} />
                  :
                  <div
                    className={`min-h-8 min-w-8 flex justify-center items-center aspect-square rounded-full bg-blue-500`}
                  >
                    <FaFileAlt color="white" />
                  </div>
                }
                <div className="flex w-full flex-col">
                  <span className="font-bold text-iconBlack text-xs line-clamp-1">
                    {listing.title}
                  </span>
                  <div className="h-5 overflow-hidden">
                    <p className="gap-0.5 flex flex-wrap mt-1">
                      <span className="text-[8px] bg-infobg px-1 py-0.5 rounded text-iconBlack">
                        {listing?.jobType}
                      </span>
                      <span className="text-[8px] bg-infobg px-1 py-0.5 rounded text-iconBlack">
                        {listing?.workMode}
                      </span>
                      {listing?.tags?.map((tag: string) => {
                        return <span key={tag} className="text-[8px] bg-infobg px-1 py-0.5 rounded text-iconBlack">
                          {tag}
                        </span>
                      })}
                    </p>
                  </div>
                  <span className="text-iconBlack text-[10px] leading-1 line-clamp-2">
                    {listing.description}
                  </span>
                  <span className="text-right italic font-semibold text-[10px] mt-1 flex flex-col">
                    {listing.creatorName && (
                      <span className="text-iconBlack capitalize">
                        - {listing?.creatorName} ({dayjs(listing.createdAt).fromNow()})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Summary;
