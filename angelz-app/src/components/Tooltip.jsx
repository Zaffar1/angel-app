import { useState, useRef } from "react";
import Portal from "./Portal";

export default function Tooltip({ children, text }) {
    const [show, setShow] = useState(false);
    const ref = useRef(null);

    return (
        <>
            <div
                ref={ref}
                className="inline-flex items-center"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {children}
            </div>
            {show && (
                <Portal>
                    <div
                        className="fixed z-50 px-2 py-1 text-xs text-black bg-gray-100 rounded shadow-lg whitespace-nowrap pointer-events-none"
                        style={{
                            top: ref.current
                                ? ref.current.getBoundingClientRect().top - 30
                                : 0,
                            left: ref.current
                                ? ref.current.getBoundingClientRect().left +
                                ref.current.offsetWidth / 2
                                : 0,
                            transform: "translateX(-50%)",
                        }}
                    >
                        {text}
                    </div>
                </Portal>
            )}
        </>
    );
}
