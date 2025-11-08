"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as tus from "tus-js-client"; // ✅ import tus
import styles from "./uploadModal.module.css";
import { FaCirclePlus } from "react-icons/fa6";

export default function UploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  //SEND REQUEST TO MY BACKEND TO SAVE URL INSIDE MONGODB
  const saveToDb = async (id, type) => {
    try {
      const res = await fetch("/api/save-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: id,
          name: file.name,
          type: file.type,
          contentType: type,
        }),
      });
      if (!res.ok) {
        console.error("❌ Failed to save to DB:", await res.json());
      }
    } catch (dbErr) {
      console.error("⚠️ Failed to save to DB:", dbErr);
    }
  };

  //1. ASK NEXT.JS BACKEND FOR UPLOAD URL
  //2. BACKEND ASK CLOUDFLARE FOR URL
  //3. BACKEND SEND UPLOAD URL TO FRONTEND
  //4. FRONTEND MAKE DIRECT UPLOAD OF VIDEO VIA TUS
  //   TO CLOUDFLARE, WITHOUT BACKEND.
  //5. SEND URL TO NEXT.JS BACKEND TO SAVE URL TO MONGODB
  const handleVideoUpload = async () => {
    setUploading(true);

    const metadataObj = {
      filename: file.name,
      filetype: file.type,
      maxDurationSeconds: "600", // encode in metadata
    };
    //To do so, you must pass the expiry and maxDurationSeconds
    //as part of the Upload-Metadata request header as part of the first request
    //The Upload-Metadata header should contain key-value pairs.
    //The keys are text and the values should be encoded in base64.
    // Separate the key and values by a space, not an equal sign.
    //To join multiple key-value pairs, include a comma with no additional spaces.
    //Object.entries Returns an array of key/values
    //https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
    const metadata = Object.entries(metadataObj)
      .map(([k, v]) => `${k} ${btoa(v)}`)
      .join(",");

    try {
      // 1. Ask backend for upload URL
      const res = await fetch("/api/create-video-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileSize: file.size, metadata }),
      });

      const { uploadURL, uid } = await res.json();

      if (!uploadURL) {
        throw new Error("No upload URL received from backend");
      }

      // 2. Create TUS upload this will do direct upload from
      //frontend to cloudflaren
      const upload = new tus.Upload(file, {
        endpoint: uploadURL, // Cloudflare upload URL
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        uploadSize: file.size,
        onError: (err) => {
          console.error("Upload failed:", err);
          setUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          setProgress(percentage);
        },
        onSuccess: async () => {
          console.log("✅ Upload finished! UID:", uid);

          // 3. Save UID to DB
          await saveToDb(uid, "video");

          setUploading(false);

          onClose(true);
        },
      });

      // 3. Start upload
      upload.start();
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
    }
  };

  //1. ASK NEXT.JS BACKEND FOR UPLOAD URL
  //2. NEXT.JS BACKEND ASK CLOUDFLARE FOR URL
  //3. NEXT.JS BACKEND SEND UPLOAD URL TO FRONTEND
  //4. FRONTEND MAKE DIRECT UPLOAD OF IMAGE
  //   WITHOUT BACKEND.
  //5. SEND URL TO NEXT.JS BACKEND TO SAVE URL TO MONGODB
  const handleImageUpload = async () => {
    setUploading(true);
    try {
      // 1. Ask backend for direct upload URL
      const res = await fetch("/api/create-image-upload-url", {
        method: "POST",
      });

      const { uploadURL, id } = await res.json();

      console.log("uploadurl", uploadURL, "id", id);

      // 2. Upload image file directly to Cloudflare Images
      // without involving my backend
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error("Image upload failed");
        return;
      }
      console.log("✅ Image uploaded, ID:", id);

      // 3. Save UID to DB
      await saveToDb(id, "image");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);

      onClose(true);
    }
  };

  const handleUpload = () => {
    if (!file) {
      onClose(false);
      return;
    }
    if (file.type.startsWith("video/")) {
      handleVideoUpload();
    } else if (file.type.startsWith("image/")) {
      handleImageUpload();
    } else {
      alert("Unsupported file type");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFile(null); // clear when modal closes
    }
  }, [isOpen]);

  //To avoid memory leaks, revoke the object URL when the file changes or modal closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setFile(null);
            onClose(false);
          }}
        >
          <motion.div
            className={styles.modal}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Dodaj fotografiju ili video</h2>
            <div className={styles.inputLabelContainer}>
              <label className={styles.fileLabel}>
                <FaCirclePlus />
                <input
                  type="file"
                  accept="image/*,video/*"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                />
              </label>

              {previewUrl && file && (
                <div className={styles.previewWrapper}>
                  {file.type.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={styles.previewImage}
                    ></img>
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className={styles.previewImage}
                    ></video>
                  )}
                </div>
              )}
            </div>
            {file && (
              <button
                className={styles.uploadBtn}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? `Uploading... ${progress}%` : "Dodaj u album"}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
