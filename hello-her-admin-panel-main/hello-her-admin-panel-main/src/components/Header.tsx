"use client";
import React from "react";
import { CgArrowLongRightC } from "react-icons/cg";

interface BreadcrumbProps {
  items: { label: string; href: string }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1 text-xs text-gray-600">
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          <a
            href={item.href}
            className={`${index === 0 && "text-[#8b7eff]"} ${index != 0 && "font-bold"} hover:text-gray-600 hover:underline`}
          >
            {item.label}
          </a>
          {index < items.length - 1 && (
            <span className="mx-1 flex justify-center text-gray-400">
              {" "}
              <CgArrowLongRightC
                size={15}
                className="my-3.5 mx-2 text-[#8b7eff]"
              />
            </span>
          )}
        </span>
      ))}
    </nav>
  );
};

interface HeaderProps {
  title: string;
  breadcrumbItems: { label: string; href: string }[];
}

const Header: React.FC<HeaderProps> = ({ title, breadcrumbItems }) => {
  return (
    <header className="bg-transparent p-4 flex items-center justify-between">
      <div>
        <h1 className="text-base font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
    </header>
  );
};

export default Header;
