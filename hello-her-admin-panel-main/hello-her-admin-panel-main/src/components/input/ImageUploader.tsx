"use client";

import Image from "next/image";
import { toast } from "react-toastify";
import { Patch } from "@/hooks/apiUtils";
import { IoCloudUpload } from "react-icons/io5";
import React, { FC, useState, useRef } from "react";
import { formatCompactNumber } from "@/hooks/general";

interface SingleImageUploaderProps {
  field: {
    name: string;
    label: string;
    value?: string;
    required?: boolean;
  };
  setFormData: (newState: any) => void; // Function to update parent state
}

const SingleImageUploader: FC<SingleImageUploaderProps> = ({
  field,
  setFormData,
}) => {
  const fieldname = field?.name;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    field.value ?? null
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const maxSizeInBytes = 1024 * 1024 * 5; // 5 MB
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];

      if (file.size > maxSizeInBytes) {
        return toast.warn(
          "File size exceeds 5 MB. Please select a smaller file." + formatCompactNumber(file.size / 1024)
        );
      }

      if (!validTypes.includes(file.type)) {
        return toast.warn(
          "Invalid file type. Please select a PNG, JPG, or JPEG image."
        );
      }

      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      const obj = fieldname ? { [fieldname]: file } : { imageUrl: file };
      setFormData((prev: any) => ({ ...prev, ...obj }));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
    // Clear the state in the parent component
    const obj = fieldname ? { [fieldname]: null } : { imageUrl: null };
    setFormData((prev: any) => ({ ...prev, ...obj }));
  };

  const deleteSelectedImages = async (folderName: string, fileName: string) => {
    try {
      if (!fileName || !folderName) return toast.warn("Something went wrong!");
      await Patch("/api/product/image", {
        folderId: folderName,
        filename: fileName,
      });
    } catch (error) {
      console.log("Failed to Delete images: " + error);
    }
  };

  const deleteImageOnHover = async (image: string) => {
    const parts = new URL(image).pathname.split("/").filter(Boolean);
    const folder = parts[parts.length - 2];
    const filename = parts[parts.length - 1];
    await deleteSelectedImages(folder, filename);
  };

  return (
    <div className="flex flex-col justify-start space-y-2">
      <label
        htmlFor={field.name}
        className="block font-medium text-base text-gray-700"
      >
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col justify-start w-full bg-white h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition ${selectedImage ? "border-primary" : "border-gray-300"
          }`}
      >
        {selectedImage ? (
          <>
            <Image
              width={100}
              height={100}
              alt="Selected"
              src={selectedImage}
              className="w-full h-full object-cover rounded-xl p-1"
            />
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering file input
                if (
                  selectedImage.includes("upload") &&
                  field.name === "coverImage"
                ) {
                  handleRemoveImage();
                  deleteImageOnHover(selectedImage);
                } else handleRemoveImage();
              }}
              className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 flex justify-center items-center aspect-square rounded-full p-1 hover:bg-primary transition-all duration-200 ease-linear"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-gray-600">
            <h2 className="text-black-400 font-bold">Files Types We Accept</h2>
            <p className="text-gray-600 text-xs py-2">
              JPG, JPEG, PNG (Max file size: 5MB)
            </p>
            <span>
              <IoCloudUpload size={50} className="text-gray-500" />
            </span>
            <span className="text-gray-700">Click to upload</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleImageUploader;
