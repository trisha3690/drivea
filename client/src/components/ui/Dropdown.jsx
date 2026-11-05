import React, { useState, useRef, useEffect } from "react";

export function Dropdown({ trigger, children, align = "right", position = "bottom", className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const alignStyle = align === "right" ? "right-0" : "left-0";
    const posStyle = position === "top" ? "bottom-full mb-2" : "top-full mt-2";
    const hasElementTrigger = React.isValidElement(trigger);

    const handleToggle = (e) => {
        e?.stopPropagation();
        setIsOpen((prev) => !prev);
    };

    const triggerElement = hasElementTrigger
        ? React.cloneElement(trigger, {
            onClick: (e) => {
                trigger.props.onClick?.(e);
                handleToggle(e);
            },
            "aria-haspopup": "menu",
            "aria-expanded": isOpen,
        })
        : trigger;

    return (
        <div 
            className="relative inline-block text-left" 
            ref={dropdownRef} 
            onClick={(e) => {
                if (hasElementTrigger) {
                    e.stopPropagation();
                } else {
                    handleToggle(e);
                }
            }}
        >
            {triggerElement}

            {isOpen && (
                <div
                    className={`absolute ${alignStyle} ${posStyle} w-56 rounded-xl bg-white border border-slate-200 py-1.5 z-50 animate-fade-in shadow-xl ${className}`}
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsOpen(false); 
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ children, icon: Icon, onClick, danger = false, disabled = false }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
                onClick?.(e);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition ${
                danger ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
        >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span>{children}</span>
        </button>
    );
}
