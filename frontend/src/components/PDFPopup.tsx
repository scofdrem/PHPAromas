import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface PDFPopupProps {
  base64Data: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFPopup({ base64Data, title, isOpen, onClose }: PDFPopupProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen || !base64Data) return null;

  // Strip data URI prefix if present, we add it ourselves
  const cleanBase64 = base64Data.startsWith("data:")
    ? base64Data.split(",")[1]
    : base64Data;
  const src = `data:application/pdf;base64,${cleanBase64}`;

  return (
    <div
      className="pdf-popup-overlay"
      onClick={onClose}
    >
      <div
        className="pdf-popup-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#0A0A0A]">
          <h2 className="text-lg font-semibold text-[#C69B56]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-900">
          <iframe
            src={src}
            className="w-full h-full"
            title={title}
            style={{ pointerEvents: "none" }}
          />
        </div>
      </div>
    </div>
  );
}