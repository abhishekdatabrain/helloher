"use client";

import { AiOutlineWarning } from "react-icons/ai";

const ConfirmationModal = ({
  id,
  handleDelete,
  handleDeleteModal,
}: {
  id: any;
  handleDeleteModal: () => void;
  handleDelete: (id: any) => void;
}) => {
  return (
    <div className="px-8 py-4 w-full flex flex-col items-center text-center">
      <div className="bg-red-100 text-red-600 p-4 rounded-full">
        <AiOutlineWarning className="text-5xl" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 py-3">
        Are you sure you want to delete this item?
      </h2>
      <p className="text-xs text-gray-600">
        This action cannot be undone. All related data will be permanently
        removed.
      </p>

      <div className="flex w-full justify-center gap-4 mt-4">
        <button
          onClick={() => handleDelete(id)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
        >
          Yes, Delete
        </button>
        <button
          onClick={handleDeleteModal}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded-lg transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
