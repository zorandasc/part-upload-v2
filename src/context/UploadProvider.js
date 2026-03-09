"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import * as tus from "tus-js-client";
import { toast } from "react-hot-toast";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB

//KONTEKST
const UploadContext = createContext(null);

//WRAPPER ZA DEFINISANJE GLOBALNOG KONTEXSTA
export function UploadProvider({ children }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUploadAt, setLastUploadAt] = useState(null);
  const uploadRef = useRef(null);

  //CLEAR SELECTED FILE AND PREVIEURL
  const clearSelection = () => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  //SET SELECTED FILE AND PREVIEURL
  const setSelectedFile = (selectedFile) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return selectedFile ? URL.createObjectURL(selectedFile) : null;
    });
    setFile(selectedFile || null);
  };

  const openModal = () => setModalOpen(true);

  const closeModal = () => {
    // Allow closing modal while upload keeps running in background
    setModalOpen(false);
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
      throw new Error("Failed to save media metadata to MongoDb");
    }
  };

  const handleVideoUpload = async (selectedFile) => {
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
    if (!uploadURL || !uid) throw new Error("Invalid upload URL response");

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
        setUploading(false);
        console.error("Upload failed:", err);
        toast.error("Upload nije uspio. Pritisnite dugme ponovo.");
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        setProgress(percentage);
      },
      onSuccess: async () => {
        uploadRef.current = null;

        await saveToDb({
          id: uid,
          contentType: "video",
          fileName: file.name,
          mimeType: file.type,
        });

        setUploading(false);
        setProgress(100);
        clearSelection();
        setLastUploadAt(Date.now());
        setModalOpen(false);
        toast.success("Video je uspješno poslan.🎉");
      },
    });

    uploadRef.current = upload;
    upload.start();
  };

  const handleImageUpload = async (selectedFile) => {
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

    setUploading(false);
    setProgress(100);
    setLastUploadAt(Date.now());
    clearSelection();
    setModalOpen(false);
    toast.success("Slika je uspješno poslana.🎉");
  };

  const shouldWarnSlowNetworkForLargeVideo = (file) => {
    if (!file?.type?.startsWith("video/")) return false;
    const isLarge = file.size > 100 * 1024 * 1024; // 100MB threshold
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (!conn) return false;

    const slow = ["slow-2g", "2g", "3g"].includes(conn.effectiveType);
    //If video file larger than 100MB and user on slow connection return true
    if (isLarge && (slow || conn.saveData)) {
      toast(
        "⚠️ Detektovana sporija mreža. Veći video može trajati duže pri upload-u.",
      );
      return;
    }
  };

  const startUpload = async () => {
    if (!file || uploading) return;

    if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error("Video je prevelik (max 500MB)");
        return;
      }
    } else if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Slika je prevelika (max 15MB)");
        return;
      }
    } else {
      toast.error("Unsupported file type");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      if (file.type.startsWith("video/")) {
        shouldWarnSlowNetworkForLargeVideo(file);
        await handleVideoUpload(file);
      } else {
        await handleImageUpload(file);
      }
    } catch (err) {
      console.error(err);
      setUploading(false);
      toast.error(err.message || "Greška pri uploadu");
    }
  };

  const cancelUpload = () => {
    //Cancel upload only for video
    if (!file?.type?.startsWith("video/")) return;

    if (uploadRef.current) {
      //Abort tus client upload
      uploadRef.current.abort();
      uploadRef.current = null;
    }

    setUploading(false); //set upload flag to false
    setProgress(0); //reset progres
    clearSelection(); //clear file and previewuRL
    closeModal(false); //close upload modal

    toast.success("Upload prekinut.");
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const value = {
    isModalOpen,
    openModal,
    closeModal,

    file,
    previewUrl,
    setSelectedFile,
    clearSelection,

    uploading,
    progress,
    startUpload,
    cancelUpload,

    lastUploadAt, // use this in pages to refresh list after successful upload
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

//FUNKCIJA KOJU MOGU DA KORISTE DRUGE KOMPONENTE
//ZA DOBAVLJANJE KONTEKSTA
export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used inside UploadProvider");
  return ctx;
}
