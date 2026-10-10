import React, { FC } from "react";

interface NumberProps {
  field: {
    min?: number;
    max?: number;
    name: string;
    label: string;
    value?: number;
    required?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    defaultValue?: number;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Number: FC<NumberProps> = ({ field, handleInputChange, className }) => {
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
        type="number"
        id={field.name}
        min={field.min}
        max={field.max}
        name={field.name}
        value={field.value ?? 0}
        required={field.required}
        disabled={field.isDisabled}
        onChange={handleInputChange}
        placeholder={field.placeholder}
        defaultValue={field.defaultValue}
        className={`border border-gray-300 rounded-lg p-2 w-full text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};

export default Number;
