import React, { useState } from "react";
import { MdOutlineFullscreen, MdOutlineFullscreenExit } from "react-icons/md";

const FullScreenButton = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const enterFullScreen = () => {
    const element = document.documentElement; // Target the entire page
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen(); // Safari
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen(); // IE/Edge
    }
    setIsFullScreen(true);
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen(); // Safari
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen(); // IE/Edge
    }
    setIsFullScreen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex space-x-2">
        {!isFullScreen ? (
          <MdOutlineFullscreen
            onClick={enterFullScreen}
            className="cursor-pointer text-4xl"
            title="Enter Full Screen"
          />
        ) : (
          <MdOutlineFullscreenExit
            onClick={exitFullScreen}
            className="cursor-pointer text-4xl"
            title="Exit Full Screen"
          />
        )}
      </div>
    </div>
  );
};

export default FullScreenButton;
