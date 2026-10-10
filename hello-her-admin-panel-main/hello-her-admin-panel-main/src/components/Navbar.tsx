"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { includes } from "@/hooks/polyfills";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

import Profile from "./Profile";
import Notification from "./Notification";
import { flattenTabs, tabs } from "@/data/tabs";
import DarkLightToggle from "./DarkLightToggle";
import FullScreenButton from "./FullScreenButton";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { token, isDarkMode } = useAuth();
  const [stateReady, setStateReady] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const list = ["/auth/login", "/login", "/auth", "/no-access"];
    if (pathname && !includes(list, pathname)) {
      localStorage.setItem("pathname", pathname);
    } else {
      localStorage.removeItem("pathname");
    }
  }, [pathname]);

  useEffect(() => {
    setStateReady(true);
    setCurrentDate(dayjs().format("MMM D, YYYY - h:mm A")); // only run on client
  }, []);

  const getCurrentPageTitle = (path: string | null) => {
    const updatedTabs = flattenTabs(tabs);
    const currentTab = updatedTabs.find((tab: any) => tab.href === path)
      ?.pageTitle;
    return currentTab || "Dashboard";
  };

  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const pageTitle = getCurrentPageTitle(pathname);
  const greeting = getGreeting();

  return (
    <>
      {stateReady && token && (
        <nav
          className={`fixed bg-whiteBg w-[90%] md:w-[93%] lg:w-[83%] ml-[10%] md:ml-[7%] lg:ml-[17.1%] z-50 px-2 md:px-4 py-2 text-black`}
        >
          <div className="flex flex-wrap justify-between items-center gap-3">
            {/* Left Side: Page Info + Greeting */}
            <div className="flex flex-col justify-center py-1">
              <h1 className="font-bold text-iconBlack capitalize">
                {pageTitle}
              </h1>
              {currentDate && (
                <span className="text-xs text-iconBlack italic">
                  {greeting}, today&apos;s {currentDate}
                </span>
              )}
            </div>

            {/* Right Side: Actions */}
            <div
              className={`flex items-center gap-2 ${isDarkMode ? "text-iconBlack" : "text-primary"
                }`}
            >
              <Notification />
              <DarkLightToggle />
              <FullScreenButton />
              <Profile />
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
