import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function AdminTable<T>({
  title,
  rows,
  emptyMessage,
  rowKey,
  columns,
}: {
  title: string;
  rows: T[];
  emptyMessage: string;
  rowKey: (row: T) => string;
  columns: AdminTableColumn<T>[];
}) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-cozy-brown">
        {title} ({rows.length})
      </h1>

      {rows.length === 0 ? (
        <p className="text-cozy-brown-soft">{emptyMessage}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cozy-brown/10 text-cozy-brown-soft">
              {columns.map((column, index) => (
                <th
                  key={column.header}
                  className={`py-2 font-medium ${index < columns.length - 1 ? "pr-4" : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-cozy-brown/5">
                {columns.map((column, index) => (
                  <td
                    key={column.header}
                    className={`py-2 ${index < columns.length - 1 ? "pr-4" : ""} ${
                      column.className ?? "text-cozy-brown-soft"
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
