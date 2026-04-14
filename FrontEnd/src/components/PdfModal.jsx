export default function PdfModal({ url, onClose }) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">

      {/* Modal */}
      <div className="w-[90%] h-[90%] bg-[#0f172a] rounded-xl overflow-hidden relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 text-white bg-red-500 px-3 py-1 rounded"
        >
          ✕
        </button>

        {/* PDF Viewer */}
        <iframe
          src={url}
          title="PDF Preview"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}