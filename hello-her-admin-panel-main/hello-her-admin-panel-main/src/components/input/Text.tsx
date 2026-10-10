import React, { FC } from "react";

interface TextProps {
  field: {
    name?: string;
    label?: string;
    value?: string;
    required?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    defaultValue?: string;
    disabled?: boolean;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Text: FC<TextProps> = ({ field, handleInputChange, className }) => {
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
        type="text"
        id={field.name}
        name={field.name}
        value={field?.value}
        required={field.required}
        disabled={field.isDisabled}
        placeholder={field.placeholder}
        onChange={handleInputChange}
        className={`border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 text-black placeholder:text-gray-400 focus:ring-blue-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};

export default Text;
