"""
BloodHub - বাংলাদেশ এলাকা ও অ্যালগরিদম মডিউল (area_map.py)
৮ বিভাগ, ৬৪ জেলা ও ৪৯৫ উপজেলার ক্যাটালগ ও সার্চ রেজল্যুশন ইঞ্জিন
"""

import re
import unicodedata
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple

# সরকারি বানান পরিবর্তনের আগের বহুল-ব্যবহৃত ইংরেজি নামগুলোকেও গ্রহণ করা হয়
EXTRA_ALIASES: Dict[str, List[str]] = {
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
}

BENGALI_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
PUNCTUATION_RE = re.compile(r"[\s,.;:!?/\\|()[\]{}<>\"'`~@#$%^&*_+=-]+")


def normalize_text(value: Optional[str]) -> str:
    """Unicode-normalise, lowercase এবং স্পেস-normalise করা টেক্সট ফেরত দেয়।"""
    if value is None:
        value = ""
    text = unicodedata.normalize("NFKC", str(value))
    text = text.translate(BENGALI_DIGITS)
    text = text.lower()
    text = PUNCTUATION_RE.sub(" ", text)
    return " ".join(text.split())


def _aliases(name_en: str, name_bn: str) -> Set[str]:
    """বাংলা ও ইংরেজি নামের সমার্থক শব্দাবলী তৈরি করে।"""
    aliases = {normalize_text(name_en), normalize_text(name_bn)}
    for item in EXTRA_ALIASES.get(normalize_text(name_en), []):
        aliases.add(normalize_text(item))
    aliases.discard("")
    return aliases


def _contains_phrase(text: str, phrase: str) -> bool:
    """শব্দের সীমানা মেনে ফ্রেজ চেক করে।"""
    return f" {phrase} " in f" {text} "


@dataclass(frozen=True)
class Location:
    division_en: str
    division_bn: str
    district_id: str
    district_en: str
    district_bn: str
    upazila_id: str
    upazila_en: str
    upazila_bn: str
    district_aliases: Set[str]
    upazila_aliases: Set[str]

    @property
    def area_index(self) -> str:
        return f"district:{self.district_id} upazila:{self.district_id}:{self.upazila_id}"


class AreaCatalog:
    def __init__(self, locations: List[Location]) -> None:
        self.locations = locations

    def find_address_location(self, address: str) -> Optional[Location]:
        """ঠিকানা থেকে জেলা এবং উপজেলা উভয়টি সনাক্ত করে ক্যানোনিকাল লোকেশন প্রদান করে।"""
        normalized = normalize_text(address)
        if not normalized:
            return None

        for loc in self.locations:
            district_found = any(_contains_phrase(normalized, alias) for alias in loc.district_aliases)
            if not district_found:
                continue

            upazila_found = any(_contains_phrase(normalized, alias) for alias in loc.upazila_aliases)
            if upazila_found:
                return loc

        return None

    def search_tokens(self, area: str) -> List[str]:
        """ইউজারের ইনপুট থেকে ডাটাবেজ সার্চ টোকেন তৈরি করে।"""
        normalized = normalize_text(area)
        if not normalized:
            return []

        tokens: Set[str] = set()
        for loc in self.locations:
            for alias in loc.upazila_aliases:
                if _contains_phrase(normalized, alias):
                    tokens.add(f"upazila:{loc.district_id}:{loc.upazila_id}")
                    break

            for alias in loc.district_aliases:
                if _contains_phrase(normalized, alias):
                    tokens.add(f"district:{loc.district_id}")
                    break

        return sorted(tokens)

    def get_search_variants(self, area: str) -> List[str]:
        """ইনপুটের বিপরীতে সংশ্লিষ্ট সমার্থক ও সহযোগী নামসমূহ ফেরত দেয়।"""
        normalized = normalize_text(area)
        variants: Set[str] = set()
        if normalized:
            variants.add(normalized)

        for loc in self.locations:
            matched = any(_contains_phrase(normalized, a) for a in loc.district_aliases)
            if not matched:
                matched = any(_contains_phrase(normalized, a) for a in loc.upazila_aliases)

            if matched:
                variants.update(loc.district_aliases)
                variants.update(loc.upazila_aliases)

        return sorted(v for v in variants if v)
