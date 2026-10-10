import React, { FC } from "react";
import { formatDate } from "@/hooks/general";

interface DateProps {
  field: {
    name: string;
    label: string;
    value?: string;
    currentDate?: any;
    required?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    defaultValue?: string; // ISO format (YYYY-MM-DD) is generally used for dates
    minDate?: string; // Minimum date in YYYY-MM-DD format
    maxDate?: string; // Maximum date in YYYY-MM-DD format
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Date: FC<DateProps> = ({ field, handleInputChange, className }) => {
  return (
    <div className="relative">
      <label
        htmlFor={field.name}
        className="block font-medium text-gray-700 mb-2"
      >
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        id={field.name}
        name={field.name}
        min={field.minDate}
        max={field.maxDate}
        required={field.required}
        disabled={field.isDisabled}
        onChange={handleInputChange}
        placeholder={field.placeholder}
        value={
          field?.value
            ? formatDate(field.value)
            : field.currentDate
              ? field.currentDate
              : ""
        }
        className={`border border-gray-300 text-black placeholder:text-gray-400 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};

export default Date;
