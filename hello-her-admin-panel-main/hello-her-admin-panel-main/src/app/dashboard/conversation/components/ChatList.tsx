"use client";

import { Fetch } from "@/hooks/apiUtils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaClock, FaChevronRight } from "react-icons/fa";

interface ChatUser {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  email: string;
  message: string;
  senderAvatar: string;
  receiverAvatar: string;
  time: string;
  timeOnly?: string; // ✅ Store time separately for older messages
  createdAt: Date; // ✅ Add createdAt to track message date
}

interface ChatListProps {
  onSelect: (user: ChatUser | null) => void;
  selectedUserId: string | null;
}

export default function ChatList({ onSelect, selectedUserId }: ChatListProps) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ added searchTerm
  const [, setLoading] = useState(true);

  // ✅ Helper function to determine if message is from today and format accordingly
  const getFormattedTime = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();

    const timeString = messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Check if message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      // Show time only for today's messages
      return {
        display: timeString,
        timeOnly: timeString,
        isOldMessage: false,
      };
    } else {
      // Show date for older messages
      const dateString = messageDate.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
      });
      return {
        display: dateString,
        timeOnly: timeString,
        isOldMessage: true,
      };
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const convUrl = "/api/message";
        const params = { limit: 100, page: 1 };

        const convResp: any = await Fetch(convUrl, params, 5000, true, false);

        if (convResp.success && convResp?.data?.length > 0) {
          const mappedUsers: ChatUser[] = convResp.data.map((conv: any) => {
            let senderAvatar = conv.sender?.activeImageUrl;
            let receiverAvatar = conv.receiver?.activeImageUrl;
            if (!senderAvatar || senderAvatar === "") senderAvatar = "/assets/bg/bg.jpg";
            if (!receiverAvatar || receiverAvatar === "") receiverAvatar = "/assets/bg/placeholder.avif";
            console.log(conv);
            const createdAtDate = new Date(conv.createdAt);
            const formattedTimeObj = getFormattedTime(createdAtDate);
            return {
              id: conv.messageId,
              senderId: conv.sender._id,
              receiverId: conv.receiver._id,
              senderName: conv.sender?.name || "Unknown",
              receiverName: conv.receiver?.name || "Unknown",
              email: conv.sender?.email || "N/A",
              message: conv.text || "",
              senderAvatar,
              receiverAvatar,
              createdAt: createdAtDate, // ✅ Store full date
              time: formattedTimeObj.display, // ✅ Use helper to format time/date
              timeOnly: formattedTimeObj.timeOnly, // ✅ Store actual time separately
            };
          });

          setUsers(mappedUsers);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.log("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // ✅ filter logic based on search input
  const filteredUsers = users.filter(
    (user) =>
      user.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full pr-2 sm:w-1/3 h-screen bg-whiteBg rounded-l-xl rounded-r-xl overflow-hidden">
      <div className="flex items-center justify-between pb-5 pl-2 pt-5 bg-primary">
        <span className="bg-infobg text-iconBlack px-4 mx-auto py-1 rounded-full text-sm font-semibold tracking-wide">
          Open Chats • {filteredUsers.length}
        </span>
      </div>

      {/* ✅ search input connected to state */}
      <div className="relative mb-2 pl-2 mt-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // <-- update state
          placeholder="Search by name..."
          className="w-full pl-10 rounded-lg pr-4 py-3 text-sm bg-infobg text-infoBlack focus:outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.15z"
          />
        </svg>
      </div>

      <div className="overflow-y-auto pl-2 space-y-2 h-[calc(100vh-64px)]">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelect(user)}
            className={`flex gap-3 items-start rounded-lg px-2 py-4 cursor-pointer transition-all duration-200 ${selectedUserId === user.id ? "bg-infobg" : "hover:bg-infobg"
              }`}
          >
            <div className="relative w-12">
              <Image
                width={100}
                height={100}
                unoptimized
                alt="sender avatar"
                src={user.senderAvatar}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-iconBlack absolute left-0 top-0 z-10"
              />
              <Image
                width={100}
                height={100}
                unoptimized
                alt="receiver avatar"
                src={user.receiverAvatar}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-iconBlack absolute left-4 top-0 z-0"
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div className="flex flex-col text-sm font-semibold text-iconBlack">
                  <span>{user.senderName}</span>
                  <span className="text-xs text-gray-500">
                    {user.receiverName}
                  </span>
                </div>

                {/* ✅ Show time for today or date + time for older messages */}
                {user.timeOnly ? (
                  // Older message: show date and time stacked with better alignment
                  <div className="flex flex-col items-end justify-center gap-0.5 ml-2">
                    <span className="text-xs text-iconBlack font-medium leading-tight">
                      📅 {user.time}
                    </span>
                    <span className="text-xs text-gray-400 leading-tight flex items-center justify-end gap-0.5">
                      {user.timeOnly}
                    </span>
                  </div>
                ) : (
                  // Today: show time only with clock icon
                  <span className="text-xs text-iconBlack flex items-center gap-1 whitespace-nowrap">
                    <FaClock className="text-primary" size={12} />
                    {user.time}
                  </span>
                )}
              </div>

              {/* <p className="mt-1.5 text-sm text-iconBlack line-clamp-1">
                {user.message}
              </p> */}
            </div>

            <FaChevronRight className="text-iconBlack mt-1" />
          </div>
        ))}

        {/* ✅ show no results message */}
        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500 py-6">No chats found.</p>
        )}
      </div>
    </div>
  );
}
