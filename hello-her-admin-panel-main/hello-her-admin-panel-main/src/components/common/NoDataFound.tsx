import Image from "next/image";
import { debounce } from "@/hooks/general";
import { FaFilter } from "react-icons/fa";

interface NoDataFoundProps {
  type: string;
  handleAdd: () => void;
  handleReset: () => void;
  operationsAllowed: {
    create?: boolean;
    [key: string]: boolean | undefined;
  };
}

const NoDataFound: React.FC<NoDataFoundProps> = ({
  type,
  handleAdd,
  handleReset,
  operationsAllowed,
}) => {
  return (
    <div className="flex gap-5 justify-between font-semibold">
      {/* Image Section */}
      <div className="w-full flex flex-col justify-center items-center">
        <Image
          src="/assets/error/Illustration.png"
          alt="No Data Found"
          priority
          width={100}
          height={100}
          unoptimized
          className="w-full h-full object-contain"
        />
      </div>

      {/* Button Section */}
      <div className="flex space-x-2">
        {/* Clear Filters Button */}
        <button
          type="button"
          onClick={debounce(handleReset, 1000)}
          className="bg-white text-primary border h-fit flex gap-2 justify-center items-center border-primary outline-none px-2 py-1.5 rounded-md hover:bg-primary hover:text-white"
        >
          Clear&nbsp;filters <FaFilter />
        </button>

        {/* Add Button */}
        {operationsAllowed?.create && (
          <button
            type="button"
            onClick={handleAdd}
            className="bg-primary whitespace-nowrap text-white px-4 h-fit py-2 rounded-md"
          >
            Add&nbsp;{type}
            <sup>+</sup>
          </button>
        )}
      </div>
    </div>
  );
};

export default NoDataFound;
