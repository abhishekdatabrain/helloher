"use client";

import dynamic from "next/dynamic";
import { useRef, useMemo } from "react";

// Dynamically import JoditEditor with SSR disabled
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const RichTextEditor = ({ data, setData }: { data: any; setData: any }) => {
  const editorRef = useRef(null);
  const options = [
    "bold",
    "italic",
    "|",
    "ul",
    "ol",
    "|",
    "font",
    "fontsize",
    "|",
    "outdent",
    "indent",
    "align",
    "|",
    "hr",
    "|",
    "fullsize",
    "brush",
    "|",
    "table",
    "link",
    "|",
    "undo",
    "redo",
  ];

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "",
      defaultActionOnPaste: "insert_as_html",
      defaultLineHeight: 1.5,
      enter: "div",
      buttons: options,
      buttonsMD: options,
      buttonsSM: options,
      buttonsXS: options,
      statusbar: false,
      sizeLG: 2000,
      sizeMD: 700,
      sizeSM: 400,
      toolbarAdaptive: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (typeof window === "undefined") {
    return null; // Ensure component only renders on the client
  }

  return (
    <div className="w-full">
      <label
        htmlFor={"content"}
        className="block font-medium text-gray-700 mb-2"
      >
        Blog Content
        {<span className="text-red-500">*</span>}
      </label>
      <JoditEditor
        ref={editorRef}
        value={data}
        {...config}
        onChange={(htmlString: any) =>
          setData((prev: any) => ({ ...prev, content: htmlString }))
        }
      />
    </div>
  );
};

export default RichTextEditor;
