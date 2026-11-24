import React from "react";
import { BloodGroup } from "../types";
import { BLOOD_GROUPS } from "../utils/donorLogic";
import { Search, MapPin, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface SearchPanelProps {
  bloodGroup: BloodGroup;
  setBloodGroup: (bg: BloodGroup) => void;
  areaInput: string;
  setAreaInput: (area: string) => void;
  onSearch: () => void;
  onOpenMap: () => void;
  statusMessage: { text: string; type: "success" | "warning" | "idle" | "error" };
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  bloodGroup,
  setBloodGroup,
  areaInput,
  setAreaInput,
  onSearch,
  onOpenMap,
  statusMessage,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 flex flex-col gap-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">রক্ত অনুসন্ধান করুন</h2>
          <p className="text-xs text-slate-500">গ্রুপ ও এলাকা দিয়ে তাৎক্ষণিক উপযুক্ত দাতা খুঁজুন</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Blood Group Select */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            রক্তের গ্রুপ:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBloodGroup(bg)}
                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all border ${
                  bloodGroup === bg
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Area Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            জেলা / উপজেলা:
          </label>
          <div className="relative">
            <input
              type="text"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="যেমন: শার্শা, Sharsha, সাভার, সিলেট..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm font-medium text-slate-800 bg-slate-50/50"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            বাংলা বা English—যেকোনো ভাষায় জেলা বা উপজেলার নাম লিখুন।
          </p>
        </div>

        {/* Quick Sample Area Pills */}
        <div>
          <span className="text-xs text-slate-400 block mb-1.5">দ্রুত পরীক্ষামূলক এলাকা:</span>
          <div className="flex flex-wrap gap-1.5">
            {["শার্শা", "Sharsha", "সাভার", "যশোর", "কুমিল্লা", "শ্রীমঙ্গল", "বগুড়া"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setAreaInput(sample);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onSearch}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            🔍 অনুসন্ধান করুন
          </button>

          <button
            type="button"
            onClick={onOpenMap}
            disabled={!areaInput.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition flex items-center justify-center gap-2 border border-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-indigo-600" />
            📍 গুগল ম্যাপে এলাকা দেখুন
          </button>
        </div>

        {/* Live Status Display */}
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : statusMessage.type === "warning"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : statusMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : statusMessage.type === "warning" ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      </div>
    </div>
  );
};
