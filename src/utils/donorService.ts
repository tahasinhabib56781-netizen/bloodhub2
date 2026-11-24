import { Donor, BloodGroup, ValidationResult } from "../types";
import { get_area_catalog, normalize_text } from "./areaMap";

export const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export const PHONE_RE = /^01[3-9][0-9]{8}$/;

export const DONOR_FIELDS = [
  "name",
  "blood_group",
  "phone",
  "address_present",
  "address_permanent",
  "profession",
  "last_donated",
  "age_verified",
  "weight_verified",
  "availability",
  "medical_restriction",
  "area_index",
] as const;

export function as_text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

/**
 * বাংলা সংখ্যা দিলেও ASCII 01xxxxxxxxx নম্বরে রূপান্তর করে।
 */
export function normalize_phone(value: unknown): string {
  const digitsMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  return as_text(value).replace(/[০-৯]/g, (char) => digitsMap[char] || char);
}

export function parse_donation_date(value: unknown): Date | null {
  const raw = as_text(value);
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const d = new Date(year, month, day);
  if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
    return d;
  }
  return null;
}

/**
 * Calculate days elapsed between today and lastDonationDate:
 * const diffInDays = (today - lastDonationDate) / (1000 * 60 * 60 * 24);
 */
export function calculateDaysElapsed(lastDonated: string | Date | null | undefined, today = new Date()): number | null {
  const raw = as_text(lastDonated);
  if (!raw) return null;
  const donated_on = typeof lastDonated === "string" ? parse_donation_date(raw) : lastDonated;
  if (!donated_on || isNaN(donated_on.getTime())) return null;

  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const donatedDateOnly = new Date(donated_on.getFullYear(), donated_on.getMonth(), donated_on.getDate()).getTime();
  const diffInDays = Math.floor((todayDateOnly - donatedDateOnly) / (1000 * 60 * 60 * 24));
  return diffInDays;
}

/**
 * আজ থেকে ঠিক তিন calendar মাস আগের তারিখ।
 */
export function three_months_ago(today?: Date): Date {
  const ref = today ? new Date(today) : new Date();
  let month = ref.getMonth() + 1 - 3;
  let year = ref.getFullYear();
  if (month <= 0) {
    month += 12;
    year -= 1;
  }
  const daysInTargetMonth = new Date(year, month, 0).getDate();
  const day = Math.min(ref.getDate(), daysInTargetMonth);
  return new Date(year, month - 1, day);
}

/**
 * খালি তারিখ = প্রথমবার দাতা; নইলে কমপক্ষে ৯০ দিন ও ৩ মাস আগে হতে হবে।
 */
export function last_donation_is_eligible(value: unknown, today?: Date): boolean {
  const raw = as_text(value);
  if (!raw) {
    return true;
  }
  const diffInDays = calculateDaysElapsed(raw, today);
  if (diffInDays === null) {
    return false;
  }
  // Formula requirement: diffInDays >= 90
  return diffInDays >= 90;
}

export function normalized_choice(value: unknown): string {
  return normalize_text(value).replace(/\s+/g, "");
}

/**
 * Dynamic Donor Eligibility Calculation:
 * - Age verified (18+)
 * - Weight verified (45+ kg)
 * - Availability (OK)
 * - Medical restriction (No)
 * - Days elapsed since last donation >= 90 days (or no previous donation)
 */
export function checkDonorEligibility(
  donor: Partial<Donor>,
  today = new Date()
): {
  isEligible: boolean;
  diffInDays: number | null;
  reasons: string[];
} {
  const reasons: string[] = [];
  const age_ok = normalized_choice(donor.age_verified) === "yes";
  if (!age_ok) reasons.push("বয়স ১৮ এর কম");

  const weight_ok = normalized_choice(donor.weight_verified) === "yes";
  if (!weight_ok) reasons.push("ওজন ৪৫ কেজির কম");

  const avail_ok = normalized_choice(donor.availability) === "ok";
  if (!avail_ok) reasons.push("বর্তমানে রক্তদানে প্রস্তুত নন");

  const med_ok = normalized_choice(donor.medical_restriction) === "no";
  if (!med_ok) reasons.push("স্বাস্থ্যগত নিষেধাজ্ঞা আছে");

  const raw_date = as_text(donor.last_donated);
  let date_ok = true;
  let diffInDays: number | null = null;

  if (raw_date) {
    diffInDays = calculateDaysElapsed(raw_date, today);
    if (diffInDays !== null) {
      if (diffInDays < 0) {
        date_ok = false;
        reasons.push("ভবিষ্যতের কোনো তারিখ গ্রহণযোগ্য নয়");
      } else if (diffInDays < 90) {
        date_ok = false;
        const remaining = 90 - diffInDays;
        reasons.push(`শেষ রক্তদানের পর মাত্র ${diffInDays} দিন অতিবাহিত হয়েছে (৩ মাস / ৯০ দিন পূর্ণ হতে আরও ${remaining} দিন প্রয়োজন)`);
      }
    } else {
      date_ok = false;
      reasons.push("ভুল তারিখ ফরম্যাট");
    }
  }

  const isEligible = age_ok && weight_ok && avail_ok && med_ok && date_ok;
  return { isEligible, diffInDays, reasons };
}

/**
 * রিটার্ন করে দাতা রক্তদানের জন্য প্রস্তুত কিনা (সবগুলো স্বাস্থ্য শর্ত ও ৯০ দিনের বিরতি যাচাই)।
 */
export function is_eligible(donor: Partial<Donor>, today = new Date()): boolean {
  return checkDonorEligibility(donor, today).isEligible;
}

/**
 * নিবন্ধন ও প্রোফাইল আপডেটের জন্য যাচাইকরণ ফাংশন।
 * গুরুত্বপূর্ণ: শেষ রক্তদানের তারিখ ৯০ দিনের কম হলেও ফর্ম সাবমিশন ব্লক করা যাবে না!
 * তথ্য ডাটাবেজে সেভ হবে এবং isEligible = false সেট হবে।
 */
export function validate_donor(data: Donor): ValidationResult {
  const required: (keyof Donor)[] = [
    "name",
    "blood_group",
    "phone",
    "address_present",
    "address_permanent",
    "profession",
    "age_verified",
    "weight_verified",
    "availability",
    "medical_restriction",
  ];

  if (required.some((field) => !as_text(data[field]))) {
    return {
      valid: false,
      title: "তথ্য অসম্পূর্ণ",
      message: "শেষ রক্তদানের তারিখ ছাড়া বাকি সব ঘর পূরণ করা বাধ্যতামূলক।",
    };
  }

  const normalizedPhone = normalize_phone(data.phone);
  const cleanData: Donor = { ...data, phone: normalizedPhone };

  if (!BLOOD_GROUPS.includes(cleanData.blood_group as BloodGroup)) {
    return {
      valid: false,
      title: "ভুল রক্তের গ্রুপ",
      message: "সঠিক রক্তের গ্রুপ নির্বাচন করুন।",
    };
  }

  const location = get_area_catalog().find_address_location(cleanData.address_present);
  if (!PHONE_RE.test(cleanData.phone) || location === null) {
    return {
      valid: false,
      title: "যাচাই ব্যর্থ",
      message: "আপনার বর্তমান ঠিকানা (জেলা ও উপজেলা) অথবা মোবাইল নম্বরে সমস্যা আছে, দয়া করে ঠিক করুন।",
    };
  }

  const raw_date = as_text(cleanData.last_donated);
  if (raw_date) {
    const donated_on = parse_donation_date(raw_date);
    if (donated_on === null) {
      return {
        valid: false,
        title: "ভুল তারিখ",
        message: "শেষ রক্তদানের তারিখ YYYY-MM-DD ফরম্যাটে লিখুন।",
      };
    }
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const donatedDateOnly = new Date(donated_on.getFullYear(), donated_on.getMonth(), donated_on.getDate()).getTime();
    if (donatedDateOnly > todayDateOnly) {
      return {
        valid: false,
        title: "ভুল তারিখ",
        message: "ভবিষ্যতের কোনো তারিখ দেওয়া যাবে না।",
      };
    }
    // 注意: Do NOT block when diffInDays < 90.
    // The profile update must ALWAYS be saved!
  }

  const { isEligible, diffInDays } = checkDonorEligibility(cleanData);

  cleanData.last_donated = raw_date;
  cleanData.area_index = location.area_index;
  cleanData.isEligible = isEligible;
  cleanData.daysElapsed = diffInDays;

  return {
    valid: true,
    title: "",
    message: "",
    normalizedData: cleanData,
    isEligible,
    diffInDays,
  };
}

// ---------------------------------------------------------------------------
// LocalStorage Persistence Service
// ---------------------------------------------------------------------------
const STORAGE_KEY = "bloodhub_donors_v1";

export const INITIAL_SAMPLE_DONORS: Donor[] = [
  {
    name: "মো: তাহাসিন হাবীব",
    blood_group: "O+",
    phone: "01716448007",
    address_present: "দক্ষিণ বুরুজ বাগান, শার্শা, যশোর",
    address_permanent: "দক্ষিণ বুরুজ বাগান, শার্শা, যশোর",
    profession: "ছাত্র ও ডেভেলপার",
    last_donated: "2024-01-15",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
    area_index: "district:jashore upazila:jashore:sharsha",
    sync_status: "synced",
    updated_at: new Date().toISOString(),
    isEligible: true,
  },
  {
    name: "কবির হোসেন",
    blood_group: "O+",
    phone: "01812345678",
    address_present: "নাভারণ বাজার, শার্শা, যশোর",
    address_permanent: "বেনাপোল, শার্শা, যশোর",
    profession: "ব্যবসায়ী",
    last_donated: "",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
    area_index: "district:jashore upazila:jashore:sharsha",
    sync_status: "synced",
    updated_at: new Date().toISOString(),
    isEligible: true,
  },
  {
    name: "তানিয়া সুলতানা",
    blood_group: "A+",
    phone: "01987654321",
    address_present: "আশুলিয়া, সাভার, ঢাকা",
    address_permanent: "ধামরাই, ঢাকা",
    profession: "শিক্ষক",
    last_donated: "2023-11-20",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
    area_index: "district:dhaka upazila:dhaka:savar",
    sync_status: "synced",
    updated_at: new Date().toISOString(),
    isEligible: true,
  },
  {
    name: "আরিফুল ইসলাম",
    blood_group: "B+",
    phone: "01799887766",
    address_present: "মিরপুর, ঢাকা",
    address_permanent: "পবা, রাজশাহী",
    profession: "প্রকৌশলী",
    last_donated: "2024-02-10",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
    area_index: "district:dhaka upazila:dhaka:savar",
    sync_status: "synced",
    updated_at: new Date().toISOString(),
    isEligible: true,
  },
  {
    name: "মাহমুদুল হাসান",
    blood_group: "AB+",
    phone: "01555443322",
    address_present: "বোয়ালখালী, চট্টগ্রাম",
    address_permanent: "পটিয়া, চট্টগ্রাম",
    profession: "ব্যাংকার",
    last_donated: "",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
    area_index: "district:chattogram upazila:chattogram:boalkhali",
    sync_status: "synced",
    updated_at: new Date().toISOString(),
    isEligible: true,
  },
  {
    name: "ফারজানা আক্তার",
    blood_group: "O-",
    phone: "01611223344",
    address_present: "শ্রীমঙ্গল, মৌলভীবাজার, সিলেট",
    address_permanent: "কমলগঞ্জ, মৌলভীবাজার",
    profession: "চিকিৎসক",
    last_donated: "2023-10-05",
    age_verified: "Yes",
    weight_verified: "Yes",
    availability: "OK",
    medical_restriction: "No",
    area_index: "district:moulvibazar upazila:moulvibazar:sreemangal",
    sync_status: "synced",
    updated_at: new Date().toISOString(),
    isEligible: true,
  }
];

export function getStoredDonors(): Donor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_DONORS));
      return INITIAL_SAMPLE_DONORS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SAMPLE_DONORS;
  } catch {
    return INITIAL_SAMPLE_DONORS;
  }
}

export function saveStoredDonors(donors: Donor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
  } catch (e) {
    console.error("Failed to save donors to localStorage", e);
  }
}

export function findDonorByPhone(phone: string): Donor | null {
  const normalized = normalize_phone(phone);
  const donors = getStoredDonors();
  const found = donors.find((d) => normalize_phone(d.phone) === normalized) || null;
  if (found) {
    const { isEligible, diffInDays } = checkDonorEligibility(found);
    return {
      ...found,
      isEligible,
      daysElapsed: diffInDays,
    };
  }
  return null;
}

export function addDonor(donor: Donor): { success: boolean; message: string; isEligible: boolean; diffInDays: number | null } {
  const existing = findDonorByPhone(donor.phone);
  if (existing) {
    return {
      success: false,
      message: "এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত আছে।",
      isEligible: false,
      diffInDays: null,
    };
  }
  const donors = getStoredDonors();
  const { isEligible, diffInDays } = checkDonorEligibility(donor);

  const newDonor: Donor = {
    ...donor,
    isEligible,
    daysElapsed: diffInDays,
    sync_status: "synced",
    updated_at: new Date().toISOString(),
  };
  donors.unshift(newDonor);
  saveStoredDonors(donors);

  let message = "নিবন্ধন সফলভাবে সম্পন্ন হয়েছে!";
  if (!isEligible && diffInDays !== null && diffInDays < 90) {
    message = "আপনার নিবন্ধন সম্পন্ন হয়েছে। তবে ৩ মাস পূর্ণ না হওয়া পর্যন্ত আপনার প্রোফাইল রক্তদানের জন্য অনুপযুক্ত দেখাবে।";
  }

  return { success: true, message, isEligible, diffInDays };
}

/**
 * Profile update handler:
 * - Always saves the new profile data (Name, Phone, lastDonationDate, etc.) to localStorage.
 * - Dynamically calculates isEligible = diffInDays >= 90 (or isAvailable).
 * - Returns informative success message when diffInDays < 90.
 */
export function updateDonor(
  originalPhone: string,
  updatedData: Donor
): {
  success: boolean;
  message: string;
  isEligible: boolean;
  diffInDays: number | null;
  savedDonor?: Donor;
} {
  const donors = getStoredDonors();
  const origNorm = normalize_phone(originalPhone);
  const newNorm = normalize_phone(updatedData.phone);

  if (origNorm !== newNorm) {
    const conflict = donors.find((d) => normalize_phone(d.phone) === newNorm);
    if (conflict) {
      return {
        success: false,
        message: "এই নতুন মোবাইল নম্বরটি অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।",
        isEligible: false,
        diffInDays: null,
      };
    }
  }

  const index = donors.findIndex((d) => normalize_phone(d.phone) === origNorm);
  if (index === -1) {
    return {
      success: false,
      message: "অ্যাকাউন্টটি আর পাওয়া যাচ্ছে না; আবার তথ্য লোড করুন।",
      isEligible: false,
      diffInDays: null,
    };
  }

  // Dynamic eligibility calculation
  const { isEligible, diffInDays } = checkDonorEligibility(updatedData);

  const savedRecord: Donor = {
    ...updatedData,
    phone: newNorm,
    isEligible,
    daysElapsed: diffInDays,
    sync_status: "synced",
    updated_at: new Date().toISOString(),
  };

  donors[index] = savedRecord;
  saveStoredDonors(donors);

  // Informative success message
  let message = "আপনার অ্যাকাউন্টের তথ্য সফলভাবে আপডেট হয়েছে!";
  if (!isEligible) {
    if (diffInDays !== null && diffInDays < 90) {
      message = "আপনার তথ্য আপডেট হয়েছে। তবে ৩ মাস পূর্ণ না হওয়া পর্যন্ত আপনার প্রোফাইল রক্তদানের জন্য অনুপযুক্ত দেখাবে।";
    } else {
      message = "আপনার তথ্য আপডেট হয়েছে। তবে স্বাস্থ্য বা প্রাপ্যতা শর্ত পূরণ না হওয়ায় আপনার প্রোফাইল রক্তদানের জন্য অনুপযুক্ত দেখাবে।";
    }
  }

  return {
    success: true,
    message,
    isEligible,
    diffInDays,
    savedDonor: savedRecord,
  };
}

/**
 * Search and filter service:
 * Filters out any donor where isEligible is false or diffInDays < 90 from the active matching list,
 * while returning ineligible/resting donors separately for badging and transparency.
 */
export function searchEligibleDonors(
  blood_group: string,
  areaInput: string
): {
  donors: Donor[];
  ineligibleDonors: Donor[];
  tokens: string[];
  variants: string[];
} {
  const catalog = get_area_catalog();
  const tokens = catalog.search_tokens(areaInput);
  const variants = catalog.get_search_variants(areaInput);

  if (tokens.length === 0) {
    return { donors: [], ineligibleDonors: [], tokens, variants };
  }

  const allDonors = getStoredDonors();
  const matchedEligible: Donor[] = [];
  const matchedIneligible: Donor[] = [];

  for (const donor of allDonors) {
    if (donor.blood_group !== blood_group) {
      continue;
    }
    const donorArea = donor.area_index || "";
    const matchesArea = tokens.some((token) => donorArea.includes(token));
    if (!matchesArea) {
      continue;
    }

    const { isEligible, diffInDays } = checkDonorEligibility(donor);
    const enrichedDonor: Donor = {
      ...donor,
      isEligible,
      daysElapsed: diffInDays,
    };

    // Filter out if isEligible is false or diffInDays < 90
    if (isEligible && (diffInDays === null || diffInDays >= 90)) {
      matchedEligible.push(enrichedDonor);
    } else {
      matchedIneligible.push(enrichedDonor);
    }
  }

  return {
    donors: matchedEligible,
    ineligibleDonors: matchedIneligible,
    tokens,
    variants,
  };
}

/**
 * Generic donor filter service utility
 */
export function filterDonors(
  donors: Donor[],
  criteria: {
    blood_group?: string;
    areaToken?: string;
    onlyEligible?: boolean;
  }
): Donor[] {
  return donors.filter((donor) => {
    if (criteria.blood_group && criteria.blood_group !== "ALL" && donor.blood_group !== criteria.blood_group) {
      return false;
    }
    if (criteria.areaToken && !donor.area_index?.includes(criteria.areaToken)) {
      return false;
    }
    if (criteria.onlyEligible) {
      return is_eligible(donor);
    }
    return true;
  });
}
