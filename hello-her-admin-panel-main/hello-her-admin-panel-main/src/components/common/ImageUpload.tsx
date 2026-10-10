"use cient";

import Image from "next/image";
import { toast } from "react-toastify";
import { useState, useRef } from "react";
import { IoCloudUpload } from "react-icons/io5";

const ImageUpload = ({
  data,
  setState,
  fieldname,
}: {
  data: any;
  setState: any;
  fieldname?: any;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    data ?? null
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeInBytes = 1024 * 1024;
      if (file.size > maxSizeInBytes)
        return toast.warn(
          `File size exceeds 1 MB. Please select a smaller file and try again.`
        );

      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type))
        return toast.warn(
          `Invalid file type. Please select a PNG, JPG, or JPEG image.`
        );

      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      const obj = {};
      if (fieldname) Object.assign(obj, { [fieldname]: file });
      else Object.assign(obj, { imageUrl: file });

      setState((prev: any) => ({ ...prev, ...obj }));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
  };

  return (
    <div className="flex flex-col justify-start items-center space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative flex flex-col justify-start w-full h-44 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors duration-300"
      >
        {selectedImage ? (
          <>
            <Image
              priority
              width={200}
              height={100}
              alt="Selected"
              src={selectedImage}
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering file input
                handleRemoveImage();
              }}
              className="absolute -top-3 -right-3 bg-primary text-white w-7 h-7 hover:w-8 hover:h-8 hover:-top-4 hover:-right-4 flex justify-center items-center aspect-square rounded-full p-1 hover:bg-primary/90 transition-all duration-200 ease-linear"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <span>
              <IoCloudUpload size={50} className="text-primary" />
            </span>
            <span className="text-primary">Click to upload an image</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
