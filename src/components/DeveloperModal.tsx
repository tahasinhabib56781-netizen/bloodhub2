import React from "react";
import { X, Award, Phone, MapPin, User, Heart, Share2, Facebook } from "lucide-react";

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const details = [
    { label: "নাম:", value: "মো: তাহাসিন হাবীব" },
    { label: "পিতার নাম:", value: "মো: আহসান হাবীব" },
    { label: "মাতার নাম:", value: "মোছা: নাসরিন আক্তার" },
    { label: "বয়স:", value: "১৪ বছর" },
    { label: "মোবাইল নম্বর:", value: "০১৭১৬৪৪৮০০৭ (01716448007)" },
    {
      label: "ঠিকানা:",
      value: "দক্ষিণ বুরুজ বাগান, শার্শা, যশোর, খুলনা, বাংলাদেশ",
    },
    { label: "উদ্দেশ্য:", value: "রক্তের প্রয়োজনে মানুষের দ্রুত সাহায্য নিশ্চিতকরণ" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">প্রতিষ্ঠাতা ও ডেভেলপার পরিচিতি</h3>
              <p className="text-xs text-slate-500">BloodHub এর নির্মাতার তথ্য</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/80 mb-4">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-amber-200">
              TH
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 leading-tight">মো: তাহাসিন হাবীব</h4>
              <span className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                BloodHub প্রতিষ্ঠাতা ও ডেভেলপার
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-amber-200/60 pt-3">
            {details.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-24 shrink-0">{item.label}</span>
                <span className="text-slate-900 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Actions */}
        <div className="flex gap-2">
          <a
            href="tel:01716448007"
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-200 transition"
          >
            <Phone className="w-4 h-4" />
            সরাসরি যোগাযোগ
          </a>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
