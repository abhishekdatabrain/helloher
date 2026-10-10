import Modal from "./Modal";
import Image from "next/image";
import { useEffect, useState } from "react";

const ImageViewModal = ({
  imageUrl,
  isModalVisible,
  setIsModalVisible,
}: {
  imageUrl: string;
  isModalVisible: boolean;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const closeModal = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (isModalVisible) {
      document.body.style.overflow = "hidden"; // prevent overflow
    } else document.body.style.overflow = "scroll";
  }, [isModalVisible]);

  return (
    <Modal isVisible={isModalVisible} onClose={closeModal}>
      <div className="bg-white p-4 relative rounded-xl overflow-scroll hide-scrollbar flex flex-col justify-center items-center text-center">
        <button
          type="button"
          onClick={closeModal}
          title="Close image viewer"
          className="absolute z-50 cursor-pointer text-black text-base top-2 right-3 font-bold"
        >
          ✕
        </button>
        {isLoading && (
          <div className="w-full max-h-[80vh] flex text-base text-primary justify-center items-center">
            <div className="py-10">Please wait Loading...</div>
          </div>
        )}
        <div className={`mt-4 max-h-[80vh] ${isLoading ? "hidden" : ""}`}>
          {imageUrl && (
            <Image
              priority
              width={100}
              height={100}
              unoptimized
              src={imageUrl}
              alt="sent image"
              className="object-cover w-full h-full"
              onLoadingComplete={() => setIsLoading(false)} // Hide loader when image is loaded
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImageViewModal;
