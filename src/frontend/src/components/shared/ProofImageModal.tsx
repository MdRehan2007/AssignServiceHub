import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ProofImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

/** Returns true if the URL is a valid displayable image source */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  );
}

export function ProofImageModal({ imageUrl, onClose }: ProofImageModalProps) {
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isValid = isValidImageUrl(imageUrl);

  // biome-ignore lint/correctness/useExhaustiveDependencies: imageUrl change must trigger reset
  useEffect(() => {
    // Reset per new URL
    setImgLoading(true);
    setImgError(false);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [imageUrl]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (scale > 1) {
        const step = 20;
        if (e.key === "ArrowLeft") setPos((p) => ({ ...p, x: p.x + step }));
        if (e.key === "ArrowRight") setPos((p) => ({ ...p, x: p.x - step }));
        if (e.key === "ArrowUp") setPos((p) => ({ ...p, y: p.y + step }));
        if (e.key === "ArrowDown") setPos((p) => ({ ...p, y: p.y - step }));
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, scale]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "payment-proof.png";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale > 1) {
      setDragging(true);
      startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y,
    });
  };

  const onPointerUp = () => setDragging(false);

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm" />
      <dialog
        open
        aria-label="Payment proof viewer"
        className="fixed inset-0 z-[71] flex items-center justify-center bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full border-none overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        data-ocid="proof_image.modal"
      >
        {/* Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[72] bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
            aria-label="Zoom out"
            data-ocid="proof_image.zoom_out_button"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-white text-xs font-medium min-w-[3ch] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
            aria-label="Zoom in"
            data-ocid="proof_image.zoom_in_button"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="text-white text-xs font-medium px-2 py-1 rounded-full hover:bg-white/20 transition"
            data-ocid="proof_image.reset_zoom_button"
          >
            Reset
          </button>
          {isValid && !imgError && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
              aria-label="Download proof"
              data-ocid="proof_image.download_button"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-[72] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
          aria-label="Close proof viewer"
          data-ocid="proof_image.close_button"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content area */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center p-4"
          style={{ minHeight: "100vh", width: "100%" }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {/* Fallback: invalid URL */}
          {!isValid && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-auto">
              <p className="text-gray-700 font-semibold text-base mb-2">
                Proof image unavailable.
              </p>
              <p className="text-gray-500 text-sm">
                Please refresh or contact support.
              </p>
            </div>
          )}

          {/* Loading spinner */}
          {isValid && imgLoading && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            </div>
          )}

          {/* Error fallback */}
          {isValid && imgError && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-auto">
              <p className="text-gray-700 font-semibold text-base mb-2">
                Proof image unavailable.
              </p>
              <p className="text-gray-500 text-sm">
                Please refresh or contact support.
              </p>
            </div>
          )}

          {/* Actual image */}
          {isValid && (
            <div
              className="flex items-center justify-center w-full"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                cursor:
                  scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
              }}
            >
              <img
                src={imageUrl}
                alt="Payment proof"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
                style={{
                  display: imgError ? "none" : imgLoading ? "none" : "block",
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                  transition: dragging ? "none" : "transform 0.2s ease",
                }}
                draggable={false}
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgLoading(false);
                  setImgError(true);
                }}
                data-ocid="proof_image.full_image"
              />
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
