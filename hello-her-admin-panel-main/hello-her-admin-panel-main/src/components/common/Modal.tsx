"use client";

import ReactDOM from "react-dom";
import { RxCross1 } from "react-icons/rx";

interface ModalProps {
  width?: string;
  isVisible: boolean;
  hideCross?: boolean;
  onClose: () => void;
  hidePadding?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  width = "max-w-4/5",
  isVisible,
  onClose,
  children,
  hidePadding,
  hideCross = false,
}) => {
  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black backdrop-blur-md bg-opacity-50"></div>
      <div
        className={`bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-xl z-10 relative ${width}`}
      >
        <div className="bg-white relative overflow-scroll no-scrollbar max-h-[90vh] rounded-xl">
          {!hideCross && (
            <div className="absolute top-2 right-2 z-30">
              <RxCross1
                size={24}
                className="cursor-pointer text-primary"
                onClick={onClose}
              />
            </div>
          )}
          <div
            onClick={(e) => e.stopPropagation()}
            className={hidePadding ? "" : "p-4"}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default Modal;
