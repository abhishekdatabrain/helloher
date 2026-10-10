"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import {
  RiCloseLine,
  RiMenuFoldLine,
  RiArrowDropDownLine,
} from "react-icons/ri";
import Image from "next/image";

const SidebarMobile = ({ filteredTabs }: { filteredTabs: any }) => {
  const { token } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [list, showList] = useState<any>({ tab: "", list: [] });

  // Ensure hydration-safe behavior
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        showList({ tab: "", list: [] });
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!hasMounted || !token) return null;

  return (
    <div className="lg:hidden fixed z-[100] w-[10%] md:w-[7%] h-full">
      {/* Icon Sidebar */}
      <div className="flex flex-col bg-primary h-full text-white items-center py-4 gap-2">
        {filteredTabs.map((tab: any, idx: number) => {
          const Icon = tab.icon;
          return (
            <button
              key={idx}
              title={tab.label}
              onClick={() => setIsOpen(true)}
              className="text-white hover:text-secondary hover:bg-white transition-all duration-300 rounded-lg p-2"
            >
              <Icon size={20} />
            </button>
          );
        })}
        <button
          onClick={() => setIsOpen(true)}
          className="text-white mt-auto text-xs"
        >
          <RiMenuFoldLine size={22} />
        </button>
      </div>

      {/* Full Sidebar Drawer */}
      {isOpen && (
        <div
          ref={sidebarRef}
          className="fixed top-0 left-0 h-full w-64 bg-primary text-white z-50 shadow-lg overflow-y-auto transition-all duration-300"
        >
          <div className="flex justify-between items-center px-4 pt-3 border-b border-secondary">
            <div className="flex justify-center bg-whiteBg border-r-2 border-primary z-10 w-full items-center sticky top-0">
              <Image
                priority
                alt="Icon"
                width={200}
                unoptimized
                height={100}
                src={"/assets/logo/logo.png"}
              />
            </div>
            <button onClick={() => setIsOpen(false)}>
              <RiCloseLine size={22} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 py-4">
            {filteredTabs.map((tab: any, index: number) => {
              const Icon = tab.icon;
              const isOpenTab = list.tab === tab.permission;
              return (
                <div key={index}>
                  <Link
                    href={tab?.href}
                    onClick={() => {
                      if (isOpenTab) {
                        return showList({ tab: "", list: [] });
                      }
                      if (tab?.tabs && tab?.tabs.length > 0) {
                        showList({ tab: tab?.permission, list: tab?.tabs });
                      }
                    }}
                    className={`py-2.5 pl-2 mr-auto w-[90%] mx-auto rounded-xl text-xs pr-2 cursor-pointer transition flex justify-between gap-2 items-center border-primary hover:bg-white hover:text-primary ${pathname === tab?.href
                      ? "bg-white text-primary font-semibold"
                      : "text-white"
                      }`}
                    aria-label={tab?.label}
                  >
                    <span className="flex gap-2 text-xs items-center">
                      <Icon size={16} /> {tab?.label}
                    </span>
                    {tab?.tabs?.length > 0 && (
                      <RiArrowDropDownLine size={23} className="w-fit" />
                    )}
                  </Link>

                  {/* Child Tabs */}
                  {isOpenTab &&
                    list.list.map((child: any, idx: number) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={idx}
                          href={child.href}
                          className={`pl-8 py-1.5 text-xs flex items-center gap-2 ${pathname === child.href
                            ? "text-white font-medium"
                            : "text-info hover:text-white"
                            }`}
                        >
                          <ChildIcon size={12} />
                          {child.label}
                        </Link>
                      );
                    })}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};

export default SidebarMobile;
