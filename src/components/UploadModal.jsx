"use client";

import styles from "./uploadModal.module.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as tus from "tus-js-client"; // ✅ import tus
import { toast } from "react-hot-toast";
import { FaCirclePlus } from "react-icons/fa6";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB

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
  //3. BACKEND SEND UPLOAD URL AND ID TO FRONTEND
  //4. FRONTEND MAKE DIRECT UPLOAD OF VIDEO VIA TUS
  //TO CLOUDFLARE, WITHOUT BACKEND USING THAT URL.
  //5. FORM CONTEN OBJECT WITH THAT ID
  // AND SEND TO NEXT.JS BACKEND TO SAVE THE OBJECT TO MONGODB
  const handleVideoUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      // 1. Ask backend for upload URL for direct video upload to cloudflare
      const res = await fetch("/api/create-video-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileSize: file.size,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Cannot get upload URL");

      const { uploadURL, uid } = await res.json();

      if (!uploadURL) {
        throw new Error("No upload URL received from backend");
      }

      // 2. Create TUS upload this will do direct upload from
      //frontend to cloudflaren
      const upload = new tus.Upload(file, {
        // Cloudflare already returns a concrete upload URL.
        // Use uploadUrl (not endpoint) so tus-js-client skips creation POST.
        uploadUrl: uploadURL,
        // Cloudflare Stream tus requires chunked PATCH uploads.
        // Keeping chunks moderate avoids large single-request failures.
        chunkSize: 5 * 1024 * 1024,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        uploadSize: file.size,

        onError: (err) => {
          console.error("Upload failed:", err);
          toast.error("Upload nije uspio. Pokušaj ponovo.");
          setUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          setProgress(percentage);
        },
        onSuccess: async () => {
          // 3. Save UID to DB
          await saveToDb(uid, "video");
          console.log("✅ Upload finished! UID:", uid);
          toast.success("Video je uspješno poslan.🎉");
          setUploading(false);
          onClose(true);
        },
      });

      // 3. Start upload
      upload.start();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Greška: " + err.message);
      setUploading(false);
    }
  };

  //1. FRONTEND ASK NEXT.JS BACKEND FOR UPLOAD URL
  //2. NEXT.JS BACKEND ASK CLOUDFLARE FOR URL
  //3. NEXT.JS BACKEND SEND UPLOAD URL TO FRONTEND
  //4. FRONTEND MAKE DIRECT UPLOAD OF IMAGE
  //   WITHOUT BACKEND.
  //5. SAVE UID to DB VIA NEXT.JS BACKEND
  const handleImageUpload = async () => {
    setUploading(true);
    try {
      // 1. Ask backend for direct upload URL
      const res = await fetch("/api/create-image-upload-url", {
        method: "POST",
      });

      const { uploadURL, id } = await res.json();

      //console.log("uploadurl", uploadURL, "id", id);

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

      toast.success("Slika je uspješno poslana.🎉");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Greška pri uploadu slike: " + err.message);
    } finally {
      setUploading(false);

      onClose(true);
    }
  };

  const handleUpload = () => {
    if (uploading) return;
    if (!file) {
      onClose(false);
      return;
    }
    if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error("Video je prevelik (max 500MB)");
        return;
      }

      handleVideoUpload();
    } else if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Slika je prevelika (max 15MB)");
        return;
      }
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
                  capture
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
