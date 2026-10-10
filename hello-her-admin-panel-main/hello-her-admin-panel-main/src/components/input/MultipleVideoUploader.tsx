import { useState, useRef } from "react";
import { IoCloudUpload } from "react-icons/io5";

interface VideoData {
  url: string;
  file: File;
}

interface MultipleVideoUploadProps {
  field: {
    name: string;
    label: string;
    required?: boolean;
    multiple?: boolean;
  };
  setFormData: any;
  maxVideos?: number; // Maximum number of videos to upload
  uploadBoxMessage?: string; // Custom message for upload box
}

const MultipleVideoUpload: React.FC<MultipleVideoUploadProps> = ({
  field,
  setFormData,
  maxVideos = 5,
  uploadBoxMessage = `Click to upload videos (max ${maxVideos})`,
}) => {
  const fieldname = field.name;
  const [selectedVideos, setSelectedVideos] = useState<VideoData[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const remainingSlots = maxVideos - selectedVideos.length;
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const newVideos = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      setSelectedVideos((prevVideos) => [...prevVideos, ...newVideos]);
      const obj = fieldname
        ? { [fieldname]: [...selectedVideos, ...newVideos] }
        : { videoUrl: newVideos };
      setFormData((prev: any) => ({ ...prev, ...obj }));
    }
  };

  const handleRemoveVideo = (url: string) => {
    setSelectedVideos((prevVideos) =>
      prevVideos.filter((video) => video.url !== url),
    );
    const obj = {
      [fieldname]: selectedVideos.filter((video: any) => video.url !== url),
    };
    setFormData((prev: any) => ({ ...prev, ...obj }));
  };

  return (
    <div className="flex flex-col items-start space-y-4">
      <label htmlFor={field.name} className="block font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      {/* Hidden File Input */}
      <input
        type="file"
        accept="video/*"
        multiple={field?.multiple}
        onChange={handleVideoChange}
        ref={fileInputRef}
        className="hidden"
      />

      {/* Upload Box */}
      <div
        onClick={() =>
          selectedVideos.length < maxVideos && fileInputRef.current?.click()
        }
        className={`flex flex-col w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
          selectedVideos.length < maxVideos
            ? "border-primary/50 hover:border-primary"
            : "border-red-500 cursor-not-allowed"
        }`}
      >
        <div className="flex flex-col justify-center items-center h-full text-gray-500">
          <span>
            <IoCloudUpload size={50} className="text-primary" />
          </span>
          <span className="text-primary">
            {selectedVideos.length < maxVideos
              ? uploadBoxMessage
              : `Video limit reached (${maxVideos} max)`}
          </span>
        </div>
      </div>

      {/* Video Previews */}
      <div className="grid grid-cols-5 gap-5">
        {selectedVideos.map((video) => (
          <div key={video.url} className="relative h-36">
            <video
              src={video.url}
              controls
              className="w-full h-full object-contain rounded-lg border border-primary"
            />
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
    </div>
  );
};

export default MultipleVideoUpload;
