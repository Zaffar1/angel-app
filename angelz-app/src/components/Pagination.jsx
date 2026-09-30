import React, { useMemo, memo } from "react";

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    limit,
    onLimitChange,
    totalItems,
    limits = [10, 20, 50],
    maxPages = 5,
}) => {
    if (!totalPages || totalPages < 1) return null;

    const pages = useMemo(() => {
        if (totalPages <= maxPages) return [...Array(totalPages)].map((_, i) => i + 1);
        let start = Math.max(currentPage - Math.floor(maxPages / 2), 1);
        let end = Math.min(start + maxPages - 1, totalPages);
        start = Math.max(end - maxPages + 1, 1);
        return [...Array(end - start + 1)].map((_, i) => start + i);
    }, [currentPage, totalPages, maxPages]);

    const showRange = `${Math.min((currentPage - 1) * limit + 1, totalItems || 0)} – ${Math.min(currentPage * limit, totalItems || 0)}`;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6">
            <div className="flex flex-wrap gap-2 items-center">
                <button
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                >
                    Prev
                </button>

                {pages[0] > 1 && <>
                    <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">1</button>
                    {pages[0] > 2 && <span className="px-2 text-gray-400">…</span>}
                </>}

                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`px-3 py-1 rounded-lg transition ${p === currentPage ? "bg-blue-500 text-white shadow" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                    >
                        {p}
                    </button>
                ))}

                {pages[pages.length - 1] < totalPages && <>
                    {pages[pages.length - 1] < totalPages - 1 && <span className="px-2 text-gray-400">…</span>}
                    <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">{totalPages}</button>
                </>}

                <button
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                >
                    Next
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-center text-gray-600 text-sm">
                {onLimitChange && (
                    <div className="flex items-center gap-2">
                        <span>Items per page:</span>
                        <select
                            value={limit}
                            onChange={e => onLimitChange(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            {limits.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                )}
                {totalItems !== undefined && <span>{`Showing ${showRange} of ${totalItems}`}</span>}
            </div>
        </div>
    );
};

export default memo(Pagination);