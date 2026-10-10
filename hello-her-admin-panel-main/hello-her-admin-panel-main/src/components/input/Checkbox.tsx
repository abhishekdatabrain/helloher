import React, { FC } from "react";

interface CheckboxOption {
  label: string;
  value: string;
}

interface CheckboxProps {
  field: {
    name?: string;
    options?: any;
    label?: string;
    required?: boolean;
    isDisabled?: boolean;
    inline?: boolean; // Determines if checkboxes are displayed inline or stacked
    defaultValues?: string[]; // Pre-selected values
  };
  className?: string;
  handleInputChange: any;
}

const Checkbox: FC<CheckboxProps> = ({
  field,
  handleInputChange,
  className,
}) => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    field.defaultValues || [],
  );

  const handleCheckboxChange = (value: string) => {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(updatedValues);
    handleInputChange(updatedValues);
  };

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
          field.options.map((option: CheckboxOption) => (
            <label
              key={option.value}
              className="flex items-center text-gray-700"
            >
              <input
                type="checkbox"
                name={field.name}
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => handleCheckboxChange(option.value)}
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

export default Checkbox;
