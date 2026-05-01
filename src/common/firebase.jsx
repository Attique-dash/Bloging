// DEPRECATED: Firebase functionality has been removed.
// Images are now stored in MongoDB GridFS via server endpoints:
// - POST /upload-banner - for blog banner images
// - POST /upload-image  - for blog content images
// - GET  /image/:id     - to serve images

// This file is kept for reference but not used in the current implementation.

export const imageDb = null;
export const authWithGoogle = async () => {
  console.warn("Google Auth via Firebase has been removed");
  return null;
};