import React, { FC } from "react";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioProps {
  field: {
    name?: string;
    options?: any;
    label?: string;
    inline?: boolean;
    required?: boolean;
    isDisabled?: boolean;
    defaultValue?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Radio: FC<RadioProps> = ({ field, handleInputChange, className }) => {
  return (
    <div className={`relative ${className}`}>
      <label className="block font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      <div
        className={field.inline ? "flex space-x-4" : "flex flex-col space-y-2"}
      >
        {field.options &&
          field.options.length > 0 &&
          field.options.map((option: RadioOption) => (
            <label
              key={option.value}
              className="flex items-center text-gray-700"
            >
              <input
                type="radio"
                name={field.name}
                value={option.value}
                defaultChecked={field.defaultValue === option.value}
                onChange={handleInputChange}
                disabled={field.isDisabled}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
      </div>
    </div>
  );
};

export default Radio;
