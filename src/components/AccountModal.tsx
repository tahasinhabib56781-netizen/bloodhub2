import React, { useState } from "react";
import { Donor, BloodGroup } from "../types";
import {
  BLOOD_GROUPS,
  findDonorByPhone,
  validate_donor,
  updateDonor,
  normalize_phone,
  calculateDaysElapsed,
  checkDonorEligibility,
} from "../utils/donorService";
import {
  X,
  Search,
  Save,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Clock,
  Info,
  AlertTriangle,
} from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [lookupPhone, setLookupPhone] = useState("");
  const [loadedOriginalPhone, setLoadedOriginalPhone] = useState("");
  const [formData, setFormData] = useState<Donor | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleLookup = () => {
    setStatusMsg(null);
    const cleanPhone = normalize_phone(lookupPhone);
    if (!cleanPhone) {
      setStatusMsg({ type: "error", text: "অনুগ্রহ করে মোবাইল নম্বর লিখুন।" });
      return;
    }

    const donor = findDonorByPhone(cleanPhone);
    if (!donor) {
      setStatusMsg({
        type: "error",
        text: "এই মোবাইল নম্বর দিয়ে কোনো নিবন্ধিত অ্যাকাউন্ট পাওয়া যায়নি।",
      });
      return;
    }

    setFormData({ ...donor });
    setLoadedOriginalPhone(donor.phone);

    // Calculate current eligibility state
    const eligibility = checkDonorEligibility(donor);
    if (!eligibility.isEligible && eligibility.diffInDays !== null && eligibility.diffInDays < 90) {
      setStatusMsg({
        type: "info",
        text: `তথ্য লোড হয়েছে। শেষ রক্তদানের পর ${eligibility.diffInDays} দিন অতিবাহিত হয়েছে (৯০ দিনের বিরতিতে আছেন)।`,
      });
    } else {
      setStatusMsg({
        type: "success",
        text: "তথ্য সফলভাবে লোড হয়েছে! প্রয়োজনীয় পরিবর্তন করে সেভ করুন।",
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !loadedOriginalPhone) {
      setStatusMsg({ type: "error", text: "আগে নিবন্ধিত নম্বর দিয়ে তথ্য লোড করুন।" });
      return;
    }

    // Validation ensures clean format, valid phone, and valid district/upazila address.
    // It DOES NOT block submission when lastDonationDate is less than 90 days.
    const validation = validate_donor(formData);
    if (!validation.valid) {
      setStatusMsg({
        type: "error",
        text: `${validation.title}: ${validation.message}`,
      });
      return;
    }

    // Always save the new profile data (Name, Phone, lastDonationDate, etc.)
    const res = updateDonor(loadedOriginalPhone, validation.normalizedData!);
    if (!res.success) {
      setStatusMsg({ type: "error", text: res.message });
      return;
    }

    // Informative Success Message:
    // If isEligible is false (e.g. diffInDays < 90), show explicit informative notification.
    if (!res.isEligible) {
      setStatusMsg({
        type: "info",
        text: res.message || "আপনার তথ্য আপডেট হয়েছে। তবে ৩ মাস পূর্ণ না হওয়া পর্যন্ত আপনার প্রোফাইল রক্তদানের জন্য অনুপযুক্ত দেখাবে।",
      });
    } else {
      setStatusMsg({
        type: "success",
        text: res.message || "আপনার অ্যাকাউন্টের তথ্য সফলভাবে আপডেট হয়েছে!",
      });
    }

    // Keep phone state synchronized
    setLoadedOriginalPhone(validation.normalizedData!.phone);
    if (res.savedDonor) {
      setFormData(res.savedDonor);
    }

    // Refresh parent state / search results
    onSuccess();
  };

  // Dynamic calculation for live preview under the last donation date input
  const dateDiffInDays = formData?.last_donated
    ? calculateDaysElapsed(formData.last_donated)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">অ্যাকাউন্ট আপডেট / প্রোফাইল</h3>
              <p className="text-xs text-slate-500">মোবাইল নম্বর দিয়ে তথ্য লোড ও পরিবর্তন করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lookup Box */}
        <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 mb-4">
          <label className="block text-xs font-bold text-blue-900 mb-1.5">
            নিবন্ধিত মোবাইল নম্বর লিখুন:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="01716448007"
              className="flex-1 px-3.5 py-2 rounded-xl border border-blue-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleLookup}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-200 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              তথ্য লোড করুন
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : statusMsg.type === "info"
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMsg.type === "info" ? (
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-medium leading-relaxed">{statusMsg.text}</span>
            </div>
          </div>
        )}

        {/* Form Body if Loaded */}
        {formData && (
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নাম:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">রক্তের গ্রুপ:</label>
                <select
                  value={formData.blood_group}
                  onChange={(e) =>
                    setFormData({ ...formData, blood_group: e.target.value as BloodGroup })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর:</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পেশা:</label>
                <input
                  type="text"
                  required
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বর্তমান ঠিকানা:</label>
              <input
                type="text"
                required
                value={formData.address_present}
                onChange={(e) => setFormData({ ...formData, address_present: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="যেমন: শার্শা, যশোর"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা:</label>
              <input
                type="text"
                required
                value={formData.address_permanent}
                onChange={(e) => setFormData({ ...formData, address_permanent: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="যেমন: শার্শা, যশোর"
              />
            </div>

            {/* Last Donation Date & Dynamic Eligibility Banner */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  শেষ রক্তদানের তারিখ:
                </label>
                {dateDiffInDays !== null && dateDiffInDays >= 0 && (
                  <span className="text-[11px] font-mono text-slate-500">
                    ({dateDiffInDays} দিন আগে)
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.last_donated}
                onChange={(e) => setFormData({ ...formData, last_donated: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />

              {/* Dynamic Live Helper for Date */}
              {formData.last_donated && (
                <div className="mt-1.5">
                  {dateDiffInDays !== null && dateDiffInDays < 0 ? (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      ভবিষ্যতের কোনো তারিখ গ্রহণযোগ্য নয়।
                    </p>
                  ) : dateDiffInDays !== null && dateDiffInDays < 90 ? (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">রক্তদানের বিরতি নীতি: </span>
                        শেষ রক্তদানের পর মাত্র <strong>{dateDiffInDays} দিন</strong> হয়েছে। তথ্য সেভ হবে, তবে ৯০ দিন পূর্ণ হতে আরও <strong>{90 - dateDiffInDays} দিন</strong> বাকি থাকায় প্রোফাইল সাময়িকভাবে অনুপযুক্ত দেখাবে।
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {dateDiffInDays !== null
                        ? `শেষ রক্তদানের পর ${dateDiffInDays} দিন অতিক্রান্ত হয়েছে (৯০+ দিন)। রক্তদানের জন্য উপযুক্ত!`
                        : "রক্তদানের জন্য উপযুক্ত।"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Health Options */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">বয়স ১৮+?</label>
                <select
                  value={formData.age_verified}
                  onChange={(e) => setFormData({ ...formData, age_verified: e.target.value })}
                  className="w-full p-1 rounded border border-slate-200 text-xs bg-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">ওজন ৪৫+ কেজি?</label>
                <select
                  value={formData.weight_verified}
                  onChange={(e) => setFormData({ ...formData, weight_verified: e.target.value })}
                  className="w-full p-1 rounded border border-slate-200 text-xs bg-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">রক্তদানে সক্ষম?</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full p-1 rounded border border-slate-200 text-xs bg-white"
                >
                  <option value="OK">OK</option>
                  <option value="Not OK">Not OK</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">জটিল রোগ আছে?</label>
                <select
                  value={formData.medical_restriction}
                  onChange={(e) => setFormData({ ...formData, medical_restriction: e.target.value })}
                  className="w-full p-1 rounded border border-slate-200 text-xs bg-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                পরিবর্তন সেভ করুন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
