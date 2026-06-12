import {
  AlertCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  UnplugIcon,
} from "lucide-react";
import { PLATFORMS } from "../assets/assets";

interface AccountListProps {
  accounts: any[];
  onDisconnect: (accountId: string) => Promise<void>;
}

const AccountList = ({ accounts, onDisconnect }: AccountListProps) => {
  const handleDisconnect = async (accountId: string) => {
    const confirm = window.confirm(
      "Are you sure you want disconnect this account",
    );
    if (!confirm) return;
    await onDisconnect(accountId);
  };
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <PlusIcon className="size-6 text-slate-500 opacity-50 dark:text-slate-400" />
        </div>

        <p className="text-slate-700 text-lg font-medium dark:text-slate-100">
          No accounts connected
        </p>

        <p className="text-sm text-slate-400 mt-1 max-w-xs text-center dark:text-slate-500">
          Connect your first social platform to start scheduling and automating
          your content.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {accounts.map((account, index) => {
        const meta = PLATFORMS.find((p) => p.id === account.platform);

        if (!meta) return null;

        return (
          <div
            key={index}
            className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex items-center gap-4 transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
          >
            <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 dark:bg-slate-800">
              <meta.icon className="size-6 text-slate-500 dark:text-slate-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-slate-900 font-medium truncate dark:text-slate-100">
                {account.handle}
              </div>
              <div className="text-sm text-slate-500 mt-0.5 dark:text-slate-400">{meta.name}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {account.status === "connected" ? (
                <>
                  <CheckCircleIcon className="size-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircleIcon className="size-4 text-amber-500" />
                  <span className="text-xs text-amber-600">Disconnected</span>
                </>
              )}
            </div>
            <button
              title="Disconnect account"
              onClick={() => handleDisconnect(account._id)}
              className="ml-2 p-1.5 rounded-lg text-slate-300 group-hover:text-red-500 transition-all dark:text-slate-600 dark:group-hover:text-red-300"
            >
              <UnplugIcon className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AccountList;
