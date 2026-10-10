"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import SidebarMobile from "./SidebarMobile";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { RiArrowDropDownLine } from "react-icons/ri";
import { combineParentTabs, flattenTabs, tabs } from "@/data/tabs";

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, token, isDarkMode } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [list, showList] = useState<any>({ tab: "", list: [] });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !token) return null;

  let filteredTabs: any = [];
  const flattend = flattenTabs(tabs);
  const userPermissions = user?.role?.permissions;
  if (userPermissions && userPermissions.length > 0) {
    filteredTabs = flattend.filter((tab) =>
      userPermissions.some(
        (permission: any) =>
          permission?.module === tab.permission && permission?.access?.read
      )
    );
  }
  filteredTabs = combineParentTabs(filteredTabs);

  return (
    <>
      <SidebarMobile filteredTabs={filteredTabs} />
      <div
        className={`hidden lg:block fixed w-[17.1%] text-white bg-primary h-full overflow-y-scroll no-scrollbar`}
      >
        <div className="flex justify-center bg-primary-color mt-2 border-r-2 border-primary z-10 w-full items-center sticky top-0">
          <Image
            priority
            alt="Icon"
            width={200}
            unoptimized
            height={100}
            src={isDarkMode ? "/assets/logo/logo-white.png" : "/assets/logo/logo.png"}
          />
        </div>
        <nav className="flex flex-col gap-1 mt-4 mb-40">
          {filteredTabs.map((tab: any, index: number) => {
            const Icon = tab.icon;
            return (
              <React.Fragment key={index}>
                <motion.div
                  initial={{ x: -200 }}
                  animate={{ x: 0 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                    type: "spring",
                  }}
                >
                  <div
                    onClick={() => {
                      if (
                        list?.list.length > 0 &&
                        list?.tab === tab?.permission
                      ) {
                        return showList({ tab: "", list: [] });
                      }
                      if (tab?.tabs && tab?.tabs.length > 0) {
                        showList({ tab: tab?.permission, list: tab?.tabs });
                      } else {
                        // Only navigate if it's not a dropdown
                        window.location.href = tab?.href;
                      }
                    }}
                    className={`py-2 pl-2 mr-auto w-[90%] mx-auto rounded-lg text-xs pr-2 cursor-pointer transition flex justify-between gap-2 items-center border-primary hover:bg-infobg hover:text-iconBlack ${pathname === tab?.href
                      ? "bg-infobg text-iconBlack font-semibold"
                      : "text-white"
                      }`}
                  >
                    <Link
                      href={tab?.href}
                      aria-label={tab?.label}
                      className="flex gap-2 text-[11px] items-center flex-1"
                      onClick={(e) => {
                        if (tab?.tabs && tab?.tabs.length > 0) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <span className="flex gap-2 text-[11px] items-center">
                        <Icon size={16} /> {tab?.label}
                      </span>
                    </Link>
                    {tab?.tabs?.length > 0 && <RiArrowDropDownLine size={18} />}
                  </div>
                </motion.div>
                {list?.tab === tab?.permission && (
                  <div
                    onMouseEnter={() =>
                      showList({ tab: tab?.permission, list: tab?.tabs })
                    }
                    className="flex flex-col space-y-1 py-1 w-full bg-secondary"
                  >
                    {list?.list?.map((tabChild: any, index2: number) => {
                      const Icon = tabChild.icon;
                      return (
                        <Link
                          key={index2}
                          href={tabChild?.href}
                          aria-label={tabChild?.label}
                          className={`w-[80%] mx-auto rounded-full text-[10px] pl-6 gap-2 py-2 flex items-center hover:bg-white hover:text-primary ${tabChild?.href === pathname
                            ? "bg-infobg text-iconBlack"
                            : "text-white bg-secondary"
                            }`}
                        >
                          <Icon size={14} /> {tabChild?.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
