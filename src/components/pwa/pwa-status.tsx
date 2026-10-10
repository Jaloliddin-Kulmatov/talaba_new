"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

/** Two small notices for the installed app: "you're offline" and "a new version is ready". */
export default function PwaStatus() {
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // A controller change after the page was already controlled means a NEW worker took over.
    // (The very first install also fires it, but then there was no previous controller.)
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => { if (hadController) setUpdateReady(true); };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);

  return (
    <>
      {offline && (
        <div role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[130] flex justify-center px-4 md:bottom-6">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
            <WifiOff size={15} /> Internet yo&apos;q — saqlangan ma&apos;lumotlar bilan ishlayapsiz
          </div>
        </div>
      )}
      {updateReady && (
        <div role="status" className="fixed inset-x-0 top-16 z-[130] flex justify-center px-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xl hover:bg-blue-700"
          >
            <RefreshCw size={14} /> Yangi versiya tayyor — yangilash
          </button>
        </div>
      )}
    </>
  );
}
