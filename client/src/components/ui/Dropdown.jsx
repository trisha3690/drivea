import React, { useState, useRef, useEffect, createContext, useContext } from "react";

const DropdownContext = createContext(null);

export function Dropdown({ trigger, children, align = "right", position = "bottom", className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const closeDropdown = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (typeof window !== "undefined") {
                    window.__lastDropdownActionTime = Date.now();
                }
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
        e?.preventDefault();
        if (typeof window !== "undefined") {
            window.__lastDropdownActionTime = Date.now();
        }
        setIsOpen((prev) => !prev);
    };

    const triggerElement = hasElementTrigger
        ? React.cloneElement(trigger, {
            onClick: (e) => {
                e?.stopPropagation();
                if (typeof window !== "undefined") {
                    window.__lastDropdownActionTime = Date.now();
                }
                trigger.props.onClick?.(e);
                handleToggle(e);
            },
            "aria-haspopup": "menu",
            "aria-expanded": isOpen,
            "data-card-action": "true",
        })
        : trigger;

    return (
        <DropdownContext.Provider value={{ close: closeDropdown, isOpen }}>
            <div 
                className="relative inline-block text-left" 
                ref={dropdownRef} 
                data-card-action="true"
                onClick={(e) => {
                    e.stopPropagation();
                    if (!hasElementTrigger) {
                        handleToggle(e);
                    }
                }}
            >
                {triggerElement}

                {isOpen && (
                    <div
                        className={`absolute ${alignStyle} ${posStyle} w-56 rounded-xl bg-white border border-slate-200 py-1.5 z-50 animate-fade-in shadow-xl ${className}`}
                        data-card-action="true"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                        }}
                    >
                        {children}
                    </div>
                )}
            </div>
        </DropdownContext.Provider>
    );
}

export function DropdownItem({ children, icon: Icon, onClick, danger = false, disabled = false }) {
    const dropdown = useContext(DropdownContext);

    const handleClick = (e) => {
        e?.stopPropagation();
        e?.preventDefault();
        if (typeof window !== "undefined") {
            window.__lastDropdownActionTime = Date.now();
        }
        dropdown?.close();
        onClick?.(e);
    };

    return (
        <button
            type="button"
            disabled={disabled}
            data-card-action="true"
            onClick={handleClick}
            onTouchEnd={() => {
                if (typeof window !== "undefined") {
                    window.__lastDropdownActionTime = Date.now();
                }
            }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition ${
                danger ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation select-none`}
        >
            {Icon && <Icon className="size-4 shrink-0 pointer-events-none" />}
            <span className="pointer-events-none">{children}</span>
        </button>
    );
}
