"use client";

import { toast } from "react-toastify";
import { IoCloudUpload } from "react-icons/io5";
import React, { FC, useState, useRef } from "react";

interface SingleVideoUploaderProps {
  field: {
    name: string;
    label: string;
    required?: boolean;
  };
  setFormData: (newState: any) => void; // Function to update parent state
}

const SingleVideoUploader: FC<SingleVideoUploaderProps> = ({
  field,
  setFormData,
}) => {
  const fieldname = field?.name;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const maxSizeInBytes = 1024 * 1024 * 5; // 5 MB
      const validTypes = ["video/mp4", "video/webm", "video/ogg"]; // Acceptable video types

      if (file.size > maxSizeInBytes) {
        return toast.warn(
          "File size exceeds 5 MB. Please select a smaller file.",
        );
      }

      if (!validTypes.includes(file.type)) {
        return toast.warn(
          "Invalid file type. Please select an MP4, WEBM, or OGG video.",
        );
      }

      const videoUrl = URL.createObjectURL(file);
      setSelectedVideo(videoUrl);

      const obj = fieldname ? { [fieldname]: file } : { videoUrl: file };
      setFormData((prev: any) => ({ ...prev, ...obj }));
    }
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
    // Clear the state in the parent component
    const obj = fieldname ? { [fieldname]: null } : { videoUrl: null };
    setFormData((prev: any) => ({ ...prev, ...obj }));
  };

  return (
    <div className="flex flex-col justify-start space-y-4">
      <label htmlFor={field.name} className="block font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        ref={fileInputRef}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative flex flex-col justify-start w-64 h-36 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors duration-300"
      >
        {selectedVideo ? (
          <>
            <video
              controls
              className="w-full h-full object-contain rounded-lg"
              src={selectedVideo}
            />
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering file input
                handleRemoveVideo();
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
            <span className="text-primary">Click to upload a video</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleVideoUploader;
