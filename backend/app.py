"""
BloodHub - Flask ওয়েব সার্ভার ও রাউটিং ইন্টিগ্রেশন (app.py)
"""

import json
import os
from flask import Flask, render_template, request, jsonify
from area_map import AreaCatalog, Location, _aliases, normalize_text
from donor_logic import is_eligible, validate_donor, BLOOD_GROUPS

app = Flask(__name__, template_folder="../templates", static_folder="../static")

# ডাটাবেজ এবং এলাকা ডেটাসেট লোড
AREAS_FILE = os.path.join(os.path.dirname(__file__), "bangladesh_areas.json")

def load_catalog() -> AreaCatalog:
    locations = []
    if os.path.exists(AREAS_FILE):
        with open(AREAS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for div in data:
                for dist in div.get("districts", []):
                    dist_id = normalize_text(dist.get("name"))
                    for upz in dist.get("upazilas", []):
                        locations.append(Location(
                            division_en=div.get("name"),
                            division_bn=div.get("bn_name"),
                            district_id=dist_id,
                            district_en=dist.get("name"),
                            district_bn=dist.get("bn_name"),
                            upazila_id=normalize_text(upz.get("name")),
                            upazila_en=upz.get("name"),
                            upazila_bn=upz.get("bn_name"),
                            district_aliases=_aliases(dist.get("name"), dist.get("bn_name")),
                            upazila_aliases=_aliases(upz.get("name"), upz.get("bn_name"))
                        ))
    return AreaCatalog(locations)

catalog = load_catalog()

# নমুনা রক্তদাতার ডাটাবেজ
DONORS_DB = [
    {
        "name": "আব্দুল্লাহ আল মামুন",
        "blood_group": "O+",
        "phone": "01711223344",
        "address_present": "দক্ষিণ বুরুজ বাগান, শার্শা, যশোর",
        "address_permanent": "শার্শা, যশোর",
        "profession": "শিক্ষক",
        "last_donated": "2023-11-10",
        "age_verified": "Yes",
        "weight_verified": "Yes",
        "availability": "OK",
        "medical_restriction": "No",
        "area_index": "district:jashore upazila:jashore:sharsha"
    }
]

@app.route("/")
def index():
    """মূল রক্তদাতা অনুসন্ধান ও ডিরেক্টরি পেজ রেন্ডার করে"""
    return render_template("index.html", blood_groups=BLOOD_GROUPS)

@app.route("/area-explorer")
def area_explorer():
    """স্বতন্ত্র এলাকা ক্যাটালগ ও অ্যালগরিদম এক্সপ্লোরার পেজ রেন্ডার করে"""
    return render_template("area_explorer.html")

@app.route("/api/search", methods=["GET"])
def api_search():
    bg = request.args.get("group", "O+")
    area = request.args.get("area", "")
    tokens = catalog.search_tokens(area)
    variants = catalog.get_search_variants(area)

    matched = []
    for d in DONORS_DB:
        if d.get("blood_group") != bg:
            continue
        if not is_eligible(d):
            continue
        idx = d.get("area_index", "")
        if any(tok in idx for tok in tokens):
            matched.append(d)

    return jsonify({
        "tokens": tokens,
        "variants": variants,
        "count": len(matched),
        "donors": matched
    })

@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.json or {}
    ok, title, msg, clean_data = validate_donor(data, catalog)
    if not ok:
        return jsonify({"success": False, "title": title, "message": msg}), 400
    
    DONORS_DB.append(clean_data)
    return jsonify({"success": True, "message": "নিবন্ধন সফল হয়েছে!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
