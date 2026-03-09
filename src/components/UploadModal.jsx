"use client";

import styles from "./uploadModal.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { FaCirclePlus } from "react-icons/fa6";
import { RiVideoOnAiFill } from "react-icons/ri";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { useUpload } from "@/context/UploadProvider";

export default function UploadModal() {
  const {
    isModalOpen,
    file,
    setSelectedFile,
    previewUrl,
    uploading,
    progress,
    closeModal,
    startUpload,
    cancelUpload,
  } = useUpload();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setSelectedFile(selectedFile);
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
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

              {file && (
                <div className={styles.previewWrapper}>
                  {file?.type?.startsWith("image/") && previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={styles.previewImage}
                    />
                  )}

                  {file?.type?.startsWith("video/") && previewUrl ? (
                    <video
                      key={previewUrl}
                      src={previewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className={styles.previewImage}
                    />
                  ) : file?.type?.startsWith("video/") ? (
                    <div className={styles.nopreviewWrapper}>
                      <TbPlayerPlayFilled />

                      <p>{file.name}</p>
                      <p>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {file && (
              <button
                className={styles.uploadBtn}
                onClick={startUpload}
                disabled={uploading}
              >
                {uploading ? `Uploading... ${progress}%` : "Dodaj u album"}
              </button>
            )}
            {uploading && file?.type?.startsWith("video/") && (
              <button className={styles.cancelBtn} onClick={cancelUpload}>
                Prekini upload
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
