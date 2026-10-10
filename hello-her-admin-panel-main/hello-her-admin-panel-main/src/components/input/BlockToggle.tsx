import React, { FC, useState, useEffect } from "react";
import { AiOutlineLock, AiOutlineUnlock } from "react-icons/ai";

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

const ToggleButton: FC<ToggleButtonProps> = ({ field, setState, keyUpdate }) => {
  const [blocked, setBlocked] = useState<boolean>(
    field.value === true || field.value === "blocked" ? true : false
  );

  useEffect(() => {
    setBlocked(field.value === true || field.value === "blocked");
  }, [field.value]);

  const handleClick = () => {
    const newState = !blocked;
    setBlocked(newState);

    const value = newState ? true : false; // true = blocked, false = active/unblocked

    if (keyUpdate) {
      setState(value);
    } else if (field?.name) {
      setState((prev: Record<string, any>) => ({
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

      <div className="flex gap-3 items-center">
        {/* Unblocked */}
        <div className="flex items-center gap-1">
          <span className="font-semibold text-black">Unblocked</span>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={handleClick}
          className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 ${
            blocked ? "bg-red-600" : "bg-green-500"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white flex items-center justify-center text-black transition-transform duration-300 ${
              blocked ? "translate-x-8" : "translate-x-0"
            }`}
          >
            {blocked ? <AiOutlineLock /> : <AiOutlineUnlock />}
          </span>
        </button>

        {/* Blocked */}
        <div className="flex items-center gap-1">
          <span className="font-semibold text-black">Blocked</span>
        </div>
      </div>
    </div>
  );
};

export default ToggleButton;
