import React, { useState } from 'react';
import { Button } from './Button';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({ data, columns, pageSize = 10, emptyMessage = 'No records found.' }: DataTableProps<T>) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(data.length / pageSize);
    const slice = data.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                    <tr>
                        {columns.map((col) => (
                            <th key={String(col.key)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {slice.length === 0 ? (
                        <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-400">{emptyMessage}</td></tr>
                    ) : (
                        slice.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-750 transition-colors duration-200 border-gray-700">
                                {columns.map((col) => (
                                    <td key={String(col.key)} className="px-4 py-3 text-sm text-gray-300">
                                        {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-700 bg-gray-900 px-4 py-3">
                    <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setPage((p: number) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                        <Button variant="secondary" size="sm" onClick={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
