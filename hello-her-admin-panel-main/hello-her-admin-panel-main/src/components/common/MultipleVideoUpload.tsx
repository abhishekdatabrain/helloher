"use client";
import { IoCloudUpload } from "react-icons/io5";
import CircularLoading from "./CircularLoading";
import { useState, useRef, useEffect } from "react";

interface VideoData {
  url: string;
  file: File;
}

const MultipleVideoUpload: React.FC = () => {
  const [selectedVideos, setSelectedVideos] = useState<VideoData[]>([]);
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

    const files = event.target.files;
    if (files) {
      // Calculate remaining slots
      const remainingSlots = 5 - selectedVideos.length;
      const newFiles = Array.from(files).slice(0, remainingSlots); // Only add files that fit within the limit
      const newVideos = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      setSelectedVideos((prevVideos) => [...prevVideos, ...newVideos]);
    }
  };

  const handleRemoveVideo = (url: string) => {
    if (typeof window === "undefined") return;

    setSelectedVideos((prevVideos) =>
      prevVideos.filter((video) => video.url !== url),
    );
  };

  const handleUpload = () => {
    if (selectedVideos.length === 0 || typeof window === "undefined") return;

    setUploading(true);

    // Simulate an upload process
    setTimeout(() => {
      alert("Videos uploaded successfully!");
      setUploading(false);
      setSelectedVideos([]); // Clear videos after upload
    }, 2000);
  };

  if (typeof window === "undefined") {
    return null; // Ensure component only renders on the client
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        accept="video/*"
        multiple
        onChange={handleVideoChange}
        ref={fileInputRef}
        className="hidden"
      />
      {/* Upload Box */}
      <div
        onClick={() =>
          selectedVideos.length < 5 && fileInputRef.current?.click()
        }
        className={`flex flex-col w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
          selectedVideos.length < 5
            ? "border-primary/50 hover:border-primary"
            : "border-red-500 cursor-not-allowed hidden"
        }`}
      >
        <div className="flex flex-col justify-center items-center h-full text-gray-500">
          <span>
            <IoCloudUpload size={50} className="text-primary" />
          </span>
          <span className="text-primary">
            {selectedVideos.length < 5
              ? "Click to upload videos (max 5)"
              : "Video limit reached (5 max)"}
          </span>
        </div>
      </div>
      {/* video Previews */}
      <div className="grid grid-cols-5 gap-5">
        {selectedVideos.map((video) => (
          <div key={video.url} className="relative h-36">
            <video
              src={video.url}
              controls
              className="w-full h-full object-cover rounded-lg"
            />
            {/* Cross Button to Remove Image */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering file input
                handleRemoveVideo(video.url);
              }}
              className="absolute -top-3 -right-3 bg-primary text-white w-7 h-7 hover:w-8 hover:h-8 hover:-top-4 hover:-right-4 flex justify-center items-center aspect-square rounded-full p-1 hover:bg-primary/90 transition-all duration-200 ease-linear"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {/* Upload Button */}
      <div className="flex justify-end items-end w-full">
        {selectedVideos.length > 0 && (
          <button
            onClick={handleUpload}
            className={`px-6 py-2 text-white rounded-lg transition-all duration-300 ${
              uploading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={uploading}
          >
            {uploading ? (
              <span className="flex items-center space-x-2">
                <CircularLoading /> <span>Uploading...</span>
              </span>
            ) : (
              "Upload Videos"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default MultipleVideoUpload;
