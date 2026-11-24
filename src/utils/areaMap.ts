import { BANGLADESH_AREAS_DATA } from "../data/bangladeshAreas";
import { LocationItem } from "../types";

/**
 * সরকারি বানান পরিবর্তনের আগের বহুল-ব্যবহৃত ইংরেজি নামগুলোকেও গ্রহণ করা হয়।
 * এগুলো মূল ডেটাসেটের বাংলা/ইংরেজি নামের বিকল্প; কোনো আলাদা এলাকা নয়।
 */
export const EXTRA_ALIASES: Record<string, string[]> = {
  "barishal": ["barisal"],
  "chattogram": ["chittagong"],
  "cumilla": ["comilla"],
  "jashore": ["jessore"],
  "bogura": ["bogra"],
  "chapai nawabganj": ["chapainawabganj", "chapai nawabganj"],
  "cox s bazar": ["cox's bazar", "coxs bazar", "cox bazar"],
  "moulvibazar": ["maulvibazar", "moulvi bazar"],
  "brahmanbaria": ["brahmanbaria", "brahman bariya"],
  "jhalokati": ["jhalokathi"],
  "patuakhali": ["patuakhali"],
  "rangamati": ["rangamati"],
  "khagrachhari": ["khagrachari"],
};

const BENGALI_DIGITS_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const PUNCTUATION_RE = /[\s,.;:!?/\\|()[\]{}<>"'`~@#$%^&*_+=-]+/g;

/**
 * Unicode-normalise, lowercase এবং স্পেস-normalise করা টেক্সট ফেরত দেয়।
 */
export function normalize_text(value: unknown): string {
  if (value === null || value === undefined) {
    value = "";
  }
  let text = String(value).normalize("NFKC");
  text = text.replace(/[০-৯]/g, (char) => BENGALI_DIGITS_MAP[char] || char);
  text = text.toLowerCase();
  text = text.replace(PUNCTUATION_RE, " ");
  return text.trim().split(/\s+/).filter(Boolean).join(" ");
}

/**
 * "উপজেলা" / "জেলা" বা "upazila" / "district" যোগ করলেও মূল নাম মিলবে।
 */
export function _aliases(name_en: string, name_bn: string): Set<string> {
  const norm_en = normalize_text(name_en);
  const norm_bn = normalize_text(name_bn);
  const aliases = new Set<string>();
  if (norm_en) aliases.add(norm_en);
  if (norm_bn) aliases.add(norm_bn);

  const extra = EXTRA_ALIASES[norm_en] || [];
  for (const item of extra) {
    const norm_item = normalize_text(item);
    if (norm_item) aliases.add(norm_item);
  }

  return aliases;
}

/**
 * শুধু পূর্ণ শব্দ/নাম মিলিয়ে দেখে; যেমন 'bar' দিয়ে 'barishal' মিলবে না।
 */
export function _contains_phrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

export class Location implements LocationItem {
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

  constructor(params: {
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
  }) {
    this.division_en = params.division_en;
    this.division_bn = params.division_bn;
    this.district_id = params.district_id;
    this.district_en = params.district_en;
    this.district_bn = params.district_bn;
    this.upazila_id = params.upazila_id;
    this.upazila_en = params.upazila_en;
    this.upazila_bn = params.upazila_bn;
    this.district_aliases = params.district_aliases;
    this.upazila_aliases = params.upazila_aliases;
  }

  /**
   * ডেটাবেজের জন্য ভাষা-নিরপেক্ষ সার্চ token।
   */
  get area_index(): string {
    return `district:${this.district_id} upazila:${this.district_id}:${this.upazila_id}`;
  }
}

export class AreaCatalog {
  locations: Location[];

  constructor(locations: Location[]) {
    this.locations = locations;
  }

  /**
   * একই জেলার অন্তত একটি জেলা ও উপজেলা নাম থাকলে সেটি ফেরত দেয়।
   */
  find_address_location(address: unknown): Location | null {
    const normalized = normalize_text(address);
    if (!normalized) {
      return null;
    }

    for (const location of this.locations) {
      let district_found = false;
      for (const alias of location.district_aliases) {
        if (_contains_phrase(normalized, alias)) {
          district_found = true;
          break;
        }
      }
      if (!district_found) {
        continue;
      }
      for (const alias of location.upazila_aliases) {
        if (_contains_phrase(normalized, alias)) {
          return location;
        }
      }
    }
    return null;
  }

  /**
   * বাংলা/ইংরেজি সার্চ ইনপুট থেকে জেলা বা উপজেলা token বের করে।
   */
  search_tokens(area: unknown): string[] {
    const normalized = normalize_text(area);
    if (!normalized) {
      return [];
    }

    const tokens = new Set<string>();
    for (const location of this.locations) {
      for (const alias of location.upazila_aliases) {
        if (_contains_phrase(normalized, alias)) {
          tokens.add(`upazila:${location.district_id}:${location.upazila_id}`);
          break;
        }
      }
      for (const alias of location.district_aliases) {
        if (_contains_phrase(normalized, alias)) {
          tokens.add(`district:${location.district_id}`);
          break;
        }
      }
    }
    return Array.from(tokens).sort();
  }

  /**
   * পুরোনো LIKE-ভিত্তিক কোডের জন্যও বাংলা/ইংরেজি নামের variant দেয়।
   */
  get_search_variants(area: unknown): string[] {
    const normalized = normalize_text(area);
    const variants = new Set<string>();
    if (normalized) {
      variants.add(normalized);
    }
    for (const location of this.locations) {
      let matched = false;
      for (const alias of location.district_aliases) {
        if (_contains_phrase(normalized, alias)) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        for (const alias of location.upazila_aliases) {
          if (_contains_phrase(normalized, alias)) {
            matched = true;
            break;
          }
        }
      }
      if (matched) {
        location.district_aliases.forEach((alias) => variants.add(alias));
        location.upazila_aliases.forEach((alias) => variants.add(alias));
      }
    }
    return Array.from(variants).filter(Boolean).sort();
  }
}

let cachedAreaCatalog: AreaCatalog | null = null;

/**
 * বাণ্ডল করা ডেটাসেট একবার পড়ে একটি দ্রুত lookup catalog তৈরি করে।
 */
export function get_area_catalog(): AreaCatalog {
  if (cachedAreaCatalog) {
    return cachedAreaCatalog;
  }

  const locations: Location[] = [];
  for (const division of BANGLADESH_AREAS_DATA) {
    const division_en = division.name || "";
    const division_bn = division.bn_name || "";
    for (const district of division.districts || []) {
      const district_en = district.name || "";
      const district_bn = district.bn_name || "";
      const district_id = normalize_text(district_en);
      for (const upazila of district.upazilas || []) {
        const upazila_en = upazila.name || "";
        const upazila_bn = upazila.bn_name || "";
        const upazila_id = normalize_text(upazila_en);
        locations.push(
          new Location({
            division_en,
            division_bn,
            district_id,
            district_en,
            district_bn,
            upazila_id,
            upazila_en,
            upazila_bn,
            district_aliases: _aliases(district_en, district_bn),
            upazila_aliases: _aliases(upazila_en, upazila_bn),
          })
        );
      }
    }
  }

  cachedAreaCatalog = new AreaCatalog(locations);
  return cachedAreaCatalog;
}

/**
 * Compatibility helper: বাংলা ও ইংরেজি সমতুল্য নামগুলোর তালিকা।
 */
export function get_search_variants(area: unknown): string[] {
  return get_area_catalog().get_search_variants(area);
}
