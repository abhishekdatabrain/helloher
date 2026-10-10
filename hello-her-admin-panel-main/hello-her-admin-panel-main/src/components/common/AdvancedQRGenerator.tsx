import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  FiX,
  FiEye,
  FiCopy,
  FiWifi,
  FiMail,
  FiUser,
  FiGlobe,
  FiPhone,
  FiImage,
  FiShare2,
  FiMapPin,
  FiSettings,
  FiCalendar,
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiSmartphone,
  FiCreditCard,
} from "react-icons/fi";
import Image from "next/image";
import { toast } from "react-toastify";

type QRType =
  | "url"
  | "sms"
  | "text"
  | "wifi"
  | "email"
  | "phone"
  | "vcard"
  | "location"
  | "calendar"
  | "payment";

interface QRTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
}

interface FormData {
  phone: { number: string };
  sms: { number: string; message: string };
  email: { to: string; subject: string; body: string };
  wifi: {
    ssid: string;
    hidden: boolean;
    password: string;
    security: "WPA" | "WEP" | "nopass";
  };
  vcard: {
    note: string;
    title: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    lastName: string;
    firstName: string;
    organization: string;
  };
  location: { latitude: string; longitude: string; query: string };
  calendar: {
    title: string;
    endDate: string;
    endTime: string;
    location: string;
    startDate: string;
    startTime: string;
    description: string;
  };
  payment: {
    label: string;
    amount: string;
    address: string;
    message: string;
    type: "bitcoin" | "ethereum" | "paypal";
  };
}

interface Settings {
  size: number;
  margin: number;
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  logoSize: number;
  gradient: boolean;
  quietZone: boolean;
  gradientEnd: string;
  gradientStart: string;
  style: "squares" | "dots";
  errorCorrection: "L" | "M" | "Q" | "H";
}

const AdvancedQRGenerator = () => {
  const [qrData, setQrData] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [qrType, setQrType] = useState<QRType>("text");
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analytics, setAnalytics] = useState({ scans: 0, generated: 0 });

  const [settings, setSettings] = useState<Settings>({
    size: 256,
    margin: 4,
    logoUrl: "",
    logoSize: 0.15,
    quietZone: true,
    gradient: false,
    style: "squares",
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    errorCorrection: "M",
    gradientEnd: "#764ba2",
    gradientStart: "#667eea",
  });

  const [formData, setFormData] = useState<FormData>({
    phone: { number: "" },
    sms: { number: "", message: "" },
    email: { to: "", subject: "", body: "" },
    wifi: { ssid: "", password: "", security: "WPA", hidden: false },
    vcard: {
      note: "",
      title: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      lastName: "",
      firstName: "",
      organization: "",
    },
    location: { latitude: "", longitude: "", query: "" },
    calendar: {
      title: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    },
    payment: {
      type: "bitcoin",
      address: "",
      amount: "",
      label: "",
      message: "",
    },
  });

  const qrTypes: Record<QRType, QRTypeConfig> = {
    text: {
      icon: FiFileText,
      label: "Plain Text",
      placeholder: "Enter your text here...",
    },
    url: {
      icon: FiGlobe,
      label: "Website URL",
      placeholder: "https://example.com",
    },
    email: {
      icon: FiMail,
      label: "Email",
      placeholder: "recipient@example.com",
    },
    phone: { icon: FiPhone, label: "Phone Number", placeholder: "+1234567890" },
    sms: {
      icon: FiSmartphone,
      label: "SMS Message",
      placeholder: "Phone number and message",
    },
    wifi: {
      icon: FiWifi,
      label: "WiFi Network",
      placeholder: "Network credentials",
    },
    vcard: {
      icon: FiUser,
      label: "Contact Card",
      placeholder: "Contact information",
    },
    location: {
      icon: FiMapPin,
      label: "Location",
      placeholder: "Latitude, Longitude",
    },
    calendar: {
      icon: FiCalendar,
      label: "Calendar Event",
      placeholder: "Event details",
    },
    payment: {
      icon: FiCreditCard,
      label: "Payment",
      placeholder: "Payment information",
    },
  };

  const formatQRData = (): string => {
    switch (qrType) {
      case "text":
        return qrData;

      case "url":
        return qrData.startsWith("http") ? qrData : `https://${qrData}`;

      case "email":
        const { to, subject, body } = formData.email;
        return `mailto:${to}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;

      case "phone":
        return `tel:${formData.phone.number}`;

      case "sms":
        return `sms:${formData.sms.number}?body=${encodeURIComponent(
          formData.sms.message
        )}`;

      case "wifi":
        const { ssid, password, security, hidden } = formData.wifi;
        return `WIFI:T:${security};S:${ssid};P:${password};H:${
          hidden ? "true" : "false"
        };;`;

      case "vcard":
        const v = formData.vcard;
        return `BEGIN:VCARD
VERSION:3.0
FN:${v.firstName} ${v.lastName}
ORG:${v.organization}
TITLE:${v.title}
TEL:${v.phone}
EMAIL:${v.email}
URL:${v.website}
ADR:;;${v.address};;;;
NOTE:${v.note}
END:VCARD`;

      case "location":
        const { latitude, longitude, query } = formData.location;
        return query
          ? `geo:0,0?q=${encodeURIComponent(query)}`
          : `geo:${latitude},${longitude}`;

      case "calendar":
        const c = formData.calendar;
        const startDateTime = `${c.startDate}T${c.startTime}:00`;
        const endDateTime = `${c.endDate}T${c.endTime}:00`;
        return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${c.title}
DESCRIPTION:${c.description}
LOCATION:${c.location}
DTSTART:${startDateTime.replace(/[-:]/g, "")}
DTEND:${endDateTime.replace(/[-:]/g, "")}
END:VEVENT
END:VCALENDAR`;

      case "payment":
        const p = formData.payment;
        if (p.type === "bitcoin") {
          return `bitcoin:${p.address}?amount=${
            p.amount
          }&label=${encodeURIComponent(p.label)}&message=${encodeURIComponent(
            p.message
          )}`;
        }
        return p.address;

      default:
        return qrData;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setSettings((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview("");
    setSettings((prev) => ({ ...prev, logoUrl: "" }));
  };

  const downloadQR = (format: "png" | "svg" | "jpeg" = "png") => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL(`image/${format}`);
    link.download = `qrcode.${format}`;
    link.click();
    toast.success(`QR code downloaded as ${format.toUpperCase()}`);
  };

  const copyToClipboard = async () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve)
      );
      if (!blob) throw new Error("Failed to create blob");

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast.success("QR code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy QR code");
    }
  };

  const shareQR = async () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve)
      );
      if (!blob) throw new Error("Failed to create blob");

      const file = new File([blob], "qrcode.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "QR Code",
          text: "Check out this QR code I generated!",
          files: [file],
        });
      } else {
        copyToClipboard();
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast.error("Sharing not supported or failed");
    }
  };

  const renderForm = () => {
    switch (qrType) {
      case "text":
      case "url":
        return (
          <textarea
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder={qrTypes[qrType].placeholder}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[120px]"
          />
        );

      case "email":
        return (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Recipient email"
              value={formData.email.to}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email: { ...prev.email, to: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Subject"
              value={formData.email.subject}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email: { ...prev.email, subject: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Email body"
              value={formData.email.body}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email: { ...prev.email, body: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[100px]"
            />
          </div>
        );

      case "wifi":
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Network Name (SSID)"
              value={formData.wifi.ssid}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  wifi: { ...prev.wifi, ssid: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.wifi.password}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  wifi: { ...prev.wifi, password: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.wifi.security}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wifi: {
                      ...prev.wifi,
                      security: e.target.value as "WPA" | "WEP" | "nopass",
                    },
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open Network</option>
              </select>
              <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.wifi.hidden}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wifi: { ...prev.wifi, hidden: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Hidden Network</span>
              </label>
            </div>
          </div>
        );

      case "vcard":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={formData.vcard.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vcard: { ...prev.vcard, firstName: e.target.value },
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.vcard.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vcard: { ...prev.vcard, lastName: e.target.value },
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Organization"
              value={formData.vcard.organization}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, organization: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.vcard.email}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, email: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.vcard.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  vcard: { ...prev.vcard, phone: e.target.value },
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder={qrTypes[qrType]?.placeholder || "Enter data..."}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  const generatedData = formatQRData();

  return (
    <div className="bg-whiteBg p-4 rounded-2xl mb-3">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-iconBlack mb-2">
          Advanced QR Generator
        </h1>
        <p className="text-gray-600">
          Create professional QR codes for any purpose
        </p>
        <div className="flex justify-center space-x-4 mt-4 text-sm text-gray-500">
          <span>Generated: {analytics.generated}</span>
          <span>•</span>
          <span>Scanned: {analytics.scans}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel - Generator */}
        <div className="space-y-4">
          {/* QR Type Selection */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">QR Code Type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(qrTypes).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  onClick={() => {
                    setQrType(key as QRType);
                    setAnalytics((prev) => ({
                      ...prev,
                      generated: prev.generated + 1,
                    }));
                  }}
                  className={`p-2 md:p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-1 text-sm ${
                    qrType === key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Input */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Enter Data</h3>
            {renderForm()}
          </div>

          {/* Advanced Settings */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiSettings className="w-5 h-5 mr-2" />
              Styling Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="16"
                  value={settings.size}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      size: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>128px</span>
                  <span>{settings.size}px</span>
                  <span>512px</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Error Correction
                </label>
                <select
                  value={settings.errorCorrection}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      errorCorrection: e.target.value as "L" | "M" | "Q" | "H",
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Foreground Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.fgColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        fgColor: e.target.value,
                      }))
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm">{settings.fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.bgColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bgColor: e.target.value,
                      }))
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm">{settings.bgColor}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Logo</label>
                {logoPreview ? (
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Image
                        width={400}
                        height={400}
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain border border-gray-200 rounded"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">
                      Logo will be centered
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <FiImage className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Upload Logo (optional)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => {
              setAnalytics((prev) => ({
                ...prev,
                generated: prev.generated + 1,
              }));
              setIsGenerating(true);
              setTimeout(() => setIsGenerating(false), 500);
            }}
            disabled={!generatedData || isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <FiRefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <FiImage className="w-5 h-5" />
                <span>Generate QR Code</span>
              </div>
            )}
          </button>
        </div>

        {/* Right Panel - Preview and Actions */}
        <div className="space-y-4">
          {/* QR Code Preview */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>

            <div className="flex justify-center">
              <div
                ref={qrRef}
                className="relative bg-white p-4 rounded-lg shadow-lg flex items-center justify-center"
                style={{
                  width: settings.size + 32,
                  height: settings.size + 32,
                }}
              >
                {generatedData ? (
                  <>
                    <QRCodeCanvas
                      size={settings.size}
                      value={generatedData}
                      fgColor={settings.fgColor}
                      bgColor={settings.bgColor}
                      level={settings.errorCorrection}
                      includeMargin={settings.quietZone}
                      imageSettings={
                        settings.logoUrl
                          ? {
                              excavate: true,
                              src: settings.logoUrl,
                              width: settings.size * settings.logoSize,
                              height: settings.size * settings.logoSize,
                            }
                          : undefined
                      }
                    />
                  </>
                ) : (
                  <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <FiImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>QR Code will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {generatedData && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center justify-center">
                  <FiEye className="w-4 h-4 mr-1" />
                  QR Code ready!
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {generatedData && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Download & Share</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => downloadQR("png")}
                  className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => downloadQR("svg")}
                  className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>SVG</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiCopy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={shareQR}
                  className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiShare2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}

          {/* QR Code Details */}
          {generatedData && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">QR Code Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{qrTypes[qrType].label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{settings.size}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Correction:</span>
                  <span className="font-medium">
                    {settings.errorCorrection === "L" && "Low (7%)"}
                    {settings.errorCorrection === "M" && "Medium (15%)"}
                    {settings.errorCorrection === "Q" && "Quartile (25%)"}
                    {settings.errorCorrection === "H" && "High (30%)"}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <FiEye className="w-4 h-4 mr-1" />
                    {showPreview ? "Hide" : "Show"} Data Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {showPreview && generatedData && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <pre className="text-xs text-iconBlack overflow-auto max-h-60">
                  {generatedData}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedQRGenerator;
