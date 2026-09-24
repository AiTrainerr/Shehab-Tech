// Cloudinary configuration for voice recordings
import { createHash } from "crypto"

export interface CloudinaryAccount {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Parse accounts from env (fallback if DB is not available)
let accounts: CloudinaryAccount[] = [];
try {
  if (process.env.CLOUDINARY_ACCOUNTS) {
    accounts = JSON.parse(process.env.CLOUDINARY_ACCOUNTS);
  } else if (process.env.CLOUDINARY_CLOUD_NAME) {
    accounts = [{
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!
    }];
  }
} catch (e) {
  console.error("Failed to parse CLOUDINARY_ACCOUNTS", e);
}

export { accounts }

// Cache usage per account: null means "disabled/unreachable"
const USAGE_CACHE = new Map<string, { usedBytes: number | null, expiresAt: number }>();
const CACHE_TTL        = 5  * 60 * 1000; // 5 minutes for valid accounts
const DISABLED_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for disabled accounts (recheck less often)

export async function fetchCloudinaryUsage(cloudName: string, apiKey: string, apiSecret: string) {
  try {
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getCloudinaryAccountsFromDB(): Promise<CloudinaryAccount[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const setting = await prisma.systemSetting.findUnique({ where: { key: "CLOUDINARY_ACCOUNTS" } });
    if (setting && setting.value) {
      return JSON.parse(setting.value);
    }
  } catch (e) {
    console.error("Failed to fetch CLOUDINARY_ACCOUNTS from DB", e);
  }
  return accounts;
}

/**
 * Returns all valid (non-disabled, non-full) accounts sorted by space available.
 * If all are full, returns the least-used one. Never returns a disabled account.
 */
export async function getOrderedValidAccounts(): Promise<CloudinaryAccount[]> {
  const currentAccounts = await getCloudinaryAccountsFromDB();
  if (currentAccounts.length === 0) throw new Error("No Cloudinary accounts configured");

  const LIMIT = 24.5 * 1024 * 1024 * 1024;
  const validWithSpace: CloudinaryAccount[] = [];
  const validFull: CloudinaryAccount[] = [];

  for (const acc of currentAccounts) {
    const cached = USAGE_CACHE.get(acc.cloudName);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      // Use cached result
      if (cached.usedBytes === null) continue; // still disabled
      if (cached.usedBytes < LIMIT) validWithSpace.push(acc);
      else validFull.push(acc);
      continue;
    }

    // Fetch fresh usage
    const data = await fetchCloudinaryUsage(acc.cloudName, acc.apiKey, acc.apiSecret);
    if (!data) {
      // Disabled or unreachable — cache for 30 min and skip
      USAGE_CACHE.set(acc.cloudName, { usedBytes: null, expiresAt: now + DISABLED_CACHE_TTL });
      console.warn(`[Cloudinary] Skipping disabled/unreachable account: ${acc.cloudName}`);
      continue;
    }

    const creditsUsed = data?.credits?.usage || 0;
    const bytesUsed = creditsUsed * 1024 * 1024 * 1024;
    USAGE_CACHE.set(acc.cloudName, { usedBytes: bytesUsed, expiresAt: now + CACHE_TTL });

    if (bytesUsed < LIMIT) validWithSpace.push(acc);
    else validFull.push(acc);
  }

  // Prefer accounts with space; if none, use the full ones
  return validWithSpace.length > 0 ? validWithSpace : validFull;
}

/**
 * Upload audio buffer directly via Cloudinary HTTP API (signed).
 * Automatically retries with the next account if one fails.
 */
export async function uploadAudioToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = "shehab-tech/recordings"
): Promise<{ url: string; publicId: string }> {
  const allAccounts = await getCloudinaryAccountsFromDB();
  const orderedAccounts = await getOrderedValidAccounts();

  // If no valid accounts found at all, fallback to trying all accounts
  const tryList = orderedAccounts.length > 0 ? orderedAccounts : allAccounts;

  let lastError = "";

  for (const acc of tryList) {
    try {
      const result = await uploadToAccount(acc, buffer, filename, folder);
      // Success — clear any disabled cache entry for this account
      const cached = USAGE_CACHE.get(acc.cloudName);
      if (cached && cached.usedBytes === null) {
        USAGE_CACHE.delete(acc.cloudName);
      }
      return result;
    } catch (err: any) {
      lastError = err.message || String(err);
      console.warn(`[Cloudinary] Upload failed on ${acc.cloudName}: ${lastError}. Trying next account...`);
      // Mark this account as disabled temporarily
      USAGE_CACHE.set(acc.cloudName, { usedBytes: null, expiresAt: Date.now() + DISABLED_CACHE_TTL });
    }
  }

  throw new Error(`All Cloudinary accounts failed. Last error: ${lastError}`);
}

async function uploadToAccount(
  acc: CloudinaryAccount,
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${folder}/${filename}`;

  // Cloudinary signature: alphabetically sorted params joined with & then api_secret appended
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${acc.apiSecret}`;
  const signature = createHash("sha256").update(paramsToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(buffer)]), filename);
  formData.append("api_key", acc.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("public_id", publicId);
  formData.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${acc.cloudName}/auto/upload`;
  const res = await fetch(uploadUrl, { method: "POST", body: formData });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`HTTP ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  return { url: data.secure_url, publicId: data.public_id };
}

/**
 * Delete a file from the correct Cloudinary account by detecting it from the URL.
 */
export async function deleteFromCloudinary(publicId: string, fileUrl?: string) {
  try {
    const currentAccounts = await getCloudinaryAccountsFromDB();
    let targetAccount = currentAccounts[0];

    if (fileUrl) {
      const match = fileUrl.match(/res\.cloudinary\.com\/([^\/]+)\//);
      if (match && match[1]) {
        const found = currentAccounts.find(a => a.cloudName === match[1]);
        if (found) targetAccount = found;
      }
    }

    if (!targetAccount) return;

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${targetAccount.apiSecret}`;
    const signature = createHash("sha256").update(paramsToSign).digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", targetAccount.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("resource_type", "video");
    formData.append("invalidate", "true");

    const deleteUrl = `https://api.cloudinary.com/v1_1/${targetAccount.cloudName}/video/destroy`;
    await fetch(deleteUrl, { method: "POST", body: formData });
  } catch (e) {
    console.error("Cloudinary delete error:", e)
  }
}
