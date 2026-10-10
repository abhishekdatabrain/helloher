"use client";

import {
  AiOutlineWarning,
  AiOutlineCheck,
  AiOutlineClose,
} from "react-icons/ai";

const ConfirmModal = ({
  data,
  onClose,
  handleAction,
}: {
  data: any;
  onClose: () => void;
  handleAction: (data: any) => void;
}) => {
  return (
    <div className="w-full text-center flex flex-col items-center gap-4">
      <div className="text-yellow-500 text-6xl">
        <AiOutlineWarning />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">
        Are you sure you want to continue?
      </h2>
      <p className="text-gray-500 w-2/3 mx-auto">
        This action might be irreversible. Please confirm if you really want to
        proceed.
      </p>

      <div className="flex justify-center gap-4 w-full mt-5">
        <button
          onClick={() => handleAction(data)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
        >
          <AiOutlineCheck className="text-base" />
          Confirm
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
        >
          <AiOutlineClose className="text-base" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
