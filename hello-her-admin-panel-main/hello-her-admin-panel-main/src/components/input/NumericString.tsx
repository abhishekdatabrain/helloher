import React, { FC } from "react";

interface NumericStringInputProps {
  field: {
    name: string;
    label: string;
    value?: string;
    required?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    maxLength?: number; // Maximum length for the input
    defaultValue?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const NumericStringInput: FC<NumericStringInputProps> = ({
  field,
  handleInputChange,
  className,
}) => {
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
        inputMode="numeric"
        value={field?.value}
        required={field.required}
        disabled={field.isDisabled}
        placeholder={field.placeholder}
        defaultValue={field.defaultValue}
        onChange={(e) => {
          const inputValue = e.target.value;
          if (
            /^[0-9]*$/.test(inputValue) &&
            (!field.maxLength || inputValue.length <= field.maxLength)
          ) {
            handleInputChange(e);
          }
        }}
        maxLength={field.maxLength}
        className={`border border-gray-300 rounded-lg p-2 w-full text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      />
    </div>
  );
};

export default NumericStringInput;
