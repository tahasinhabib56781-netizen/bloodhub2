/**
 * BloodHub - GitHub REST API Persistence Service with Auto-Detected Username
 */

import { Donor } from "../types";

export const DEFAULT_GITHUB_TOKEN = "";
export const DEFAULT_REPO_NAME = "tahasinhabib56781-netizen";

let cachedUsername: string | null = null;

/**
 * ১. স্বয়ংক্রিয়ভাবে GitHub ইউজারনেম (login) শনাক্তকরণ
 */
export async function getGitHubUsername(token: string = DEFAULT_GITHUB_TOKEN): Promise<string> {
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
    throw new Error("GitHub রেসপন্সে ব্যবহারকারীর ইউজারনেম পাওয়া যায়নি।");
  }

  cachedUsername = userData.login;
  console.log(`[GitHub Auto-Detect]: ইউজারনেম শনাক্ত হয়েছে -> ${cachedUsername}`);
  return cachedUsername;
}

/**
 * ২. বাংলা ইউনিকোড টেক্সট নিরাপদ Base64 এনকোডার
 */
export function encodeBanglaBase64(data: unknown): string {
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return base64.replace(/[\r\n\s]+/g, "");
}

/**
 * Base64 স্ট্রিং থেকে সঠিক বাংলা ইউনিকোড টেক্সট ডিকোডার
 */
export function decodeBanglaBase64(base64Str: string): string {
  const clean = (base64Str || "").replace(/[\r\n\s]+/g, "");
  return decodeURIComponent(escape(atob(clean)));
}

export interface SaveToGitHubResult {
  success: boolean;
  message: string;
  donor?: Donor;
  commitUrl?: string;
  errorDetails?: unknown;
}

/**
 * ৩. নতুন রক্তদাতার তথ্য GitHub-এর donors.json ফাইলে সংরক্ষণ করার ফাংশন
 */
export async function saveToGitHub(
  newDonorData: Donor | Record<string, unknown>,
  token: string = DEFAULT_GITHUB_TOKEN,
  repoName: string = DEFAULT_REPO_NAME
): Promise<SaveToGitHubResult> {
  if (!newDonorData || typeof newDonorData !== "object") {
    const errorMsg = "অবৈধ রক্তদাতার তথ্য: newDonorData একটি অবজেক্ট হতে হবে।";
    console.error("[BloodHub Error]:", errorMsg);
    alert("⚠️ " + errorMsg);
    return { success: false, message: errorMsg };
  }

  if (!token || token.includes("YOUR_PAT_TOKEN")) {
    const errorMsg = "GitHub Personal Access Token পাওয়া যায়নি! সঠিক টোকেন বসান।";
    console.error("[BloodHub Error]:", errorMsg);
    alert("⚠️ " + errorMsg);
    return { success: false, message: errorMsg };
  }

  if (!repoName) {
    const errorMsg = "REPO_NAME প্রদান করা হয়নি!";
    console.error("[BloodHub Error]:", errorMsg);
    alert("⚠️ " + errorMsg);
    return { success: false, message: errorMsg };
  }

  const cleanToken = token.trim();
  const authHeader = cleanToken.startsWith("Bearer ") ? cleanToken : `Bearer ${cleanToken}`;

  const commonHeaders: Record<string, string> = {
    "Authorization": authHeader,
    "Content-Type": "application/json",
    "Accept": "application/vnd.github.v3+json",
  };

  try {
    const username = await getGitHubUsername(cleanToken);
    const fileUrl = `https://api.github.com/repos/${username}/${repoName}/contents/donors.json`;

    console.log(`[BloodHub GitHub Sync] ১. ${username}/${repoName}/donors.json থেকে ডাটা ও SHA আনা হচ্ছে...`);
    const getRes = await fetch(fileUrl, {
      method: "GET",
      headers: commonHeaders,
    });

    let existingSha: string | null = null;
    let existingDonors: Donor[] = [];

    if (getRes.status === 200) {
      const fileData = await getRes.json();
      existingSha = fileData.sha;
      console.log(`[BloodHub GitHub Sync] বিদ্যমান ফাইলের SHA: ${existingSha}`);

      if (fileData.content) {
        try {
          const decodedJson = decodeBanglaBase64(fileData.content);
          const parsed = JSON.parse(decodedJson);
          existingDonors = Array.isArray(parsed) ? parsed : (parsed.donors || []);
          console.log(`[BloodHub GitHub Sync] পূর্বে সংরক্ষিত মোট রক্তদাতা: ${existingDonors.length} জন`);
        } catch (parseErr) {
          console.warn("[BloodHub GitHub Sync] ফাইল পার্সিং ব্যর্থ, নতুন তালিকা শুরু হচ্ছে:", parseErr);
          existingDonors = [];
        }
      }
    } else if (getRes.status === 404) {
      console.log("[BloodHub GitHub Sync] donors.json পাওয়া যায়নি। নতুন ফাইল তৈরি হবে।");
      existingSha = null;
      existingDonors = [];
    } else {
      const errJson = await getRes.json().catch(() => ({}));
      const errorMsg = `ফাইল ফেচ ব্যর্থ (${getRes.status}): ${errJson.message || getRes.statusText}`;
      console.error("[BloodHub GitHub Sync Error] GET Failed:", errorMsg, errJson);
      alert(`❌ ${errorMsg}`);
      return { success: false, message: errorMsg, errorDetails: errJson };
    }

    const donorRecord: Donor = {
      ...(newDonorData as Donor),
      updated_at: new Date().toISOString(),
      sync_status: "synced",
    };

    const duplicateIndex = existingDonors.findIndex(
      (item) => item.phone && String(item.phone).trim() === String(donorRecord.phone).trim()
    );

    if (duplicateIndex >= 0) {
      existingDonors[duplicateIndex] = { ...existingDonors[duplicateIndex], ...donorRecord };
      console.log(`[BloodHub GitHub Sync] রক্তদাতা (${donorRecord.phone}) আপডেট করা হয়েছে।`);
    } else {
      existingDonors.push(donorRecord);
      console.log(`[BloodHub GitHub Sync] নতুন রক্তদাতা তালিকায় যুক্ত করা হয়েছে।`);
    }

    const updatedBase64 = encodeBanglaBase64(existingDonors);

    const putPayload: {
      message: string;
      content: string;
      sha?: string;
    } = {
      message: "Update donor list",
      content: updatedBase64,
    };

    if (existingSha && typeof existingSha === "string" && existingSha.trim().length > 0) {
      putPayload.sha = existingSha.trim();
    }

    console.log(`[BloodHub GitHub Sync] ২. PUT রিকোয়েস্ট পাঠানো হচ্ছে... (SHA যুক্ত: ${!!putPayload.sha})`);

    const putRes = await fetch(fileUrl, {
      method: "PUT",
      headers: commonHeaders,
      body: JSON.stringify(putPayload),
    });

    const putData = await putRes.json().catch(() => ({}));

    if (putRes.status === 200 || putRes.status === 201) {
      const commitHtmlUrl = putData?.commit?.html_url || "";
      const successMessage = `সফলভাবে GitHub-এ সংরক্ষিত হয়েছে! মোট রক্তদাতা: ${existingDonors.length} জন।`;
      console.log("[BloodHub GitHub Sync Success]:", successMessage, putData);
      alert(`✅ ${successMessage}`);
      return {
        success: true,
        message: successMessage,
        donor: donorRecord,
        commitUrl: commitHtmlUrl,
      };
    } else if (putRes.status === 403) {
      const forbiddenMsg = "GitHub পারমিশন এরর (403 Forbidden): টোকেনটিতে Repository Contents (Read and write) পারমিশন দিন।";
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
      const authMsg = "GitHub প্রমাণীকরণ ব্যর্থ (401 Bad Credentials): টোকেনটি সঠিক নয় বা মেয়াদ শেষ।";
      console.error("[BloodHub GitHub Sync Error] 401 Unauthorized:", putData);
      alert(`❌ ${authMsg}`);
      return { success: false, message: authMsg, errorDetails: putData };
    } else if (putRes.status === 404) {
      const notFoundMsg = `GitHub রিপোজিটরি পাওয়া যায়নি (404 Not Found): '${username}/${repoName}' সঠিক কিনা যাচাই করুন।`;
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
