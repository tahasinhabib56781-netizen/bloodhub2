export interface Union {
  name: string;
  bn_name: string;
}

export interface Pourashava {
  name: string;
  bn_name: string;
  category?: string;
}

export interface Upazila {
  name: string;
  bn_name: string;
  unions?: Union[];
  pourashavas?: Pourashava[];
}

export interface District {
  name: string;
  bn_name: string;
  lat?: string;
  long?: string;
  upazilas: Upazila[];
  city_corporations?: {
    name: string;
    bn_name: string;
    lat?: string;
    long?: string;
  }[];
}

export interface Division {
  name: string;
  bn_name: string;
  lat?: string;
  long?: string;
  districts: District[];
}

export interface LocationItem {
  division_en: string;
  division_bn: string;
  district_id: string;
  district_en: string;
  district_bn: string;
  upazila_id: string;
  upazila_en: string;
  upazila_bn: string;
  district_aliases: Set<string>;
  upazila_aliases: Set<string>;
  area_index: string;
}

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

export interface Donor {
  id?: number | string;
  name: string;
  blood_group: BloodGroup | string;
  phone: string;
  address_present: string;
  address_permanent: string;
  profession: string;
  last_donated: string; // YYYY-MM-DD or empty
  age_verified: "Yes" | "No" | string;
  weight_verified: "Yes" | "No" | string;
  availability: "OK" | "Not OK" | string;
  medical_restriction: "No" | "Yes" | string;
  area_index?: string;
  sync_status?: "pending" | "synced";
  updated_at?: string;
  isEligible?: boolean;
  daysElapsed?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  title: string;
  message: string;
  normalizedData?: Donor;
  isEligible?: boolean;
  diffInDays?: number | null;
}
