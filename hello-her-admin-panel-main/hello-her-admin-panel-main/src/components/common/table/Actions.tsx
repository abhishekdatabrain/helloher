import Modal from "../Modal";
import { useState } from "react";
import { toast } from "react-toastify";
import DataPreview from "./DataPreview";
import { MdRepeat } from "react-icons/md";
import { GrGallery } from "react-icons/gr";
import ReassignModal from "../ReassignModal";
import { endpoints } from "@/data/endpoints";
import { AiOutlineEye } from "react-icons/ai";
import { RiRoadMapLine } from "react-icons/ri";
import { MdBarChart, MdWarning } from "react-icons/md";
import { FaEdit, FaTrash } from "react-icons/fa";
import GalleryUploader from "../GalleryUploader";
import { MdWorkOutline, MdTaskAlt } from "react-icons/md";
import { Delete, Fetch, Patch, Post } from "@/hooks/apiUtils";
import ConfirmationModal from "@/components/crud/ConfirmationModal";
import UserNotificationModal from "@/components/crud/UserNotificationModal";

export enum Status {
  PENDING = "Pending",
  ASSIGNED = "Assigned",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  IN_PROGRESS = "In Progress",
}

interface RowData {
  _id: string;
  name: string;
  status: string;
  assignedTo: any;
}

interface OperationsAllowed {
  update?: boolean;
  delete?: boolean;
  viewStock?: boolean;
}

interface ActionsProps {
  row: RowData;
  type: keyof typeof endpoints;
  setData: (data: any) => void;
  setFilteredData: (data: any) => void;
  setPaginate: (pagination: any) => void;
  operationsAllowed: OperationsAllowed | any;
  setIsModalVisible: (isVisible: boolean) => void;
  onViewStats?: (row: any) => void;
  onManualPenalty?: (row: any) => void;
  additionalParams?: Record<string, any>;
}

const Actions: React.FC<ActionsProps> = ({
  row,
  type,
  setData,
  setPaginate,
  setFilteredData,
  setIsModalVisible,
  operationsAllowed,
  onViewStats,
  onManualPenalty,
  additionalParams,
}) => {
  const [ticketId, setTicketId] = useState("")
  const [viewData, setViewData] = useState<any>({});
  const [notify, setNotifications] = useState<any>({});
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [productImageDetails, setProductImageDetails] = useState<any>({});
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [selectIdForDeletion, setSelectIdForDeletion] = useState<string>("");

  const handleEdit = async (id?: string) => {
    if (!id) return;

    try {
      const endpoint = endpoints[type]?.url;
      if (!endpoint) return;
      const response: any = await Fetch(
        `${endpoint}/${id}`,
        { ...(additionalParams ?? {}) },
        5000,
        true,
        false
      );
      if (
        response?.success &&
        (response?.data?._id || response?.data?.result?._id)
      ) {
        setData(response.data?.result ? response.data?.result : response.data);
      } else setData({});
      setIsModalVisible(true);
    } catch (error) {
      console.log("Handle Edit", error);
    }
  };

  const handleView = async (id?: string) => {
    if (!id) return;

    try {
      const endpoint = endpoints[type]?.url.split("?")[0];
      if (!endpoint) return;
      const response: any = await Fetch(`${endpoint}/${id}`, {}, 5000, true);
      if (
        response?.success &&
        (response?.data?._id || response?.data?.result?._id)
      ) {
        setViewData(response.data?.result ? response.data?.result : response.data);
      } else setViewData({});

      setShowViewModal(true);
    } catch (error) {
      console.log("Handle Edit", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;

    try {
      setSelectIdForDeletion(id);
      if (!showDeleteModal) return setShowDeleteModal(true);

      const deleteEndpoint = endpoints[type]?.url;
      const fetchEndpoint = endpoints[type]?.url;

      if (deleteEndpoint && fetchEndpoint) {
        await Delete(`${deleteEndpoint.split("?")[0]}/${id}`);
        const response: any = await Fetch(fetchEndpoint, { ...(additionalParams ?? {}) }, 5000, true, false);

        if (response?.success) {
          setShowDeleteModal(false);
          setFilteredData(response?.data?.result);
          setPaginate(response?.data?.pagination);
        } else window.location.reload();
      }
    } catch (error) {
      console.log("Handle Delete", error);
    }
  };

  const handleNotification = async (id?: string) => {
    try {
      const url = "/api/user/all/notifications";
      const param = { user: id, page: 1, limit: 10, queryRole: (type as string).toLowerCase() };
      const response: any = await Post(url, param, 5000);
      if (response?.success) setNotifications(response?.data);
    } catch (error) {
      console.log("Notificatons Error: ", error);
    }
  };

  const handleDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleReassign = async (item: any) => {
    if (!item?._id) return;

    const statusMessages: Record<Status, string> = {
      [Status.PENDING]: "Ticket is pending and can be reassigned.",
      [Status.ASSIGNED]: "Ticket has already been assigned.",
      [Status.COMPLETED]: "Ticket has been completed.",
      [Status.CANCELLED]: "Ticket has been cancelled.",
      [Status.IN_PROGRESS]: "Ticket is currently in progress.",
    };

    const status = item.status as Status;
    if (status === Status.PENDING) {
      setTicketId(item._id);
      setShowReassignModal(true);
    } else toast.warn(statusMessages[status] || "Ticket status updated.");
  };

  const handleMark = async (id: string, status: string) => {
    if (!id) return;
    try {
      const url = endpoints[type]?.url + "/" + id + "/update-status";
      await Patch(url, { status });
      const response: any = await Fetch(endpoints[type]?.url, { ...(additionalParams ?? {}) }, 5000, true, false);
      if (response?.success) {
        setFilteredData(response?.data?.result);
        setPaginate(response?.data?.pagination);
      } else window.location.reload();
    } catch (error) {
      console.log("Handle Mark", error);
    }
  };

  const handlePropertyImageDetailsView = async (id?: string) => {
    if (!id) return;
    try {
      const endpoint = endpoints[type]?.url.split("?")[0];
      if (!endpoint) return;
      const response: any = await Fetch(`${endpoint}/${id}`, {}, 5000, true);
      if (response?.success) {
        setProductImageDetails({ propertyId: response?.data?._id });
      } else setProductImageDetails({});
    } catch (error) {
      console.log("Handle Edit", error);
    }
  };

  const handleRoomImageDetailsView = async (id?: string) => {
    if (!id) return;
    try {
      const endpoint = endpoints[type]?.url.split("?")[0];
      if (!endpoint) return;
      const response: any = await Fetch(`${endpoint}/${id}`, {}, 5000, true);
      if (response?.success) {
        setProductImageDetails({ roomId: response?.data?._id });
      } else setProductImageDetails({});
    } catch (error) {
      console.log("Handle Edit", error);
    }
  };

  return (
    <>
      <Modal isVisible={showDeleteModal} onClose={handleDeleteModal}>
        <ConfirmationModal
          id={selectIdForDeletion}
          handleDelete={handleDelete}
          handleDeleteModal={handleDeleteModal}
        />
      </Modal>
      <Modal
        width="w-1/3"
        isVisible={showReassignModal}
        onClose={() => setShowReassignModal(false)}
      >
        <ReassignModal
          type={type}
          ticketId={ticketId}
          setPaginate={setPaginate}
          setFilteredData={setFilteredData}
          onClose={() => setShowReassignModal(false)}
        />
      </Modal>
      <Modal
        width="w-[90%]"
        onClose={() => setProductImageDetails({})}
        isVisible={(productImageDetails?.propertyId || productImageDetails?.roomId) ? true : false}
      >
        <GalleryUploader {...productImageDetails} />
      </Modal>
      <Modal width="w-[90%]" isVisible={showViewModal} onClose={() => setShowViewModal(false)}>
        <DataPreview data={viewData} />
      </Modal>
      <Modal
        hidePadding={true}
        width="w-[90%] lg:w-4/5"
        isVisible={notify?.result?.length > 0}
        onClose={() => setNotifications({})}
      >
        <UserNotificationModal data={notify} />
      </Modal>
      {operationsAllowed?.update && row.status !== "approved" && row.status !== "rejected" && (
        <button
          onClick={() => handleEdit(row._id)}
          className="text-blue-500 text-xs h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-blue-100 p-1 rounded transition"
        >
          <FaEdit title="Edit" />
        </button>
      )}

      {operationsAllowed?.assign && row.status === Status.PENDING && (
        <button
          onClick={() => handleReassign(row)}
          className="text-orange-500 text-base h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-orange-100 p-1 rounded transition"
        >
          <MdRepeat title="Assign HR" />
        </button>
      )}
      {/* Mark as In Progress */}
      {operationsAllowed?.assign && row.status === Status.ASSIGNED && (
        <button
          onClick={() => handleMark(row._id, Status.IN_PROGRESS)}
          className="text-blue-600 text-base h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-blue-100 p-1 rounded transition"
        >
          <MdWorkOutline title="Mark as In Progress" />
        </button>
      )}
      {/* Mark as Completed */}
      {operationsAllowed?.assign && row.status === Status.IN_PROGRESS && (
        <button
          onClick={() => handleMark(row._id, Status.COMPLETED)}
          className="text-green-600 text-base h-fit my-auto hover:scale-125 hover:p-1 hover:bg-green-100 p-1 rounded transition"
        >
          <MdTaskAlt title="Mark as Completed" />
        </button>
      )}
      {operationsAllowed?.hidePreview &&
        <button
          onClick={() => handleView(row._id)}
          className="text-blue-500 text-base h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-blue-100 p-1 rounded transition"
        >
          <AiOutlineEye title="View Information" />
        </button>
      }
      {(type === "ServiceProviders" || type === "Users") && onViewStats && (
        <button
          onClick={() => onViewStats(row)}
          className="text-emerald-500 text-base h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-emerald-100 p-1 rounded transition"
        >
          <MdBarChart title="View Stats" />
        </button>
      )}
      {type === "ServiceProviders" && onManualPenalty && operationsAllowed?.manualPenalty && (
        <button
          onClick={() => onManualPenalty(row)}
          className="text-red-500 text-base h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-red-100 p-1 rounded transition"
        >
          <MdWarning title="Apply Manual Penalty" />
        </button>
      )}
      {operationsAllowed?.viewNotification && (
        <button
          onClick={() => handleNotification(row._id)}
          className="text-green-500 text-base h-fit my-auto hover:scale-125 hover:p-1 mr-1 hover:bg-green-100 p-1 rounded transition"
        >
          <RiRoadMapLine title="View Notification" />
        </button>
      )}
      {type === "Properties" &&
        <button
          onClick={() => handlePropertyImageDetailsView(row._id)}
          className="text-blue-500 text-sm h-fit my-auto hover:scale-125 hover:p-1 hover:bg-blue-100 p-1 rounded transition"
        >
          <GrGallery title="Add Properties Images" />
        </button>
      }
      {type === "Room" &&
        <button
          onClick={() => handleRoomImageDetailsView(row._id)}
          className="text-blue-500 text-sm h-fit my-auto hover:scale-125 hover:p-1 hover:bg-blue-100 p-1 rounded transition"
        >
          <GrGallery title="Add Room Images" />
        </button>
      }
      {operationsAllowed?.delete && (
        <button
          onClick={() => handleDelete(row._id)}
          className="text-red-700 text-xs h-fit my-auto hover:scale-125 hover:p-1 hover:bg-red-100 p-1 rounded transition"
        >
          <FaTrash title="Delete" />
        </button>
      )}
    </>
  );
};

export default Actions;
