"use client";

import { AiOutlineWarning } from "react-icons/ai";

const LogoutModal = ({
  handleDelete,
  handleDeleteModal,
}: {
  handleDelete: () => void;
  handleDeleteModal: () => void;
}) => {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
      {/* Icon */}
      <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-3">
        <AiOutlineWarning className="text-5xl" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Confirm Sign Out
      </h2>

      {/* Subtext */}
      <p className="text-sm text-gray-600 mb-4 px-2">
        You&apos;re about to log out of your account. Any unsaved changes may be
        lost. You will be redirected to the login page.
      </p>

      {/* Action Buttons */}
      <div className="flex w-full justify-center gap-4 mt-2">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
        >
          Yes, Log Me Out
        </button>
        <button
          onClick={handleDeleteModal}
          className="bg-gray-200 hover:bg-gray-700 text-gray-500 hover:text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  );
};

export default LogoutModal;
