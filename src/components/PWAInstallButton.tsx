import React, { useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { Download, Smartphone, Share, X, PlusSquare } from "lucide-react";

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-200 transition cursor-pointer"
        title="হোম স্ক্রিনে অ্যাপ ইনস্টল করুন"
      >
        <Download className="w-3.5 h-3.5" />
        <span>অ্যাপ ইনস্টল করুন</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
          title="আইফোনে ইনস্টল করুন"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-600" />
          <span>ইনস্টল গাইড</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">আইফোন বা আইপ্যাডে ইনস্টল</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-3">
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    ১
                  </span>
                  <span>
                    Safari ব্রাউজারের নিচে <strong>শেয়ার (Share)</strong>{" "}
                    <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> বাটনে ট্যাপ করুন।
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    ২
                  </span>
                  <span>
                    তালিকা নিচে স্ক্রোল করে <strong>Add to Home Screen</strong>{" "}
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" /> অপশনে চাপুন।
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    ৩
                  </span>
                  <span>
                    উপরে ডানদিকের <strong>Add</strong> বাটনে ক্লিক করলেই অ্যাপটি ইনস্টল হয়ে যাবে!
                  </span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
