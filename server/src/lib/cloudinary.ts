import { v2 as cloudinary } from 'cloudinary';

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const generateUploadSignature = (
  publicId: string,
  timestamp: number
): string => {
  return cloudinary.utils.api_sign_request(
    {
      timestamp,
      public_id: publicId,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    },
    process.env.CLOUDINARY_API_SECRET || ''
  );
};

export const generateSignedUploadUrl = (
  fileName: string,
  folder: string = 'unimeds/records'
): {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  publicId: string;
} => {
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${folder}/${Date.now()}-${fileName}`;
  const signature = generateUploadSignature(publicId, timestamp);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    signature,
    timestamp,
    publicId,
  };
};

export const deleteAsset = async (fileUrl: string): Promise<boolean> => {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/{type}/upload/{public_id}.{ext}
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
      console.error('Invalid Cloudinary URL format:', fileUrl);
      return false;
    }

    // Get everything after 'upload/' and remove file extension
    const pathWithExtension = urlParts.slice(uploadIndex + 1).join('/');
    const publicId = pathWithExtension.replace(/\.[^.]+$/, '');

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
    });

    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting Cloudinary asset:', error);
    return false;
  }
};

export default cloudinary;
