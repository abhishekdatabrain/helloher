"use client";

const ToggleButton = ({
  setState,
  data,
  formkey,
}: {
  setState: any;
  formkey?: any;
  data: any;
}) => {
  const handleClick = () => {
    if (formkey) {
      setState((prev: any) => ({ ...prev, [formkey]: !data }));
    } else setState((prev: any) => ({ ...prev, isActive: !data }));
  };
  return (
    <div className="flex justify-start items-center space-x-2">
      <span className="text-red-500 font-semibold">Inactive</span>
      <button
        type="button"
        onClick={handleClick}
        className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 ${
          data ? "bg-cyan-500" : "bg-red-600"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
            data ? "translate-x-8" : "translate-x-0"
          }`}
        ></span>
      </button>
      <span className="text-cyan-500 font-semibold">Active</span>
    </div>
  );
};

export default ToggleButton;
