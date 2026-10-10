import {
  IoMailOutline,
  IoLogOutOutline,
  IoPersonCircleSharp,
} from "react-icons/io5";
import { useState } from "react";
import Modal from "./common/Modal";
import LogoutModal from "./crud/LogoutModal";
import { FaUserShield } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { MdOutlineArrowDropDown } from "react-icons/md";

const Profile = () => {
  const { user, logout, isDarkMode } = useAuth();
  const [logoutModal, setLogoutModal] = useState(false);

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="group relative inline-block">
      {/* Trigger Button */}
      <Modal isVisible={logoutModal} onClose={() => setLogoutModal(false)}>
        <LogoutModal
          handleDelete={logout}
          handleDeleteModal={() => setLogoutModal(false)}
        />
      </Modal>
      <button
        className={`flex items-center gap-2 p-0.5 rounded-full ${isDarkMode ? "bg-iconBlack" : "bg-primary"
          } text-white text-xs font-semibold`}
      >
        <span
          className={`w-6 h-6 flex justify-center items-center rounded-full bg-white ${isDarkMode ? "text-iconBlack" : "text-primary"
            } font-bold text-sm`}
        >
          {getInitial(user?.username || "Admin")}
        </span>
        <MdOutlineArrowDropDown className="text-lg" />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-0.5 w-60 overflow-hidden rounded-xl shadow-xl border border-gray-200 ${isDarkMode ? "bg-primary" : "bg-white"
          } z-50 hidden group-hover:block transition-all duration-200 ease-in-out`}
      >
        {/* Top Info */}
        <div className="border-b border-gray-100 text-iconBlack p-2">
          <div className="flex gap-2">
            <IoPersonCircleSharp className="text-3xl text-iconBlack" />
            <div className="text-left space-y-1">
              <p className="text-sm font-semibold">{user?.username}</p>
              <p className="text-xs flex items-center gap-1">
                <IoMailOutline className="text-sm" /> {user?.email}
              </p>
              <p className="text-[11px] flex items-center gap-1">
                <FaUserShield className="text-xs" /> {user?.role?.name?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="overflow-hidden">
          <button
            onClick={() => setLogoutModal(true)}
            className="flex items-center w-full gap-3 px-4 py-2 text-sm text-left text-red-600 font-bold hover:bg-gray-200 transition-colors"
          >
            <IoLogOutOutline className="text-lg text-red-600" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
