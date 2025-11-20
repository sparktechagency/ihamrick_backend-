import { Storage } from "@google-cloud/storage";
import config from "../config";
import path from "path";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: config.gcs.projectId,
  keyFilename: path.join(process.cwd(), config.gcs.keyFile || ""),
});

const bucket = storage.bucket(config.gcs.bucketName || "");

interface UploadResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

// Upload file to Google Cloud Storage with resumable upload for large files
// Supports files up to 5GB with automatic retry logic
export const uploadToGCS = async (
  file: Express.Multer.File,
  folder: string
): Promise<UploadResult> => {
  try {
    if (!file || !file.buffer) {
      throw new Error("No file provided");
    }

    // Validate file size
    if (file.size === 0) {
      throw new Error("File is empty");
    }

    if (file.size > config.upload.maxVideoSize) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024 * 1024)).toFixed(
          2
        )}GB) exceeds maximum limit of ${(
          config.upload.maxVideoSize /
          (1024 * 1024 * 1024)
        ).toFixed(2)}GB`
      );
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${folder}/${timestamp}_${sanitizedFileName}`;
    const blob = bucket.file(fileName);

    // Use resumable upload for files larger than 10MB for reliability
    const useResumable = file.size > 10 * 1024 * 1024;

    const blobStream = blob.createWriteStream({
      resumable: useResumable,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname,
          fileSize: file.size.toString(),
        },
      },
      // Timeout for large uploads (30 minutes)
      timeout: 30 * 60 * 1000,
    });

    return new Promise((resolve, reject) => {
      let uploadTimeout: NodeJS.Timeout;

      // Set overall timeout for the upload (45 minutes for 5GB files)
      uploadTimeout = setTimeout(() => {
        blobStream.destroy();
        reject(new Error("Upload timeout: File upload took too long"));
      }, 45 * 60 * 1000);

      blobStream.on("error", (err: any) => {
        clearTimeout(uploadTimeout);
        console.error("GCS Upload Error:", {
          error: err.message,
          code: err.code,
          fileName: file.originalname,
          fileSize: file.size,
        });

        // Provide specific error messages
        if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
          reject(
            new Error(
              "Network connection lost during upload. Please try again."
            )
          );
        } else if (err.code === 403) {
          reject(
            new Error("Permission denied. Check service account permissions.")
          );
        } else if (err.code === 413) {
          reject(new Error("File size exceeds server upload limit."));
        } else {
          reject(new Error(`Upload failed: ${err.message}`));
        }
      });

      blobStream.on("finish", async () => {
        clearTimeout(uploadTimeout);

        const publicUrl = `https://storage.googleapis.com/${config.gcs.bucketName}/${fileName}`;

        console.log(
          `✅ File uploaded successfully: ${fileName} (${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB)`
        );

        resolve({
          publicUrl,
          fileName,
          fileSize: file.size,
          contentType: file.mimetype,
        });
      });

      // Write the file buffer
      blobStream.end(file.buffer);
    });
  } catch (error: any) {
    console.error("Error uploading to GCS:", {
      error: error.message,
      fileName: file?.originalname,
      fileSize: file?.size,
    });
    throw error;
  }
};

// Delete file from Google Cloud Storage
export const deleteFromGCS = async (fileUrl: string): Promise<boolean> => {
  try {
    if (!fileUrl) {
      return false;
    }

    // Extract file name from URL
    const urlParts = fileUrl.split(`${config.gcs.bucketName}/`);

    if (urlParts.length < 2) {
      console.error("Invalid file URL format");
      return false;
    }

    const fileName = urlParts[1];

    await bucket.file(fileName).delete();
    console.log(`File deleted from GCS: ${fileName}`);
    return true;
  } catch (error: any) {
    if (error.code === 404) {
      console.log("File not found in GCS, might be already deleted");
      return true;
    }
    console.error("Error deleting from GCS:", error);
    return false;
  }
};

// Upload video with validation
export const uploadVideo = async (
  file: Express.Multer.File
): Promise<UploadResult> => {
  // Validate file type
  const allowedMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only video files are allowed.");
  }

  // Validate file size
  if (file.size > config.upload.maxVideoSize) {
    throw new Error(
      `File size exceeds the maximum limit of ${
        config.upload.maxVideoSize / (1024 * 1024)
      }MB`
    );
  }

  return uploadToGCS(file, config.gcs.paths.video || "videos");
};

// Check if GCS is properly configured and accessible
// Uses getFiles instead of bucket.exists() to avoid needing storage.buckets.get permission
export const testConnection = async (): Promise<boolean> => {
  try {
    await bucket.getFiles({
      prefix: config.gcs.paths.video,
      maxResults: 1,
      autoPaginate: false,
    });
    console.log("GCS connection successful✅");
    return true;
  } catch (error: any) {
    if (error.code === 403) {
      console.error("GCS Permission Error:", error.message);
      console.error(
        'Please ensure service account has "Storage Object Admin" role'
      );
    } else if (error.code === 404) {
      console.error(`Bucket "${config.gcs.bucketName}" does not exist`);
    } else {
      console.error("GCS connection failed:", error.message);
    }
    return false;
  }
};

export const googleCloudStorage = {
  uploadToGCS,
  deleteFromGCS,
  uploadVideo,
  testConnection,
};
