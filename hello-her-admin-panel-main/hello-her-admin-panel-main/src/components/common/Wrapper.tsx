"use client";

import Link from "next/link";

const Wrapper = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="bg-infobg pt-[64px] ml-[10%] md:ml-[7%] lg:ml-[17.1%]">
      <div className="p-1 md:p-3 md:pb-3 min-h-screen flex-1 backdrop-blur-md">
        {children}
      </div>
      <footer className="text-xs text-iconBlack bg-whiteBg py-4 px-4 flex flex-wrap justify-center items-center gap-1 text-center">
        <span>© {new Date().getFullYear()} </span>
        <strong className="text-iconBlack">Hello Her</strong>
        <span>. Designed with ❤️ by</span>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.wayone.co.in"
          className="underline text-cyan-500 font-medium"
        >
          WayOne
        </Link>
        <span>. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default Wrapper;
