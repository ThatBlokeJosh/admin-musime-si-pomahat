// components/ui/Table.tsx
import { GovPagination } from '@gov-design-system-ce/react';
import React, { useState } from 'react';

// Definition for a column structure
export interface Column<T> {
  header: string;
  // Function to render custom content for a cell
  cell: (row: T) => React.ReactNode;
  // Optional: specific styling for the th/td (e.g. "text-right", "w-32")
  className?: string;
}

interface TableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  totalCount?: number;
  footer?: React.ReactNode; // <--- Added optional footer prop
  header?: React.ReactNode; // <--- Added optional footer prop
}

// Use a generic type <T> so this table can display any kind of data
export function Table<T extends { id: string }>({
  title,
  description,
  data,
  columns,
  isLoading,
  totalCount,
  footer, // <--- Destructure footer
  header,
}: TableProps<T>) {
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto flex flex-col">
      {/* --- Header Section --- */}
      <div className="px-4 py-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/80 gap-4">
        <div>
          <span className="text-xl">{title}</span>
          {description && (
            <p className="text-sm mt-1 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex gap-6 justify-center items-center text-sm text-gray-500 font-medium">
          <span className='my-auto'>{totalCount ?? data.length} záznamů</span>
          {header}
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full text-left">
          {/* Table Head styling */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-4 text-xs uppercase font-bold text-gray-500 tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          {/* Table Body styling */}
          <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-5 text-center text-gray-400 italic">
                  Načítám data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-5 text-center text-gray-400 italic">
                  Žádná data k zobrazení.
                </td>
              </tr>
            ) : (
              currentData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80 transition duration-150 ease-in-out">
                  {columns.map((col, index) => (
                    <td key={index} className={`px-6 py-5 whitespace-nowrap ${col.className || ''}`}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Footer Section --- */}
      {footer ? (
        <div className="px-2 py-4 border-t border-gray-200 bg-gray-50/30">
          {footer}
        </div>
      ) :
        (data.length > 0 && <div className="p-2 flex justify-center">
          <GovPagination
            onPage={setPage}
            total={data.length}
            pageSize={ITEMS_PER_PAGE}
            current={page}
            maxPages={10}
            size="m"
            type="button"
            color="primary"
          />
        </div>)
      }
    </div>
  );
}
