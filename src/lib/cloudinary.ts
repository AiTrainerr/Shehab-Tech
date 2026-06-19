// Cloudinary configuration for voice recordings
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export { cloudinary }

export async function uploadAudioToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = "shehab-tech/recordings"
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // Cloudinary uses "video" for audio files
        folder,
        public_id: filename,
        format: "webm",
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" })
  } catch (e) {
    console.error("Cloudinary delete error:", e)
  }
}
