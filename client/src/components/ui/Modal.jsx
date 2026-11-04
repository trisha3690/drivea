import { XIcon } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) {
    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
        >
            <div
                className={`w-full ${maxWidth} bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up shadow-xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200">
                    <h3 className="text-sm sm:text-base font-medium text-slate-900 truncate pr-2">{title}</h3>
                    <button 
                      onClick={onClose} 
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                      aria-label="Close modal"
                    >
                        <XIcon className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
