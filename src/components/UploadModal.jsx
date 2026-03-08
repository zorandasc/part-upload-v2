"use client";

import styles from "./uploadModal.module.css";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as tus from "tus-js-client";
import { toast } from "react-hot-toast";
import { FaCirclePlus } from "react-icons/fa6";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB

export default function UploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const uploadRef = useRef(null);

  //CLEAR SELECTED FILE AND PREVIEURL
  const clearSelection = () => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return selectedFile ? URL.createObjectURL(selectedFile) : null;
    });
    setFile(selectedFile);
  };

  // SEND REQUEST TO BACKEND TO SAVE METADATA IN DB
  const saveToDb = async ({ id, contentType, fileName, mimeType }) => {
    const res = await fetch("/api/save-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId: id,
        name: fileName,
        type: mimeType,
        contentType,
      }),
    });

    if (!res.ok) {
      let details = "";
      try {
        details = JSON.stringify(await res.json());
      } catch {
        details = await res.text();
      }
      throw new Error(`Failed to save media metadata. ${details}`);
    }
  };

  const handleVideoUpload = async () => {
    if (!file) return;

    const selectedFile = file;
    setUploading(true);
    setProgress(0);

    try {
      const res = await fetch("/api/create-video-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileSize: selectedFile.size,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (!res.ok) throw new Error("Cannot get upload URL");

      const { uploadURL, uid } = await res.json();
      if (!uploadURL || !uid) {
        throw new Error("Invalid upload URL response");
      }

      const upload = new tus.Upload(selectedFile, {
        // Use uploadUrl because backend already created the tus resource.
        uploadUrl: uploadURL,
        chunkSize: 50 * 1024 * 1024, // 50MB: fewer PATCH requests on mobile Chrome,
        retryDelays: [0, 1000, 3000, 5000, 10000, 15000, 20000, 30000],
        uploadSize: selectedFile.size,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        onError: (err) => {
          uploadRef.current = null;
          console.error("Upload failed:", err);
          toast.error("Upload nije uspio. Pritisnite dugme ponovo.");
          setUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          setProgress(percentage);
        },
        onSuccess: async () => {
          uploadRef.current = null;

          try {
            await saveToDb({
              id: uid,
              contentType: "video",
              fileName: selectedFile.name,
              mimeType: selectedFile.type,
            });
            toast.success("Video je uspješno poslan.🎉");
            setUploading(false);
            clearSelection();
            onClose(true);
          } catch (dbErr) {
            console.error("Failed to save to DB:", dbErr);
            toast.error(
              "Video je upload-ovan, ali spremanje u bazu nije uspjelo.",
            );
            setUploading(false);
          }
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch (err) {
      toast.error("Greska: " + err.message);
      setUploading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!file) return;

    const selectedFile = file;
    setUploading(true);
    let success = false;

    try {
      const res = await fetch("/api/create-image-upload-url", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Cannot get image upload URL");

      const { uploadURL, id } = await res.json();
      if (!uploadURL || !id) throw new Error("Invalid image upload response");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Image upload failed");
      }

      await saveToDb({
        id,
        contentType: "image",
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
      });

      toast.success("Slika je uspješno poslana.🎉");
      success = true;
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Greska pri uploadu slike: " + err.message);
    } finally {
      setUploading(false);
      if (success) clearSelection();
      onClose(success);
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
      return;
    }

    if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Slika je prevelika (max 15MB)");
        return;
      }
      handleImageUpload();
      return;
    }

    toast.error("Unsupported file type");
  };

  const handleModalDismiss = () => {
    if (uploading) {
      toast("Upload is still running in background.");
      // Close modal without clearing upload state.
      onClose(false);
      return;
    }

    clearSelection();
    onClose(false);
  };

  const handleCancelUpload = () => {
    //Cancel upload only for video
    if (!file?.type?.startsWith("video/")) return;

    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }

    setUploading(false);
    setProgress(0);
    clearSelection();
    onClose(false);

    toast.success("Upload prekinut.");
  };

  useEffect(() => {
    return () => {
      if (uploadRef.current) {
        uploadRef.current.abort();
        uploadRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
          onClick={handleModalDismiss}
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
                  capture="environment"
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
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className={styles.previewImage}
                    />
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
            {uploading && file?.type?.startsWith("video/") && (
              <button className={styles.cancelBtn} onClick={handleCancelUpload}>
                Prekini upload
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
