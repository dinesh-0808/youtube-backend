import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully
    // console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file  as the upload operation got failed
    return null;
  }
};

const deleteOnCloudinary = async (cloudinaryUrl) => {
  try {
    const regex = cloudinaryUrl?.match(/\/([^\/]+)\.\w+$/);
    const publicId = regex ? regex[1] : null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new ApiError(402, error || "image not deleted");
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
