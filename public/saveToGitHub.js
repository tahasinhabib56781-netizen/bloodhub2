/**
 * BloodHub - Save Donor to GitHub Repository (donors.json) with Auto-Detected Username
 *
 * Steps performed:
 * 1. Auto-detect Username: GET https://api.github.com/user (Authorization: Bearer <TOKEN>)
 * 2. Fetch Existing Data: GET https://api.github.com/repos/{username}/{repo_name}/contents/donors.json
 * 3. Handle Unicode/Bangla Safely: decodeURIComponent(escape(atob(content))) -> push new donor -> btoa(unescape(encodeURIComponent(JSON.stringify(...))))
 * 4. Update File: PUT request to https://api.github.com/repos/{username}/{repo_name}/contents/donors.json with message "Update donor list", clean Base64 content, and SHA (if existing).
 */

// ============================================================================
// কনফিগারেশন (টোকেন ও রিপোজিটরি নাম)
// ============================================================================
const GITHUB_TOKEN = "";
const REPO_NAME = "tahasinhabib56781-netizen";

// ক্যাশ করা ইউজারনেম সংরক্ষণ করতে (বারবার এপিআই কল কমানোর জন্য)
let cachedUsername = null;

/**
 * ১. স্বয়ংক্রিয়ভাবে GitHub ইউজারনেম (login) শনাক্তকরণ
 * GET https://api.github.com/user
 */
async function getGitHubUsername(token) {
  if (cachedUsername) {
    return cachedUsername;
  }

  const cleanToken = token.trim();
  const authHeader = cleanToken.startsWith("Bearer ") ? cleanToken : `Bearer ${cleanToken}`;

  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      "Authorization": authHeader,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = `GitHub ইউজারনেম শনাক্ত করতে ব্যর্থ (${response.status}): ${
      errorData.message || response.statusText
    }`;
    console.error("[GitHub Auto-Detect Error]:", errorMsg, errorData);
    throw new Error(errorMsg);
  }

  const userData = await response.json();
  if (!userData.login) {
    throw new Error("GitHub রেসপন্সে ব্যবহারকারীর ইউজারনেম (login) পাওয়া যায়নি।");
  }

  cachedUsername = userData.login;
  console.log(`[GitHub Auto-Detect]: ইউজারনেম শনাক্ত হয়েছে -> ${cachedUsername}`);
  return cachedUsername;
}

/**
 * ২. বাংলা টেক্সট ও ইউনিকোড অক্ষত রেখে Base64 এনকোড করার ফাংশন
 */
function encodeBanglaBase64(data) {
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return base64.replace(/[\r\n\s]+/g, "");
}

/**
 * Base64 স্ট্রিং থেকে সঠিক বাংলা ইউনিকোড টেক্সট ডিকোড করার ফাংশন
 */
function decodeBanglaBase64(base64Str) {
  const clean = (base64Str || "").replace(/[\r\n\s]+/g, "");
  return decodeURIComponent(escape(atob(clean)));
}

/**
 * ৩. নতুন রক্তদাতার তথ্য GitHub-এর donors.json ফাইলে সংরক্ষণ করার মূল ফাংশন
 *
 * @param {Object} newDonorData রক্তদাতার তথ্যের অবজেক্ট
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
async function saveToGitHub(newDonorData) {
  // ১. ইনপুট ভ্যালিডেশন
  if (!newDonorData || typeof newDonorData !== "object") {
    const errorMsg = "অবৈধ রক্তদাতার তথ্য: newDonorData অবশ্যই একটি অবজেক্ট হতে হবে।";
    console.error("[BloodHub Error]:", errorMsg);
    alert("⚠️ " + errorMsg);
    return { success: false, message: errorMsg };
  }

  if (!GITHUB_TOKEN || GITHUB_TOKEN.includes("YOUR_PAT_TOKEN")) {
    const errorMsg = "GitHub Personal Access Token পাওয়া যায়নি! দয়া করে সঠিক টোকেন বসান।";
    console.error("[BloodHub Error]:", errorMsg);
    alert("⚠️ " + errorMsg);
    return { success: false, message: errorMsg };
  }

  if (!REPO_NAME) {
    const errorMsg = "REPO_NAME প্রদান করা হয়নি! দয়া করে রিপোজিটরি নাম উল্লেখ করুন।";
    console.error("[BloodHub Error]:", errorMsg);
    alert("⚠️ " + errorMsg);
    return { success: false, message: errorMsg };
  }

  const cleanToken = GITHUB_TOKEN.trim();
  const authHeader = cleanToken.startsWith("Bearer ") ? cleanToken : `Bearer ${cleanToken}`;

  const commonHeaders = {
    "Authorization": authHeader,
    "Content-Type": "application/json",
    "Accept": "application/vnd.github.v3+json",
  };

  try {
    // ধাপ ১: টোকেন ব্যবহার করে স্বয়ংক্রিয়ভাবে ইউজারনেম সংগ্রহ
    console.log("[BloodHub GitHub Sync] ১. GitHub থেকে ইউজারনেম রিট্রিভ করা হচ্ছে...");
    const username = await getGitHubUsername(GITHUB_TOKEN);

    // ফাইল এন্ডপয়েন্ট URL
    const fileUrl = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/donors.json`;

    // ধাপ ২: পূর্ববর্তী donors.json ফাইল ও SHA ফেচ করা
    console.log(`[BloodHub GitHub Sync] ২. ${username}/${REPO_NAME}/donors.json থেকে ডাটা ও SHA আনা হচ্ছে...`);
    const getRes = await fetch(fileUrl, {
      method: "GET",
      headers: commonHeaders,
    });

    let existingSha = null;
    let existingDonors = [];

    if (getRes.status === 200) {
      const fileData = await getRes.json();
      existingSha = fileData.sha;
      console.log(`[BloodHub GitHub Sync] বিদ্যমান ফাইলের SHA: ${existingSha}`);

      if (fileData.content) {
        try {
          // ইউনিকোড/বাংলা নিরাপদ ডিকোডিং
          const decodedJson = decodeBanglaBase64(fileData.content);
          const parsed = JSON.parse(decodedJson);
          existingDonors = Array.isArray(parsed) ? parsed : (parsed.donors || []);
          console.log(`[BloodHub GitHub Sync] পূর্বের সংরক্ষিত রক্তদাতা: ${existingDonors.length} জন`);
        } catch (parseErr) {
          console.warn("[BloodHub GitHub Sync] পূর্বের ডাটা পার্স করতে সমস্যা, নতুন তালিকা শুরু হচ্ছে:", parseErr);
          existingDonors = [];
        }
      }
    } else if (getRes.status === 404) {
      console.log("[BloodHub GitHub Sync] donors.json পাওয়া যায়নি। নতুন ফাইল হিসেবে তৈরি হবে (SHA বাদ থাকবে)।");
      existingSha = null;
      existingDonors = [];
    } else {
      const errJson = await getRes.json().catch(() => ({}));
      const errorMsg = `ফাইল ফেচ ব্যর্থ (${getRes.status}): ${errJson.message || getRes.statusText}`;
      console.error("[BloodHub GitHub Sync Error] GET Failed:", errorMsg, errJson);
      alert(`❌ ${errorMsg}`);
      return { success: false, message: errorMsg, errorDetails: errJson };
    }

    // ধাপ ৩: নতুন রক্তদাতার তথ্য ফরম্যাট করে তালিকায় যোগ বা আপডেট করা
    const donorRecord = {
      ...newDonorData,
      updated_at: new Date().toISOString(),
    };

    const duplicateIndex = existingDonors.findIndex(
      (item) => item.phone && String(item.phone).trim() === String(donorRecord.phone).trim()
    );

    if (duplicateIndex >= 0) {
      existingDonors[duplicateIndex] = { ...existingDonors[duplicateIndex], ...donorRecord };
      console.log(`[BloodHub GitHub Sync] বিদ্যমান নম্বর (${donorRecord.phone}) আপডেট করা হয়েছে।`);
    } else {
      existingDonors.push(donorRecord);
      console.log(`[BloodHub GitHub Sync] নতুন রক্তদাতা তালিকায় যোগ করা হয়েছে।`);
    }

    // ধাপ ৪: বাংলা টেক্সট নিরাপদ Base64 এনকোড করা
    const updatedBase64 = encodeBanglaBase64(existingDonors);

    // ধাপ ৫: PUT পেলোড তৈরি
    const putPayload = {
      message: "Update donor list", // ব্যবহারকারীর চাহিদামতো মেসেজ
      content: updatedBase64, // নিউলাইন/স্পেস মুক্ত Base64
    };

    // যদি ফাইল পূর্বে থাকে, কেবল তখনই sha পাঠানো হবে
    if (existingSha && typeof existingSha === "string" && existingSha.trim().length > 0) {
      putPayload.sha = existingSha.trim();
    }

    console.log(`[BloodHub GitHub Sync] ৩. PUT রিকোয়েস্ট পাঠানো হচ্ছে... (SHA যুক্ত: ${!!putPayload.sha})`);

    // ধাপ ৬: PUT রিকোয়েস্ট পাঠিয়ে কমিট সংরক্ষণ
    const putRes = await fetch(fileUrl, {
      method: "PUT",
      headers: commonHeaders,
      body: JSON.stringify(putPayload),
    });

    const putData = await putRes.json().catch(() => ({}));

    if (putRes.status === 200 || putRes.status === 201) {
      const successMessage = `সফলভাবে GitHub-এ সংরক্ষিত হয়েছে! মোট রক্তদাতা: ${existingDonors.length} জন।`;
      console.log("[BloodHub GitHub Sync Success]:", successMessage, putData);
      alert(`✅ ${successMessage}`);
      return { success: true, message: successMessage, data: putData };
    } else if (putRes.status === 403) {
      const forbiddenMsg = "GitHub পারমিশন এরর (403 Forbidden): এই টোকেনটির জন্য রিপোজিটরির Contents (Read and write) পারমিশন প্রয়োজন।";
      console.error("[BloodHub GitHub Sync Error] 403 Forbidden:", putData);
      alert(`⚠️ ${forbiddenMsg}`);
      return { success: false, message: forbiddenMsg, errorDetails: putData };
    } else if (putRes.status === 409) {
      const conflictMsg = "GitHub কনফ্লিক্ট (409 Conflict): ফাইলের SHA মেলেনি। আবার চেষ্টা করুন।";
      console.error("[BloodHub GitHub Sync Error] 409 Conflict:", putData);
      alert(`⚠️ ${conflictMsg}`);
      return { success: false, message: conflictMsg, errorDetails: putData };
    } else if (putRes.status === 422) {
      const unprocMsg = `GitHub ইনভ্যালিড আর্গুমেন্ট (422 Unprocessable): ${putData.message || "পেলোড ত্রুটি"}`;
      console.error("[BloodHub GitHub Sync Error] 422 Invalid:", unprocMsg, putData);
      alert(`❌ ${unprocMsg}`);
      return { success: false, message: unprocMsg, errorDetails: putData };
    } else if (putRes.status === 401) {
      const authMsg = "GitHub প্রমাণীকরণ ব্যর্থ (401 Bad Credentials): আপনার টোকেনটি সঠিক নয় বা মেয়াদ শেষ।";
      console.error("[BloodHub GitHub Sync Error] 401 Unauthorized:", putData);
      alert(`❌ ${authMsg}`);
      return { success: false, message: authMsg, errorDetails: putData };
    } else if (putRes.status === 404) {
      const notFoundMsg = `GitHub রিপোজিটরি পাওয়া যায়নি (404 Not Found): '${username}/${REPO_NAME}' সঠিক কিনা যাচাই করুন।`;
      console.error("[BloodHub GitHub Sync Error] 404 Not Found:", putData);
      alert(`❌ ${notFoundMsg}`);
      return { success: false, message: notFoundMsg, errorDetails: putData };
    } else {
      const genericMsg = `GitHub-এ সংরক্ষণ ব্যর্থ হয়েছে (${putRes.status}): ${
        putData.message || putRes.statusText
      }`;
      console.error("[BloodHub GitHub Sync Error]:", genericMsg, putData);
      alert(`❌ ${genericMsg}`);
      return { success: false, message: genericMsg, errorDetails: putData };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "নেটওয়ার্ক সংযোগ ত্রুটি";
    console.error("[BloodHub GitHub Sync Exception]:", err);
    alert(`❌ ত্রুটি: ${errorMsg}`);
    return { success: false, message: errorMsg, errorDetails: err };
  }
}

// Node.js বা ES Module সাপোর্ট
if (typeof module !== "undefined" && module.exports) {
  module.exports = { saveToGitHub, getGitHubUsername, encodeBanglaBase64, decodeBanglaBase64 };
}
