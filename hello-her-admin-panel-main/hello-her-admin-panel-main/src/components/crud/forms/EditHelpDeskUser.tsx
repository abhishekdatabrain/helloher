import dayjs from "dayjs";
import { toast } from "react-toastify";
import { includes } from "@/hooks/polyfills";
import { io, Socket } from "socket.io-client";
import { Fetch, Post } from "@/hooks/apiUtils";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import relativeTime from "dayjs/plugin/relativeTime";
import { IoIosArrowDropdownCircle } from "react-icons/io";

dayjs.extend(relativeTime);

const ticketStatuses = [
  { label: "Closed", value: "closed" },
  { label: "On Hold", value: "on_hold" },
  { label: "Resolved", value: "resolved" },
  { label: "In Progress", value: "in_progress" },
];

const EditHelpDeskUser = (props: any) => {
  const id: any = props?.data?._id;
  const state: any = props?.data;

  const socket = useRef<Socket | null>(null);

  const [data, setData] = useState(state);
  const [localState, setLocalState] = useState({
    action: "commented",
    ticketId: state?._id,
    agentId: state?.assignee?._id,
    userId: state?.requester?._id,
  });
  const { user } = useAuth();
  const userRole: any = user?.role?.name;
  const [list, showList] = useState(false);
  const [agents, setAgents] = useState([]);
  const [message, setMessage] = useState("");
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(state ? false : true);
  const [interaction, setInteraction] = useState(state?.interactions);
  const isUserRole = includes(["worker", "employer", "contractor"], userRole?.toLowerCase());

  const [senderId, setSenderID] = useState(
    isUserRole
      ? state?.requester?._id
      : state?.assignee?._id
  );
  const [receiverId, setReceiverID] = useState(
    includes(["admin", "agent"], userRole) ? state?.requester?._id : state?.assignee?._id
  );

  useEffect(() => {
    const fetchAgents = async () => {
      const url = "/api/support/agents?availability=true";
      const resp: any = await Fetch(url, {}, 5000, true, false);
      if (resp?.success) setAgents(resp.data?.result ?? []);
    };
    if (data && !data?.assignee) fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.assignee]);

  const setState = (resp: any) => {
    setData(resp.data);
    setLoading(false);
    setLocalState({
      action: "commented",
      ticketId: resp.data?._id,
      agentId: resp.data?.assignee?._id,
      userId: resp.data?.requester?._id,
    });
    setInteraction(resp?.data?.interactions);
    setSenderID(
      isUserRole
        ? resp.data?.requester?._id
        : resp.data?.assignee?._id
    );
    setReceiverID(
      includes(["admin", "agent"], userRole)
        ? resp.data?.requester?._id
        : resp.data?.assignee?._id
    );
  };

  useEffect(() => {
    if (
      socket.current === null &&
      data?.status !== "closed" &&
      data?.assignee
    ) {
      socket.current = io("http://localhost:8080");

      if (senderId) socket.current.emit("addUser", senderId);
      socket.current.on("getMessage", (data) => {
        if (data?.senderId === receiverId) {
          const isAdmin = ["admin", "agent"].includes(userRole);
          const isUserOrVendor = isUserRole

          const receiverType = isAdmin ? "Agent" : "User";
          const initiatorType = isUserOrVendor ? "Agent" : "User";

          const obj = {
            receiverType,
            initiatorType,
            isSender: false,
            content: data?.text,
            receiver: senderId,
            timestamp: new Date(),
            initiator: receiverId,
            action: localState.action,
          };
          setInteraction((prev: any[]) => [...prev, obj]);
        }
      });
    }
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderId]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const isAdmin = ["admin", "agent"].includes(userRole);
    const isUserOrVendor = isUserRole

    const receiverType = isAdmin ? "User" : "Agent";
    const initiatorType = isUserOrVendor ? "User" : "Agent";

    const obj = {
      receiverType,
      initiatorType,
      isSender: true,
      content: message,
      initiator: senderId,
      receiver: receiverId,
      timestamp: new Date(),
      action: localState.action,
    };

    const response: any = await Post("/api/support/tickets/interactions", {
      content: message,
      initiator: senderId,
      action: obj?.action,
      receiver: receiverId,
      ticketId: localState.ticketId,
    });

    if (response?.success) {
      const messageData = {
        text: message,
        senderId: senderId,
        receiverId: receiverId,
      };
      setInteraction((prev: any[]) => [...prev, obj]);
      if (socket.current) socket.current.emit("sendMessage", messageData);
      setMessage("");
      return true;
    } else {
      setMessage("");
      console.log("Failed to submit interaction.");
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (localState?.ticketId && status) {
      const response: any = await Fetch(
        "/api/support/tickets/" + localState?.ticketId + "/" + status
      );
      if (response?.success && response?.message === "updated")
        setState(response);
      else toast.warn(response?.message);
    }
  };

  const showListOfStatus = () => {
    showList(!list);
  };

  const handleAssignManually = async (e: any) => {
    e.preventDefault();
    if (!agentId) return toast.warn("Please select a agent");
    if (localState?.ticketId && agentId) {
      try {
        const resp: any = await Post("/api/support/tickets/manually-assigned", {
          agentId: agentId,
          ticketId: localState?.ticketId,
        });
        if (resp?.success) setState(resp);
      } catch (error) {
        console.log("Error: ", error);
      }
    }
  };

  if (loading && id) return <Loader />;

  return (
    <div className="mt-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center -mt-4 justify-between flex-wrap gap-2">
          <h2 className="text-base text-black font-bold capitalize">
            Ticket ({data?.status?.split("_").join(" ") || "N/A"})
          </h2>
          {data?.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {data.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 text-[11px] font-medium capitalize text-white bg-blue-500 rounded-md"
                >
                  {tag.split("_").join(" ")}
                </span>
              ))}
            </div>
          )}
        </div>
        {!data.assignee && (
          <form onSubmit={handleAssignManually}>
            <select
              required
              onChange={(e) => setAgentId(e.target.value)}
              className="outline-none border border-gray-500 mr-4 p-2 rounded-md"
            >
              <option value="">-- Select Agent --</option>
              {agents &&
                agents.map((agent: any, index: number) => (
                  <option key={index} value={agent._id}>
                    {agent.name}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="bg-[#3D57B0] text-white px-4 py-2 rounded-md"
            >
              + Assign Manually
            </button>
          </form>
        )}
      </div>

      <div className="bg-green-100 p-3 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="text-base font-semibold text-green-900">
            Requester:{" "}
            <span className="font-normal">
              {data?.requester?.fullName || "N/A"}
            </span>
          </h2>
          <p className="text-xs text-green-700">
            Due Date:{" "}
            {data?.dueDate
              ? dayjs(data.dueDate).format("MMM D, YYYY - h:mm A")
              : "Not set"}
          </p>
        </div>

        <div className="mt-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Ticket ID */}
          <div className="text-green-800 font-extrabold uppercase tracking-wide">
            #{data?._id?.slice(-8)}
          </div>

          {/* Issue & Description */}
          <div className="flex-1">
            <p className="text-xs text-green-900 font-semibold">
              Issue:{" "}
              <span className="font-normal capitalize">{data?.title}</span>
            </p>
            <p className="text-xs text-green-800 mt-1">
              {data?.description || "No description provided."}
            </p>
          </div>

          {/* Status + Dropdown */}
          <div className="relative flex items-center gap-2">
            <span className="capitalize text-xs bg-green-600 text-white px-3 py-1 rounded-md font-medium">
              {data?.status?.split("_").join(" ") || "Unknown"}
            </span>
            {userRole === "admin" && data?.status !== "closed" && (
              <button onClick={showListOfStatus}>
                <IoIosArrowDropdownCircle
                  size={22}
                  className="text-green-600 hover:text-green-800 transition"
                />
              </button>
            )}
            {list && userRole !== "admin" && (
              <ul className="absolute z-10 top-9 right-0 mt-1 w-48 rounded-md bg-green-600 text-white shadow-lg overflow-hidden text-xs">
                {ticketStatuses?.map((status: any, index: number) => (
                  <li
                    key={index}
                    onClick={() => handleChangeStatus(status?.value)}
                    className="px-4 py-2 border-b border-white/20 hover:bg-green-500 cursor-pointer transition"
                  >
                    {status?.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data &&
          interaction &&
          interaction.length > 0 &&
          interaction.map((interact: any, index: number) => {
            const isReceiver = interact?.receiverType === "User";
            const sender = isReceiver ? data?.assignee : data?.requester;
            const isCurrentUser = interact?.isSender;
            return (
              <div
                key={interact?.timestamp || index}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[75%] p-2 rounded-xl shadow-sm relative ${isCurrentUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                >
                  {/* Sender Name & Avatar */}
                  <div className="flex items-center gap-2 mb-1">
                    {!isCurrentUser && (
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-medium">
                        {sender?.fullName?.charAt(0)}
                      </div>
                    )}
                    <div className="text-xs font-semibold flex flex-col">
                      <span>
                        {sender?.fullName || sender?.name} {isCurrentUser && "(You)"}
                      </span>
                      <span className="text-[10px] -mt-0.5 font-normal text-gray-500">
                        {dayjs(interact?.timestamp).fromNow()}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs whitespace-pre-wrap">
                    {interact?.content}
                  </p>

                  {/* Optional Action Tag */}
                  {/* {interact?.action && (
                    <div
                      className={`absolute -top-2 text-[10px] font-semibold px-2 py-px rounded-md ${
                        isCurrentUser ? "bg-blue-800" : "bg-gray-300"
                      } text-white right-2`}
                    >
                      {interact?.action}
                    </div>
                  )} */}
                </div>
              </div>
            );
          })}
      </div>

      {data?.status !== "closed" && data.assignee && userRole !== "admin" && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 mt-4 p-1 border border-gray-300 rounded-lg shadow-sm bg-white focus-within:ring-2 focus-within:ring-blue-300"
        >
          <input
            required
            type="text"
            id="message"
            name="message"
            value={message}
            placeholder="Type your message..."
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 hover:scale-110 transition-all text-white px-4 py-2 rounded-md text-xs font-semibold shadow"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default EditHelpDeskUser;
