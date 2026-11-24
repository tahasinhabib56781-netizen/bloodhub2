import React, { useState, useEffect, useCallback } from "react";
import { BloodGroup, Donor } from "./types";
import {
  getStoredDonors,
  saveStoredDonors,
  searchEligibleDonors,
  INITIAL_SAMPLE_DONORS,
} from "./utils/donorService";
import { get_area_catalog } from "./utils/areaMap";
import { SearchPanel } from "./components/SearchPanel";
import { DonorList } from "./components/DonorList";
import { RegistrationModal } from "./components/RegistrationModal";
import { AccountModal } from "./components/AccountModal";
import { MasterDatabaseModal } from "./components/MasterDatabaseModal";
import { DeveloperModal } from "./components/DeveloperModal";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import {
  HeartPulse,
  UserPlus,
  Settings,
  Database,
  User,
  Activity,
  PhoneCall,
  Sparkles,
} from "lucide-react";

export default function App() {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [areaInput, setAreaInput] = useState("শার্শা");
  const [matchedDonors, setMatchedDonors] = useState<Donor[]>([]);
  const [ineligibleDonors, setIneligibleDonors] = useState<Donor[]>([]);
  const [searched, setSearched] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "warning" | "idle" | "error";
  }>({
    text: "🔄 লোকাল ডাটাবেজ প্রস্তুত",
    type: "idle",
  });

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isDevOpen, setIsDevOpen] = useState(false);

  // Calling modal
  const [callingDonor, setCallingDonor] = useState<Donor | null>(null);

  const handleSearch = useCallback(() => {
    setSearched(true);
    const result = searchEligibleDonors(bloodGroup, areaInput);
    setMatchedDonors(result.donors);
    setIneligibleDonors(result.ineligibleDonors || []);

    if (result.tokens.length === 0) {
      setStatusMessage({
        text: "⚠️ এলাকা পাওয়া যায়নি। বাংলাদেশের বৈধ জেলা বা উপজেলা লিখুন।",
        type: "error",
      });
    } else if (result.donors.length > 0) {
      setStatusMessage({
        text: `✅ ${result.donors.length} জন উপযুক্ত রক্তদাতা পাওয়া গেছে${
          result.ineligibleDonors && result.ineligibleDonors.length > 0
            ? ` (${result.ineligibleDonors.length} জন ৯০ দিনের বিরতিতে)`
            : ""
        }`,
        type: "success",
      });
    } else if (result.ineligibleDonors && result.ineligibleDonors.length > 0) {
      setStatusMessage({
        text: `ℹ️ '${areaInput}' এলাকায় ${result.ineligibleDonors.length} জন দাতা আছেন, তবে সবাই ৯০ দিনের বিরতিতে আছেন`,
        type: "warning",
      });
    } else {
      setStatusMessage({
        text: `⚠️ '${areaInput}' এলাকায় ${bloodGroup} গ্রুপের কোনো উপযুক্ত রক্তদাতা পাওয়া যায়নি`,
        type: "warning",
      });
    }
  }, [bloodGroup, areaInput]);

  useEffect(() => {
    // Initial search
    handleSearch();
  }, [handleSearch]);

  const handleOpenMap = () => {
    if (areaInput.trim()) {
      window.open(
        `https://www.google.com/maps/search/${encodeURIComponent(
          areaInput.trim()
        )}+Bangladesh`,
        "_blank"
      );
    }
  };

  const handleCall = (donor: Donor) => {
    setCallingDonor(donor);
  };

  const confirmCall = () => {
    if (callingDonor) {
      window.location.href = `tel:${callingDonor.phone}`;
      setCallingDonor(null);
    }
  };

  const handleResetSampleData = () => {
    saveStoredDonors(INITIAL_SAMPLE_DONORS);
    handleSearch();
    alert("নমুনা রক্তদাতা ডেটা সফলভাবে রিলোড হয়েছে!");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Blood<span className="text-rose-600">Hub</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                  বাংলাদেশ ডিরেক্টরি
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ৮ বিভাগ, ৬৪ জেলা ও ৪৯৫ উপজেলার ক্যানোনিকাল সার্চ ও রক্তদাতা নেটওয়ার্ক
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-200 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              রক্তদাতা হোন
            </button>

            <button
              onClick={() => setIsAccountOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              প্রোফাইল আপডেট
            </button>

            <button
              onClick={() => setIsMasterOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              ডাটাবেজ
            </button>

            <button
              onClick={() => setIsDevOpen(true)}
              className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 border border-amber-200 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-600" />
              পরিচিতি
            </button>

            {/* In-App PWA Install Prompt Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Algorithm Parameters */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <SearchPanel
            bloodGroup={bloodGroup}
            setBloodGroup={setBloodGroup}
            areaInput={areaInput}
            setAreaInput={setAreaInput}
            onSearch={handleSearch}
            onOpenMap={handleOpenMap}
            statusMessage={statusMessage}
          />
        </div>

        {/* Right Column: Search Results */}
        <div className="lg:col-span-8 flex flex-col">
          <DonorList
            donors={matchedDonors}
            ineligibleDonors={ineligibleDonors}
            searched={searched}
            searchGroup={bloodGroup}
            searchArea={areaInput}
            onCall={handleCall}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>BloodHub Bangladesh • ক্লায়েন্ট-সাইড রক্তদাতা ও এরিয়া ক্যাটালগ সিস্টেম</span>
          <span>নির্মাতা: মো: তাহাসিন হাবীব (শার্শা, যশোর)</span>
        </div>
      </footer>

      {/* Call Confirmation Dialog */}
      {callingDonor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">কল নিশ্চিতকরণ</h3>
            <p className="text-xs text-slate-600 mb-4">
              আপনি কি রক্তদাতা <strong>{callingDonor.name}</strong> ({callingDonor.blood_group}) কে{" "}
              <strong className="font-mono">{callingDonor.phone}</strong> নম্বরে কল দিতে চান?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCallingDonor(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                onClick={confirmCall}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200"
              >
                কল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Functional Modals */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleSearch}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onSuccess={handleSearch}
      />

      <MasterDatabaseModal
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
        donors={getStoredDonors()}
        onResetSampleData={handleResetSampleData}
      />

      <DeveloperModal
        isOpen={isDevOpen}
        onClose={() => setIsDevOpen(false)}
      />

      {/* Connectivity & Offline Status Alert */}
      <OfflineIndicator />
    </div>
  );
}
