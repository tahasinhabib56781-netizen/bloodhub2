"""
BloodHub - রক্তদাতা যোগ্যতা ও যাচাই মডিউল (donor_logic.py)
"""

import calendar
import datetime
import re
from typing import Any, Dict, List, Optional, Tuple
from area_map import AreaCatalog, normalize_text

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
PHONE_RE = re.compile(r"^01[3-9][0-9]{8}$")


def three_months_ago(reference_date: Optional[datetime.date] = None) -> datetime.date:
    """ঠিক ৩ মাস আগের ক্যালেন্ডার তারিখ গণনা করে।"""
    ref = reference_date or datetime.date.today()
    month = ref.month - 3
    year = ref.year
    if month <= 0:
        month += 12
        year -= 1
    _, max_days = calendar.monthrange(year, month)
    day = min(ref.day, max_days)
    return datetime.date(year, month, day)


def is_eligible(donor: Dict[str, Any]) -> bool:
    """রক্তদাতার ৫টি স্বাস্থ্য ও ব্যবধানগত শর্ত পূরণ হয়েছে কিনা যাচাই করে।"""
    def _norm(val: Any) -> str:
        return "".join(normalize_text(val).split())

    age_ok = _norm(donor.get("age_verified")) == "yes"
    weight_ok = _norm(donor.get("weight_verified")) == "yes"
    availability_ok = _norm(donor.get("availability")) == "ok"
    medical_ok = _norm(donor.get("medical_restriction")) == "no"

    last_donated_str = donor.get("last_donated")
    if last_donated_str:
        try:
            last_donated_date = datetime.datetime.strptime(str(last_donated_str).strip(), "%Y-%m-%d").date()
            date_ok = last_donated_date <= three_months_ago()
        except ValueError:
            date_ok = False
    else:
        date_ok = True

    return age_ok and weight_ok and availability_ok and medical_ok and date_ok


def validate_donor(data: Dict[str, Any], catalog: AreaCatalog) -> Tuple[bool, str, str, Dict[str, Any]]:
    """নতুন বা পরিবর্তিত রক্তদাতার তথ্য ফরম্যাট ও লোকেশন যাচাই করে।"""
    required_keys = [
        "name", "blood_group", "phone", "address_present",
        "address_permanent", "profession", "age_verified",
        "weight_verified", "availability", "medical_restriction"
    ]
    for key in required_keys:
        if not str(data.get(key, "")).strip():
            return False, "তথ্য অসম্পূর্ণ", "শেষ রক্তদানের তারিখ ছাড়া বাকি সব ঘর পূরণ করা বাধ্যতামূলক।", {}

    phone_norm = re.sub(r"[^0-9]", "", normalize_text(data.get("phone")))
    data["phone"] = phone_norm

    if data.get("blood_group") not in BLOOD_GROUPS:
        return False, "ভুল রক্তের গ্রুপ", "সঠিক রক্তের গ্রুপ নির্বাচন করুন।", {}

    loc = catalog.find_address_location(data.get("address_present", ""))
    if not PHONE_RE.match(phone_norm) or not loc:
        return False, "যাচাই ব্যর্থ", "আপনার স্থায়ী ঠিকানা ও মোবাইল নম্বরের সমস্যা আছে, দয়া করে ঠিক করুন", {}

    data["area_index"] = loc.area_index
    return True, "", "", data
