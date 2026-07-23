export default function Table({ columns, rows, keyField = 'id', empty = 'No records found.', renderActions }) {
  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2.5 font-semibold ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
            {renderActions && <th className="px-3 py-2.5 text-right font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (renderActions ? 1 : 0)}
                className="px-3 py-10 text-center text-slate-400"
              >
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row[keyField]} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-3 ${col.className || ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {renderActions && (
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1.5">{renderActions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
