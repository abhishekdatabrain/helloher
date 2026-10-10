import React from "react";

interface DropdownOption {
  id: string | number;
  value: string | number;
  name: string;
}

interface CustomDropdownProps {
  label?: string;
  placeholder?: string;
  hideDropdown?: boolean;
  options: DropdownOption[];
  selectedValue: string | number;
  onChange: (value: string | number) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  onChange,
  selectedValue,
  label = "Status",
  hideDropdown = false,
  placeholder = "Select a option...",
}) => {
  if (hideDropdown) return null;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-iconBlack font-medium">{label}:</label>}
      <select
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        className="border px-4 text-base py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-iconBlack bg-whiteBg border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CustomDropdown;
