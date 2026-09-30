import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCode, FaCopy, FaCheck, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';

export default function EmbedCodeModal({ open, onClose }) {
    const [copied, setCopied] = useState(false);
    const copyTimeoutRef = useRef(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const embedUrl = `${origin}/leaderboard/embed`;
    const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="700"
  frameborder="0"
  allow="clipboard-read; clipboard-write"
  allowfullscreen
  title="Volunteer Leaderboard"
  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"
></iframe>`;

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(iframeSnippet).then(() => {
            setCopied(true);
            clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
        });
    }, []);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" aria-modal="true" role="dialog">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal panel */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div className="flex items-center gap-3 text-white font-semibold">
                        <FaCode className="w-5 h-5" />
                        <span>Embed Leaderboard</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors rounded-lg p-1"
                        aria-label="Close modal"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Paste this snippet anywhere in your website's HTML to display a live, automatically-updating leaderboard:
                    </p>

                    {/* Code block */}
                    <div className="relative">
                        <pre className="bg-gray-900 text-green-400 text-xs sm:text-sm rounded-xl p-4 overflow-x-auto whitespace-pre font-mono leading-relaxed border border-gray-700">
                            {iframeSnippet}
                        </pre>
                        <button
                            onClick={handleCopy}
                            className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/25'
                                }`}
                        >
                            {copied ? <><FaCheck className="w-3 h-3" /> Copied!</> : <><FaCopy className="w-3 h-3" /> Copy</>}
                        </button>
                    </div>

                    {/* Live URL */}
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <FaExternalLinkAlt className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="text-xs text-indigo-700 font-medium">Live URL:</span>
                        <a
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 underline hover:text-indigo-800 break-all"
                        >
                            {embedUrl}
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${copied
                            ? 'bg-green-500 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        {copied ? <FaCheck className="w-3.5 h-3.5" /> : <FaCopy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
