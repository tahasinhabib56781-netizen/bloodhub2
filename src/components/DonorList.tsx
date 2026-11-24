import React, { useState } from "react";
import { Donor } from "../types";
import {
  Phone,
  MapPin,
  Calendar,
  HeartPulse,
  User,
  Award,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DonorListProps {
  donors: Donor[];
  ineligibleDonors?: Donor[];
  searched: boolean;
  searchGroup: string;
  searchArea: string;
  onCall: (donor: Donor) => void;
}

export const DonorList: React.FC<DonorListProps> = ({
  donors,
  ineligibleDonors = [],
  searched,
  searchGroup,
  searchArea,
  onCall,
}) => {
  const [showIneligible, setShowIneligible] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">উপযুক্ত রক্তদাতাদের তালিকা</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ৫টি বাধ্যতামূলক স্বাস্থ্য শর্ত ও ৯০ দিনের বিরতি যাচাইকৃত সক্রিয় রক্তদাতা
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
            সক্রিয় উপযুক্ত: <strong className="text-rose-600 font-bold">{donors.length} জন</strong>
          </span>
          {ineligibleDonors.length > 0 && (
            <span className="text-xs px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              বিশ্রামে: {ineligibleDonors.length} জন
            </span>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto min-h-[360px] space-y-6">
        {donors.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
              <HeartPulse className="w-8 h-8" />
            </div>
            {searched ? (
              <>
                <h3 className="text-base font-bold text-slate-800 mb-1">কোনো উপযুক্ত রক্তদাতা পাওয়া যায়নি</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  &ldquo;{searchArea}&rdquo; এলাকায় <strong className="text-rose-600">{searchGroup}</strong> গ্রুপের কোনো রক্তদানের জন্য উপযুক্ত সক্রিয় দাতা পাওয়া যায়নি।
                  {ineligibleDonors.length > 0
                    ? ` (তবে এই এলাকায় ${ineligibleDonors.length} জন রক্তদাতা শেষ রক্তদানের ৩ মাস/৯০ দিনের বিরতিতে আছেন)`
                    : " অন্য এলাকা লিখে খুঁজুন অথবা নতুন রক্তদাতা হিসেবে নিবন্ধন করুন।"}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-800 mb-1">অনুসন্ধান শুরু করুন</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  বামপাশের প্যানেল থেকে রক্তের গ্রুপ ও জেলা/উপজেলা লিখে &ldquo;অনুসন্ধান করুন&rdquo; চাপুন।
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donors.map((donor, idx) => {
              const diffDays = donor.daysElapsed ?? null;
              const isEligible = donor.isEligible !== false;

              return (
                <div
                  key={donor.phone + idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Bar with Name & Blood Group */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{donor.name}</h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" />
                            {donor.profession || "রক্তদাতা"}
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-sm shadow-sm shadow-rose-200">
                        {donor.blood_group}
                      </span>
                    </div>

                    {/* Donor Info List */}
                    <div className="py-3 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-semibold text-slate-800">{donor.phone}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-800">{donor.address_present}</span>
                          {donor.address_permanent && donor.address_permanent !== donor.address_present && (
                            <span className="block text-[11px] text-slate-400 mt-0.5">
                              স্থায়ী: {donor.address_permanent}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          শেষ রক্তদান:{" "}
                          <strong className="text-slate-800">
                            {donor.last_donated ? donor.last_donated : "কখনো দেননি / প্রথমবার"}
                          </strong>
                          {diffDays !== null && (
                            <span className="text-[11px] font-mono text-slate-500 ml-1">
                              ({diffDays} দিন আগে)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Dynamic Eligibility & Health Tags */}
                      <div className="pt-1 flex flex-wrap gap-1 text-[10px]">
                        {isEligible ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> রক্তদানে প্রস্তুত (উপযুক্ত)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> রক্তদানে অনুপযুক্ত ({diffDays !== null ? `${diffDays} দিন অতিক্রান্ত` : "বিরতিতে"})
                          </span>
                        )}

                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          ✓ বয়স ১৮+
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          ✓ ওজন ৪৫+ কেজি
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          ✓ সুস্থ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCall(donor)}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-emerald-200 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      কল দিন
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(donor.address_present)}+Bangladesh`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition"
                      title="গুগল ম্যাপে ঠিকানা দেখুন"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ম্যাপ
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ineligible / Resting Donors Collapsible Section */}
        {ineligibleDonors.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowIneligible(!showIneligible)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100/60 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-900">
                  বিশ্রামে থাকা রক্তদাতাদের তালিকা ({ineligibleDonors.length} জন)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-medium">
                  ৩ মাস / ৯০ দিন বিরতি
                </span>
              </div>
              {showIneligible ? (
                <ChevronUp className="w-4 h-4 text-amber-800" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-800" />
              )}
            </button>

            {showIneligible && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ineligibleDonors.map((donor, idx) => {
                  const diffDays = donor.daysElapsed ?? null;
                  const remainingDays = diffDays !== null && diffDays < 90 ? 90 - diffDays : null;

                  return (
                    <div
                      key={"ineligible-" + donor.phone + idx}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between opacity-90"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{donor.name}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">{donor.phone}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-xs">
                            {donor.blood_group}
                          </span>
                        </div>

                        <div className="py-2 text-[11px] text-slate-600 space-y-1">
                          <p className="truncate">ঠিকানা: {donor.address_present}</p>
                          <p>
                            শেষ রক্তদান: <strong>{donor.last_donated || "অনির্দিষ্ট"}</strong>
                          </p>
                          <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-900 text-[10px] flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>
                              {diffDays !== null
                                ? `রক্তদানের পর ${diffDays} দিন হয়েছে (আর ${remainingDays} দিন পর উপযুক্ত হবেন)`
                                : "স্বাস্থ্য শর্ত অনুযায়ী বর্তমানে অনুপযুক্ত"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/50 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-amber-800">
                          ⛔ সাময়িকভাবে অনুপযুক্ত
                        </span>
                        <span className="text-[10px] text-slate-500">
                          কল বন্ধ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
