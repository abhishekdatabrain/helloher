import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useReactToPrint } from "react-to-print";
import React, { useRef, useState, useCallback, ReactNode } from "react";
import {
  FiX,
  FiEye,
  FiMail,
  FiImage,
  FiShare2,
  FiPrinter,
  FiFileText,
  FiSettings,
  FiMaximize,
  FiMinimize,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import Modal from "./Modal";
import { toast } from "react-toastify";
// import AdvancedQRGenerator from "./AdvancedQRGenerator";

interface PrintComponentProps {
  scale?: number;
  margin?: number;
  quality?: number;
  fileName?: string;
  className?: string;
  children?: ReactNode;
  orientation?: "portrait" | "landscape";
  pageSize?: "A4" | "A3" | "Letter" | "Legal";
  targetRef?: React.RefObject<HTMLDivElement>;
}

interface PrintSettings {
  scale: number;
  margin: number;
  quality: number;
  optimizeForPrint: boolean;
  includeBackground: boolean;
  orientation: "portrait" | "landscape";
  pageSize: "A4" | "A3" | "Letter" | "Legal";
}

const AdvancedPrintComponent: React.FC<PrintComponentProps> = ({
  children,
  scale = 1,
  margin = 20,
  quality = 2,
  className = "",
  pageSize = "A4",
  fileName = "document",
  targetRef: externalRef,
  orientation = "portrait",
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const targetRef = externalRef || internalRef;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.75);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [settings, setSettings] = useState<PrintSettings>({
    pageSize,
    orientation,
    margin,
    scale,
    quality,
    includeBackground: true,
    optimizeForPrint: true,
  });

  // Page dimensions in mm
  const pageDimensions = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
  };

  const getCurrentPageSize = () => {
    const dims = pageDimensions[settings.pageSize];
    return settings.orientation === "landscape"
      ? { width: dims.height, height: dims.width }
      : dims;
  };

  // Enhanced print styles with proper page breaks
  const printStyles = `
        @page {
            size: ${settings.pageSize} ${settings.orientation};
            margin: ${settings.margin}mm;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 0; 
                -webkit-print-color-adjust: ${
                  settings.includeBackground ? "exact" : "economy"
                };
                color-adjust: ${
                  settings.includeBackground ? "exact" : "economy"
                };
            }
            
            .print-content {
                transform: scale(${settings.scale});
                transform-origin: top left;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .page-break {
                page-break-before: always;
                break-before: page;
            }
            
            .avoid-break {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            table {
                page-break-inside: auto;
                break-inside: auto;
            }
            
            tr {
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: auto;
                break-after: auto;
            }
            
            thead {
                display: table-header-group;
            }
            
            tfoot {
                display: table-footer-group;
            }
            
            .no-print {
                display: none !important;
            }
            
            ${
              settings.optimizeForPrint
                ? `
                * {
                    box-shadow: none !important;
                    text-shadow: none !important;
                }
                
                .bg-gradient-to-r,
                .bg-gradient-to-l,
                .bg-gradient-to-t,
                .bg-gradient-to-b {
                    background: #f8f9fa !important;
                }
            `
                : ""
            }
        }
        
        .print-preview {
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
            transform-origin: top center;
        }
        
        .print-page {
            background: white;
            padding: ${settings.margin}mm;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }
    `;

  const handlePrint = useReactToPrint({
    contentRef: targetRef,
    documentTitle: fileName,
    pageStyle: printStyles,
    // onBeforeGetContent: () => {
    //   setIsLoading(true);
    //   setLoadingProgress(25);
    // },
    onBeforePrint: async () => {
      setLoadingProgress(75);
    },
    onAfterPrint: () => {
      setIsLoading(false);
      setLoadingProgress(0);
    },
  });

  const simulateProgress = useCallback((targetProgress: number) => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 2;
      });
    }, 50);
  }, []);

  const downloadAsPDF = async () => {
    if (!targetRef.current) return;

    setIsLoading(true);
    setLoadingProgress(0);
    simulateProgress(30);

    try {
      const pageSize = getCurrentPageSize();
      const canvas = await html2canvas(targetRef.current, {
        scale: settings.quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: settings.includeBackground ? null : "#ffffff",
        width: targetRef.current.scrollWidth,
        height: targetRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("[data-print-target]");
          if (clonedElement) {
            (clonedElement as any).style.transform = `scale(${settings.scale})`;
          }
        },
      });

      simulateProgress(70);

      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: "mm",
        format: settings.pageSize.toLowerCase() as any,
      });

      const pdfWidth = pageSize.width - settings.margin * 2;
      const pdfHeight = pageSize.height - settings.margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Convert pixels to mm (1 pixel = 0.264583 mm at 96 DPI)
      const pixelToMm = 0.264583;
      const imgWidthMm = imgWidth * pixelToMm;
      const imgHeightMm = imgHeight * pixelToMm;

      // Calculate scaling to fit width
      const widthRatio = pdfWidth / imgWidthMm;
      const finalWidth = imgWidthMm * widthRatio;
      const finalHeight = imgHeightMm * widthRatio;

      // Calculate how many pages we need
      const pageContentHeight = pdfHeight;
      const totalPages = Math.ceil(finalHeight / pageContentHeight);

      // Center horizontally
      const x = (pageSize.width - finalWidth) / 2;

      // Add pages and split content
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        // Calculate the portion of the image to show on this page
        const sourceY = (pageNum * pageContentHeight) / widthRatio / pixelToMm;
        const sourceHeight = Math.min(
          pageContentHeight / widthRatio / pixelToMm,
          imgHeight - sourceY
        );

        // Create a cropped canvas for this page
        const tempCanvas = document.createElement("canvas");
        const tempCtx: any = tempCanvas.getContext("2d");

        tempCanvas.width = imgWidth;
        tempCanvas.height = sourceHeight;

        // Draw the portion of the original canvas onto the temp canvas
        const img = new Image();
        img.onload = () => {
          tempCtx.drawImage(
            img,
            0,
            sourceY,
            imgWidth,
            sourceHeight, // Source rectangle
            0,
            0,
            imgWidth,
            sourceHeight // Destination rectangle
          );
        };

        // For synchronous operation, we'll use a different approach
        // Draw directly from canvas instead of image
        tempCtx.drawImage(
          canvas,
          0,
          sourceY,
          imgWidth,
          sourceHeight, // Source rectangle
          0,
          0,
          imgWidth,
          sourceHeight // Destination rectangle
        );

        const pageImgData = tempCanvas.toDataURL("image/png");
        const pageHeight = sourceHeight * pixelToMm * widthRatio;

        pdf.addImage(
          pageImgData,
          "PNG",
          x,
          settings.margin,
          finalWidth,
          pageHeight
        );
      }

      simulateProgress(95);
      pdf.save(`${fileName}.pdf`);

      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 500);
    } catch (error) {
      console.error("PDF generation failed:", error);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const downloadAsImage = async (
    format: "png" | "webp" | "jpeg" | "avif" | "gif" | "bmp" | "tiff" = "png"
  ) => {
    if (!targetRef.current) return;

    setIsLoading(true);
    setLoadingProgress(0);
    simulateProgress(50);

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: settings.quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: settings.includeBackground ? null : "#ffffff",
      });

      simulateProgress(80);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.${format}`;
            a.click();
            URL.revokeObjectURL(url);

            setLoadingProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              setLoadingProgress(0);
            }, 500);
          }
        },
        `image/${format}`,
        0.95
      );
    } catch (error) {
      console.error("Image generation failed:", error);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const generatePreview = () => {
    setShowPreview(true);
  };

  const PreviewModal = () => {
    if (!showPreview) return null;

    return (
      <Modal
        hideCross
        hidePadding
        width="w-4/5"
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
      >
        <div className="bg-white rounded-lg w-full flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-infobg">
            <h3 className="text-lg font-semibold text-iconBlack flex items-center space-x-2">
              <FiEye className="w-5 h-5" />
              <span>Print Preview</span>
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setPreviewScale((prev) => Math.max(0.2, prev - 0.1))
                  }
                  className="p-1 text-gray-500 hover:text-iconBlack transition-colors"
                >
                  <FiMinimize className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  onClick={() =>
                    setPreviewScale((prev) => Math.min(2, prev + 0.1))
                  }
                  className="p-1 text-gray-500 hover:text-iconBlack transition-colors"
                >
                  <FiMaximize className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-500 hover:text-iconBlack transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-gray-100">
            <div
              ref={previewRef}
              className="print-preview"
              style={{
                width: `${getCurrentPageSize().width}mm`,
                minHeight: `${getCurrentPageSize().height}mm`,
                transform: `scale(${previewScale})`,
                transformOrigin: "top center",
              }}
            >
              <div
                className="print-page"
                data-print-target
                dangerouslySetInnerHTML={{
                  __html: targetRef.current?.innerHTML || "",
                }}
              />
            </div>
          </div>

          {/* Preview Actions */}
          <div className="flex items-center justify-between p-4 border-t border-infobg bg-gray-50">
            <div className="text-sm text-gray-600">
              Page Size: {settings.pageSize} ({settings.orientation})
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiPrinter className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  const SettingsModal = () => {
    if (!showSettings) return null;

    return (
      <Modal
        hideCross
        hidePadding
        width="w-1/3"
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
      >
        <div className="bg-white rounded-lg w-full p-4 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-iconBlack">
              Print Settings
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 text-gray-500 hover:text-iconBlack transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-black">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-iconBlack mb-1">
                  Page Size
                </label>
                <select
                  value={settings.pageSize}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      pageSize: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-iconBlack mb-1">
                  Orientation
                </label>
                <select
                  value={settings.orientation}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      orientation: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-iconBlack mb-1">
                  Margin (mm)
                </label>
                <input
                  type="number"
                  value={settings.margin}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      margin: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-iconBlack mb-1">
                  Scale
                </label>
                <input
                  type="number"
                  value={settings.scale}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scale: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  max="2"
                  min="0.5"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-iconBlack mb-1">
                Quality (for exports)
              </label>
              <input
                type="range"
                value={settings.quality}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    quality: Number(e.target.value),
                  }))
                }
                className="w-full"
                min="1"
                max="4"
                step="0.5"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includeBackground}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      includeBackground: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-iconBlack">
                  Include backgrounds
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.optimizeForPrint}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      optimizeForPrint: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-iconBlack">
                  Optimize for printing
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-iconBlack bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <Modal
        hidePadding
        isVisible={isLoading}
        onClose={() => setIsLoading(false)}
      >
        <div className="bg-white rounded-lg p-8 w-96 mx-4">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-iconBlack mb-2">
              Processing...
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{loadingProgress}% complete</p>
          </div>
        </div>
      </Modal>
    );
  };

  const handleShare = async () => {
    if (!targetRef.current) return;

    try {
      const canvas = await html2canvas(targetRef.current);
      const blob: any = await new Promise((resolve) => canvas.toBlob(resolve));
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: fileName,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard!");
      }
    } catch (error) {
      console.log("Share failed:", error);
    }
  };

  const sendViaEmail = async () => {
    if (!targetRef.current) return;

    try {
      // const canvas = await html2canvas(targetRef.current);
      // const imageData = canvas.toDataURL("image/png");

      const emailBody = `
      Please find the attached document.
      
      Document: ${fileName}
      Generated: ${new Date().toLocaleString()}
      
      [Attachment: ${fileName}.png]
    `;

      const mailtoLink = `mailto:?subject=${encodeURIComponent(
        fileName
      )}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;

      // Or integrate with email service
      // await emailService.send({ attachment: imageData, fileName });
    } catch (error) {
      console.error("Email export failed:", error);
    }
  };

  return (
    <>
      {/* <AdvancedQRGenerator /> */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className={`print-component ${className}`}>
        {/* Content to print */}
        {children && (
          <div ref={internalRef} className="print-content" data-print-target>
            {children}
          </div>
        )}

        {/* Control Panel */}
        <div className="no-print bg-whiteBg rounded-2xl mb-3">
          <div className="flex p-4 border-b border-infobg items-center justify-between">
            <h3 className="font-semibold italic text-iconBlack flex items-center space-x-2">
              <FiPrinter className="w-5 h-5" />
              <span>Print & Export Options</span>
            </h3>

            {/* Toggle Button */}
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-infobg rounded-md transition"
            >
              <span>Options</span>
              {isOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>

          {isOpen && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
                {/* Preview Button */}
                <button
                  onClick={generatePreview}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                >
                  <FiEye className="w-5 h-5" />
                  <span>Preview</span>
                </button>

                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                >
                  <FiPrinter className="w-5 h-5" />
                  <span>Print</span>
                </button>

                {/* PDF Download */}
                <button
                  onClick={downloadAsPDF}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                >
                  <FiFileText className="w-5 h-5" />
                  <span>PDF</span>
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(true)}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                >
                  <FiSettings className="w-5 h-5" />
                  <span>Settings</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                >
                  <FiShare2 className="w-5 h-5" />
                  <span>Share</span>
                </button>

                {/* Email Export */}
                <button
                  onClick={sendViaEmail}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform shadow-lg hover:shadow-xl"
                >
                  <FiMail className="w-5 h-5" />
                  <span>Email</span>
                </button>
              </div>

              {/* Export Options */}
              <div className="mt-4 pt-2 border-t border-infobg">
                <h4 className="text-sm font-semibold text-iconBlack mb-3">
                  Export as Image
                </h4>
                <div className="flex flex-wrap gap-2">
                  {/* PNG */}
                  <button
                    onClick={() => downloadAsImage("png")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>PNG</span>
                  </button>

                  {/* JPEG */}
                  <button
                    onClick={() => downloadAsImage("jpeg")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>JPEG</span>
                  </button>

                  {/* WEBP */}
                  <button
                    onClick={() => downloadAsImage("webp")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>WEBP</span>
                  </button>

                  {/* GIF */}
                  <button
                    onClick={() => downloadAsImage("gif")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>GIF</span>
                  </button>

                  {/* TIFF */}
                  <button
                    onClick={() => downloadAsImage("tiff")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>TIFF</span>
                  </button>

                  {/* BMP */}
                  <button
                    onClick={() => downloadAsImage("bmp")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>BMP</span>
                  </button>

                  {/* AVIF */}
                  <button
                    onClick={() => downloadAsImage("avif")}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiImage className="w-4 h-4" />
                    <span>AVIF</span>
                  </button>
                </div>
              </div>

              {/* Current Settings Display */}
              <div className="mt-4 p-3 bg-infobg rounded-md">
                <div className="text-xs text-iconBlack flex flex-wrap gap-3 justify-between">
                  <div>Size: {settings.pageSize}</div>
                  <div>Margin: {settings.margin}mm</div>
                  <div>Scale: {Math.round(settings.scale * 100)}%</div>
                  <div>Quality: {settings.quality}x</div>
                  <div>Orientation: {settings.orientation}</div>
                  <div>Background: {settings.includeBackground.toString()}</div>
                  <div>Optimized: {settings.optimizeForPrint.toString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PreviewModal />
      <SettingsModal />
      <LoadingOverlay />
    </>
  );
};

export default AdvancedPrintComponent;
