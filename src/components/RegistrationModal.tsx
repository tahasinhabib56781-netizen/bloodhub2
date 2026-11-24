import React, { useState } from "react";
import { Donor, BloodGroup } from "../types";
import {
  BLOOD_GROUPS,
  validate_donor,
  addDonor,
  calculateDaysElapsed,
} from "../utils/donorService";
import { X, UserPlus, AlertCircle, CheckCircle2, Heart, Clock } from "lucide-react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Donor>({
    name: "",
    blood_group: "O+",
    phone: "",
    address_present: "",
    address_permanent: "",
    profession: "",
    last_donated: "",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
  });

  const [errorMsg, setErrorMsg] = useState<{ title: string; text: string } | null>(null);

  const regDateDiff = formData.last_donated
    ? calculateDaysElapsed(formData.last_donated)
    : null;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validate_donor(formData);
    if (!validation.valid) {
      setErrorMsg({
        title: validation.title,
        text: validation.message,
      });
      return;
    }

    const res = addDonor(validation.normalizedData!);
    if (!res.success) {
      setErrorMsg({
        title: "নিবন্ধন ব্যর্থ",
        text: res.message,
      });
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="relative w-full sm:max-w-2xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">রক্তদাতা নিবন্ধন ফর্ম</h3>
              <p className="text-xs text-slate-500">আপনার রক্তদানের তথ্য ডিরেক্টরিতে যুক্ত করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Error Notification */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-0.5">{errorMsg.title}</strong>
                  <span>{errorMsg.text}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নাম: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="আপনার পূর্ণ নাম"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  রক্তের গ্রুপ: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value as BloodGroup })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">১১ ডিজিটের বাংলা/ইংরেজি নম্বর</span>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেশা: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="যেমন: শিক্ষক, ছাত্র, চাকরিজীবী"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Present Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                বর্তমান ঠিকানা (অবশ্যই জেলা ও উপজেলা অন্তর্ভুক্ত করুন): <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address_present}
                onChange={(e) => setFormData({ ...formData, address_present: e.target.value })}
                placeholder="যেমন: দক্ষিণ বুরুজ বাগান, শার্শা, যশোর"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                যাচাইয়ের জন্য একই জেলার অন্তত একটি জেলা ও উপজেলার নাম থাকতে হবে
              </span>
            </div>

            {/* Permanent Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                স্থায়ী ঠিকানা: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address_permanent}
                onChange={(e) => setFormData({ ...formData, address_permanent: e.target.value })}
                placeholder="আপনার স্থায়ী ঠিকানা"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Last Donation Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  শেষ রক্তদানের তারিখ (ঐচ্ছিক):
                </label>
                {regDateDiff !== null && regDateDiff >= 0 && (
                  <span className="text-[11px] font-mono text-slate-500">
                    ({regDateDiff} দিন আগে)
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.last_donated}
                onChange={(e) => setFormData({ ...formData, last_donated: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
              {formData.last_donated ? (
                <div className="mt-1">
                  {regDateDiff !== null && regDateDiff < 90 && regDateDiff >= 0 ? (
                    <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      রক্তদানের পর {regDateDiff} দিন হয়েছে। নিবন্ধন সম্পন্ন হবে, তবে ৯০ দিন পূর্ণ না হওয়া পর্যন্ত প্রোফাইল বিরতিতে থাকবে।
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-medium">
                      ✓ শেষ রক্তদানের পর ৯০+ দিন পার হয়েছে। রক্তদানের জন্য প্রস্তুত।
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  খালি রাখলে প্রথমবার রক্তদাতা হিসেবে গণ্য হবে
                </span>
              )}
            </div>

            {/* Health Eligibility Options */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                স্বাস্থ্য ও দান যোগ্যতা যাচাই:
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">বয়স ১৮+ বছর?</label>
                  <select
                    value={formData.age_verified}
                    onChange={(e) => setFormData({ ...formData, age_verified: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="Yes">Yes (হ্যাঁ)</option>
                    <option value="No">No (না)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">ওজন ৪৫+ কেজি?</label>
                  <select
                    value={formData.weight_verified}
                    onChange={(e) => setFormData({ ...formData, weight_verified: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="Yes">Yes (হ্যাঁ)</option>
                    <option value="No">No (না)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">রক্তদানে সক্ষম/প্রস্তুত?</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="OK">OK (সক্ষম)</option>
                    <option value="Not OK">Not OK (অক্ষম)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">কোনো জটিল রোগ আছে?</label>
                  <select
                    value={formData.medical_restriction}
                    onChange={(e) => setFormData({ ...formData, medical_restriction: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="No">No (নেই)</option>
                    <option value="Yes">Yes (আছে)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-20 shrink-0 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              নিবন্ধন সম্পূর্ণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
