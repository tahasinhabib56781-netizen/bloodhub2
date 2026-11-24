import React, { useState } from "react";
import { Donor } from "../types";
import { checkDonorEligibility } from "../utils/donorService";
import { X, Database, Search, Download, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface MasterDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  donors: Donor[];
  onResetSampleData: () => void;
}

export const MasterDatabaseModal: React.FC<MasterDatabaseModalProps> = ({
  isOpen,
  onClose,
  donors,
  onResetSampleData,
}) => {
  const [filterText, setFilterText] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");

  if (!isOpen) return null;

  const filtered = donors.filter((donor) => {
    if (selectedGroup !== "ALL" && donor.blood_group !== selectedGroup) {
      return false;
    }
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    return (
      donor.name.toLowerCase().includes(term) ||
      donor.phone.includes(term) ||
      donor.address_present.toLowerCase().includes(term) ||
      donor.profession.toLowerCase().includes(term)
    );
  });

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(donors, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bloodhub_donors_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">মাস্টার ডাটাবেজ (সকল রক্তদাতার তালিকা)</h3>
              <p className="text-xs text-slate-500">লোকাল ও ক্লাউড ডাটাবেজে সংরক্ষিত সব রেকর্ড</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="ALL">সব গ্রুপ</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={exportJSON}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON এক্সপোর্ট
            </button>

            <button
              onClick={onResetSampleData}
              className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="ডিফল্ট নমুনা ডেটা পুনরায় লোড করুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              নমুনা ডেটা রিসেট
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-bold z-10">
              <tr>
                <th className="py-2.5 px-3">নাম</th>
                <th className="py-2.5 px-2 text-center">গ্রুপ</th>
                <th className="py-2.5 px-3">মোবাইল নম্বর</th>
                <th className="py-2.5 px-3">বর্তমান ঠিকানা</th>
                <th className="py-2.5 px-3">পেশা</th>
                <th className="py-2.5 px-3 text-center">শেষ রক্তদান</th>
                <th className="py-2.5 px-2 text-center">যোগ্যতা</th>
                <th className="py-2.5 px-2 text-center">সিঙ্ক</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((donor, i) => {
                  const { isEligible, diffInDays } = checkDonorEligibility(donor);
                  return (
                    <tr key={donor.phone + i} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{donor.name}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[11px]">
                          {donor.blood_group}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{donor.phone}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={donor.address_present}>
                        {donor.address_present}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{donor.profession}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {donor.last_donated || "কখনো দেননি"}
                        {diffInDays !== null && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            ({diffInDays} দিন আগে)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> উপযুক্ত
                          </span>
                        ) : diffInDays !== null && diffInDays < 90 ? (
                          <span className="inline-flex items-center gap-1 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-full text-[10px] border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> বিরতিতে ({diffInDays} দিন)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                            <XCircle className="w-3 h-3 text-slate-400" /> অনুপযুক্ত
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                          {donor.sync_status || "synced"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
