import React, { FC, useState } from "react";

interface ToggleButtonProps {
  setState: any;
  keyUpdate?: any;
  field: {
    value?: any;
    name: string;
    label: string;
    required?: boolean;
  };
}

const ToggleButton: FC<ToggleButtonProps> = ({
  field,
  setState,
  keyUpdate,
}) => {
  const [active, setActive] = useState<boolean>(
    field.value === "active" || field.value === true ? true : false
  );

  const handleClick = () => {
    const newActiveState = !active;
    setActive(newActiveState);
    const value = newActiveState ? "active" : "inactive";
    if (keyUpdate) {
      setState(value);
    } else if (field?.name) {
      setState((prev: Record<string, string>) => ({
        ...prev,
        [field.name]: value,
      }));
    }
  };

  return (
    <div className="flex flex-col w-full">
      <label
        htmlFor={field.name}
        className="block font-medium text-gray-700 mb-3"
      >
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-5 items-center">
        <span className="font-semibold text-black">Inactive</span>
        <button
          type="button"
          onClick={handleClick}
          className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 ${
            active ? "bg-cyan-500" : "bg-red-600"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
              active ? "translate-x-8" : "translate-x-0"
            }`}
          ></span>
        </button>
        <span className="font-semibold text-black">Active</span>
      </div>
    </div>
  );
};

export default ToggleButton;
