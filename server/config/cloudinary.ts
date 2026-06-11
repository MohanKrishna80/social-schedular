import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("CLOUDINARY PING SUCCESS:", result);
  } catch (error) {
    console.error("CLOUDINARY PING FAILED:", error);
  }
})();

export { cloudinary };