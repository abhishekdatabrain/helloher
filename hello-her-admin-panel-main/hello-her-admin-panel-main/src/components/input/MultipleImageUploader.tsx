import Image from "next/image";
import { useState, useRef } from "react";
import CircularLoading from "./CircularLoader";
import { Delete, Post, Put } from "@/hooks/apiUtils";
import { IoCloudUpload } from "react-icons/io5";
import { toast } from "react-toastify";

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
  data: any;
  galleryId: any;
  setFormData: any;
  fetchImages?: any;
  hideButton?: boolean;
  maxImages?: number; // Maximum number of images to upload
  uploadButtonText?: string; // Custom upload button text
  uploadBoxMessage?: string; // Custom message for upload box
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  data,
  field,
  galleryId,
  hideButton,
  setFormData,
  fetchImages,
  maxImages = 10,
  uploadButtonText = "Upload Images",
  uploadBoxMessage = `Click to upload images (max ${maxImages})`,
}) => {
  const fieldname = field.name;
  const initialImages =
    field?.value && field?.value.length > 0
      ? field?.value.map((data: any) => ({
          file: null,
          id: data._id,
          url: data.image,
        }))
      : [];

  const [selectedImages, setSelectedImages] =
    useState<ImageData[]>(initialImages);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const remainingSlots = maxImages - selectedImages.length;
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const newImages = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      setSelectedImages((prevImages) => [...prevImages, ...newImages]);

      const updatedFiles = [...selectedImages, ...newImages]
        .map((image) => image.file)
        .filter(Boolean);
      setFormData((prev: any) => ({
        ...prev,
        [fieldname]: updatedFiles,
      }));
    }
  };

  const handleRemoveImage = (url: string) => {
    setSelectedImages((prevImages) =>
      prevImages.filter((image) => image.url !== url)
    );

    const updatedFiles = selectedImages
      .filter((image) => image.url !== url)
      .map((image) => image.file)
      .filter(Boolean);

    setFormData((prev: any) => ({
      ...prev,
      [fieldname]: updatedFiles,
    }));
  };

  const handleRemoveFromServer = async (id: string, url: string) => {
    try {
      await Delete(`/api/image/${id}`);
      handleRemoveImage(url);
    } catch (error) {
      console.log("Error removing image from server:", error);
    }
  };

  const handleUpload = async () => {
    if (uploading || selectedImages.length === 0) return;

    setUploading(true);
    if (!data?.productId) return toast.warn("Select a product!");
    if (!data?.description) return toast.warn("Please add a description");

    try {
      const formData = new FormData();
      selectedImages.forEach((image) => {
        if (image.file) formData.append("images", image.file);
      });
      if (data?.productId) formData.append("productId", data?.productId);
      if (data?.description) formData.append("description", data?.description);
      const response: any = galleryId
        ? await Put("/api/gallery/" + galleryId, formData)
        : await Post("/api/gallery", formData);
      if (response?.success) {
        setSelectedImages([]);
        await fetchImages();
      }
    } catch (error) {
      console.log("Error uploading images:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-4">
      <label
        htmlFor={field.name}
        className="block font-medium text-base text-gray-700"
      >
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/png, image/jpg, image/jpeg, image/webp"
        multiple={field?.multiple}
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />

      {/* Upload Box */}
      <>
        {selectedImages.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${
              selectedImages.length < maxImages
                ? "border-red-300 hover:border-primary"
                : "border-red-500 cursor-not-allowed"
            }`}
          >
            <div className="flex flex-col justify-center items-center h-full text-primary">
              <h2 className="text-black-400 font-bold">
                Files Types We Accept
              </h2>
              <p className="text-primary text-xs py-2">
                JPG, JPEG, PNG (Max file size: 1MB)
              </p>
              <span>
                <IoCloudUpload size={50} className="text-primary" />
              </span>
              <span className="text-primary">
                {selectedImages.length < maxImages
                  ? uploadBoxMessage
                  : `Image limit reached (${maxImages} max)`}
              </span>
            </div>
          </div>
        )}
      </>

      {/* Image Previews */}
      <div className="grid grid-cols-5 gap-5 w-full">
        {selectedImages.map((image: any) => (
          <div key={image.url} className="relative w-full h-36">
            <Image
              width={100}
              height={100}
              src={image.url}
              alt="Selected"
              className="w-full h-full object-cover rounded-lg border border-primary"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (image.url && image._id)
                  return handleRemoveFromServer(image._id, image.url);
                handleRemoveImage(image.url);
              }}
              className="absolute -top-3 -right-3 bg-primary text-white w-7 h-7 flex justify-center items-center rounded-full hover:bg-primary/90"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div className="flex justify-end items-end w-full">
        {selectedImages.length > 0 && !hideButton && (
          <button
            onClick={handleUpload}
            className={`px-6 py-2 text-white rounded-lg transition-all duration-300 ${
              uploading ? "bg-blue-300 cursor-not-allowed" : "bg-primary"
            }`}
            disabled={uploading}
          >
            {uploading ? (
              <span className="flex items-center space-x-2">
                <CircularLoading />
                <span>Uploading...</span>
              </span>
            ) : (
              uploadButtonText
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default MultipleImageUpload;
