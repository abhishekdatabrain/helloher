"use client";

import CircularLoading from "./CircularLoading";
import { IoCloudUpload } from "react-icons/io5";
import { useState, useRef, useEffect } from "react";

const VideoUpload: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Ensures that URL.createObjectURL only runs in the browser environment
    if (typeof window === "undefined") {
      return;
    }
  }, []);

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === "undefined") return;

    const file = event.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveVideo = () => {
    if (typeof window === "undefined") return;

    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const handleUpload = () => {
    if (!selectedVideo || typeof window === "undefined") return;

    setUploading(true);

    // Simulate an upload process
    setTimeout(() => {
      alert("Video uploaded successfully!");
      setUploading(false);
      setSelectedVideo(null); // Clear video after upload
      setVideoPreview(null); // Clear preview after upload
    }, 2000);
  };

  if (typeof window === "undefined") {
    return null; // Ensure component only renders on the client
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        ref={fileInputRef}
        className="hidden"
      />

      {/* Upload Box */}
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative flex flex-col justify-start w-72 h-40 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors duration-300"
      >
        {videoPreview ? (
          <>
            <video
              src={videoPreview}
              controls
              className="w-full h-full p-2 object-cover rounded-lg"
            />
            {/* Cross Button to Remove Image */}
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

      {/* Upload Button */}
      {selectedVideo && (
        <button
          onClick={handleUpload}
          className={`px-6 py-2 w-fit text-white rounded-lg transition-all duration-300 ${
            uploading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex items-center space-x-2">
              <CircularLoading />
              <span>Uploading...</span>
            </span>
          ) : (
            "Upload Video"
          )}
        </button>
      )}
    </div>
  );
};

export default VideoUpload;
