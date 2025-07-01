const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    const userId = req.user?.id || req.user?._id;

    return {
      folder: 'user_profiles',
      resource_type: isPdf ? 'raw' : 'image',
      format: isPdf ? 'pdf' : undefined,
      public_id: userId ? `user_${userId}` : `file_${Date.now()}`,
      type: 'upload',
      use_filename: true,
      unique_filename: false,
      overwrite: true,

      // ✅ Explicitly REMOVE access control
      access_control: undefined, // 👈 Ensures file is publicly accessible
    };
  },
});


module.exports = {
  cloudinary,
  storage,
};
