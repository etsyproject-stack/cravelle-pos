/**
 * Shown on screens that need live data from the server (reports, dashboard,
 * order history). Only the POS keeps working without a connection.
 */
export default function OfflineNotice({ what = 'This page' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="text-4xl">📴</span>
      <p className="text-sm font-semibold text-slate-700">No connection to the server</p>
      <p className="max-w-sm text-sm text-slate-500">
        {what} needs the internet. The POS screen still works — keep taking orders and they will
        upload by themselves once you are back online.
      </p>
    </div>
  );
}
