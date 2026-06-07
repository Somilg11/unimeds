import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export async function generateUploadSignature(
  fileName: string,
  fileType: string
): Promise<{
  uploadUrl: string;
  signature: string;
  timestamp: number;
  publicId: string;
}> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const publicId = `unimeds/records/${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      public_id: publicId,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'unimeds_medical_records',
      resource_type: fileType.startsWith('image') ? 'image' : 'auto',
    },
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    signature,
    timestamp,
    publicId,
  };
}

export async function deleteAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'auto',
  });
}
