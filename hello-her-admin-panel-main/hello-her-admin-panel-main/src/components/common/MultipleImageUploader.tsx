"use client";

import Image from "next/image";
import { toast } from "react-toastify";
import { useState, useRef } from "react";
import { IoCloudUpload } from "react-icons/io5";

interface ImageData {
  url: string;
  file: File | null;
}

interface MultipleImageUploadProps {
  field: {
    value: any;
    name: string;
    label: string;
    required?: boolean;
    multiple?: boolean;
  };
  setFormData: any;
  maxImages?: number;
  uploadButtonText?: string;
  uploadBoxMessage?: string;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  field,
  setFormData,
  maxImages = 5,
  uploadBoxMessage = `Click to upload images (max ${maxImages})`,
}) => {
  const fieldname = field.name;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  console.log(field?.value);

  const initialImages: ImageData[] = Array.isArray(field?.value)
    ? field.value.map((url: any) => ({ url: url?.url, file: null }))
    : [];

  const [selectedImages, setSelectedImages] = useState<ImageData[]>(initialImages);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSizeMB = 1;
    const remainingSlots = maxImages - selectedImages.length;

    const validNewFiles: File[] = [];

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.warn(`Unsupported file type: ${file.name}`);
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.warn(`File too large: ${file.name} (max ${maxSizeMB}MB)`);
        return;
      }
      const alreadySelected = selectedImages.some(
        (img) => img.file?.name === file.name && img.file?.size === file.size
      );
      if (!alreadySelected) validNewFiles.push(file);
    });

    if (validNewFiles.length === 0) return;

    const newImageData: ImageData[] = validNewFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));

    const updatedImages = [...selectedImages, ...newImageData];
    setSelectedImages(updatedImages);
    setFormData((prev: any) => ({
      ...prev,
      [fieldname]: updatedImages.map((img) => img.file || img.url),
    }));
  };

  const handleRemoveImage = async (url: string) => {
    const updated = selectedImages.filter((img) => img.url !== url);
    setSelectedImages(updated);
    setFormData((prev: any) => ({
      ...prev,
      [fieldname]: updated.map((img) => img.file || img.url),
    }));
  };

  return (
    <div className="flex flex-col items-start space-y-4">
      <label htmlFor={fieldname} className="font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple={field?.multiple}
        onChange={handleImageChange}
        accept="image/jpeg,image/png,image/jpg"
      />

      {selectedImages.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex bg-gray-100 flex-col w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 hover:border-gray-500"
        >
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <h2 className="font-bold text-black">Files Types We Accept</h2>
            <p className="text-gray-600 text-xs py-2">
              JPG, JPEG, PNG (Max file size: 1MB)
            </p>
            <IoCloudUpload size={50} className="text-gray-500" />
            <span>{uploadBoxMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 w-full gap-5">
        {selectedImages.map((image) => (
          <div key={image.url} className="relative h-36">
            <Image
              width={100}
              height={100}
              src={image.url}
              alt="Selected"
              className="w-full h-full object-cover rounded-lg border border-primary"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage(image.url);
              }}
              className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 flex justify-center items-center aspect-square rounded-full p-1 hover:bg-primary/90 transition-all duration-200"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultipleImageUpload;
