"use client";

import React from "react";
// import dynamic from "next/dynamic";

// Dynamically import ReactPlayer to avoid SSR hydration mismatch and reduce initial bundle size
// const ReactPlayer = dynamic(() => import("react-player"), {
//   ssr: false,
//   loading: () => <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-md" />
// });

// const Player: any = ReactPlayer;

const HLSPlayer = ({ url }: { url: string }) => {
  // return (
  //   <div className="rounded-md overflow-hidden bg-black p-1 shadow-sm border" style={{ width: "240px", height: "48px" }}>
  //     <Player
  //       url={url}
  //       controls
  //       width="100%"
  //       height="100%"
  //       config={{
  //         file: {
  //           forceHLS: true,
  //           attributes: {
  //             controlsList: "nodownload",
  //           },
  //         },
  //       } as any}
  //       style={{ borderRadius: "4px", backgroundColor: "black" }}
  //     />
  //   </div>
  // );
  return (
    <audio
      controls
      style={{ width: "240px" }}
      controlsList="nodownload"
    >
      <source src={url} type="application/x-mpegURL" />
      Your browser does not support the audio element.
    </audio>
  );
};

export default HLSPlayer;
