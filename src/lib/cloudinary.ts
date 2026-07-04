// Cloudinary configuration for voice recordings
import { v2 as cloudinary } from "cloudinary"

export interface CloudinaryAccount {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Parse accounts from env
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

// Global fallback config
cloudinary.config({
  cloud_name: accounts[0]?.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: accounts[0]?.apiKey || process.env.CLOUDINARY_API_KEY,
  api_secret: accounts[0]?.apiSecret || process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export { cloudinary, accounts }

const USAGE_CACHE = new Map<string, { usedBytes: number, expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

export async function getActiveCloudinaryAccount(): Promise<CloudinaryAccount> {
  if (accounts.length === 0) throw new Error("No Cloudinary accounts configured");
  if (accounts.length === 1) return accounts[0];

  const LIMIT = 24.5 * 1024 * 1024 * 1024; // 24.5 GB limit per account (out of 25GB)

  for (const acc of accounts) {
    let usage = USAGE_CACHE.get(acc.cloudName);
    if (!usage || Date.now() > usage.expiresAt) {
      const data = await fetchCloudinaryUsage(acc.cloudName, acc.apiKey, acc.apiSecret);
      const creditsUsed = data?.credits?.usage || 0;
      const bytesUsed = creditsUsed * 1024 * 1024 * 1024;
      usage = { usedBytes: bytesUsed, expiresAt: Date.now() + CACHE_TTL };
      USAGE_CACHE.set(acc.cloudName, usage);
    }

    if (usage.usedBytes < LIMIT) {
      return acc; // Found an account with space
    }
  }

  // If all full, return the last one
  return accounts[accounts.length - 1];
}

export async function uploadAudioToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = "shehab-tech/recordings"
): Promise<{ url: string; publicId: string }> {
  const activeAccount = await getActiveCloudinaryAccount();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // Cloudinary uses "video" for audio files
        folder,
        public_id: filename,
        cloud_name: activeAccount.cloudName,
        api_key: activeAccount.apiKey,
        api_secret: activeAccount.apiSecret
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string, fileUrl?: string) {
  try {
    let targetAccount = accounts[0];

    if (fileUrl) {
      const match = fileUrl.match(/res\.cloudinary\.com\/([^\/]+)\//);
      if (match && match[1]) {
        const found = accounts.find(a => a.cloudName === match[1]);
        if (found) targetAccount = found;
      }
    }

    await cloudinary.uploader.destroy(publicId, { 
      resource_type: "video",
      cloud_name: targetAccount?.cloudName,
      api_key: targetAccount?.apiKey,
      api_secret: targetAccount?.apiSecret
    })
  } catch (e) {
    console.error("Cloudinary delete error:", e)
  }
}
