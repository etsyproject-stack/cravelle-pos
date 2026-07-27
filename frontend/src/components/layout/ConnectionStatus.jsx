import { useState } from 'react';
import { useOffline } from '../../context/OfflineContext';
import { useToast } from '../../context/ToastContext';

/**
 * Shows whether the till is talking to the server and how many sales are
 * still waiting to upload. Tapping it forces a sync.
 */
export default function ConnectionStatus() {
  const { online, pending, syncing, syncNow } = useOffline();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleSync = async () => {
    if (!online) {
      toast('Still offline — sales are safe on this device.', 'info');
      return;
    }
    if (pending === 0) {
      toast('Everything is already uploaded.', 'info');
      return;
    }
    setBusy(true);
    const result = await syncNow();
    setBusy(false);
    if (!result) {
      toast('Could not upload right now — will retry automatically.', 'error');
    } else if (result.failed > 0) {
      toast(`${result.synced} uploaded, ${result.failed} need attention.`, 'error');
    } else {
      toast(`${result.synced} offline order${result.synced === 1 ? '' : 's'} uploaded.`);
    }
  };

  const working = syncing || busy;

  return (
    <button
      onClick={handleSync}
      title={online ? 'Connected to the server' : 'No connection — selling offline'}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        online
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
      {pending > 0 && (
        <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">
          {working ? 'syncing…' : `${pending} to upload`}
        </span>
      )}
    </button>
  );
}
