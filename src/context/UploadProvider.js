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
  const previewUrlRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  //for updating logic in allgalery after upload
  const [lastUploadAt, setLastUploadAt] = useState(null);
  //for refering to tus upload
  const uploadRef = useRef(null);
  //for cleaning pendingupload on cludflare after cancel
  const videoUidRef = useRef(null);

  //CHECK IF WE ARE ON CROME MOBILE
  const isAndroidChrome = () => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome\//i.test(ua);
    const isEdge = /EdgA\//i.test(ua);
    const isSamsung = /SamsungBrowser\//i.test(ua);
    return isAndroid && isChrome && !isEdge && !isSamsung;
  };

  //SET SELECTED FILE AND PREVIEURL
  const setSelectedFile = (selectedFile) => {
    // revoke old preview first
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setFile(selectedFile || null);

    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    // No blob preview for video on mobile crome browser
    if (selectedFile.type.startsWith("video/") && isAndroidChrome()) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  //CLEAR SELECTED FILE AND PREVIEURL
  const clearSelection = () => setSelectedFile(null);

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
      chunkSize: 20 * 1024 * 1024, // 50MB: fewer PATCH requests on mobile Chrome,
      retryDelays: [0, 1000, 3000, 5000, 10000, 15000, 20000, 30000],
      uploadSize: selectedFile.size,
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
        videoUidRef.current = null;

        await saveToDb({
          id: uid,
          contentType: "video",
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
        });

        setUploading(false);
        setProgress(100);
        clearSelection();
        setLastUploadAt(Date.now()); //to refresh allgalery
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
    setLastUploadAt(Date.now()); //to refresh allgalery
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
    return isLarge && (slow || conn.saveData);
  };

  const startUpload = async () => {
    if (!file || uploading || uploadRef.current) return;

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
        if (shouldWarnSlowNetworkForLargeVideo(file)) {
          toast(
            "⚠️ Detektovana sporija mreža. Veći video može trajati duže pri upload-u.",
          );
        }
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

    setUploading(false); //set upload flag to false
    setProgress(0); //reset progres
    clearSelection(); //clear file
    closeModal(); //close upload modal

    if (uploadRef.current) {
      // Abort in background so UI is not blocked by network stalls.
      const activeUpload = uploadRef.current;
      uploadRef.current = null;
      //The true ensures the fingerprint is removed, preventing accidental resume attempts later.
      activeUpload.abort(true).catch((err) => {
        console.error("Abort failed:", err);
      });
    }

    toast.success("Upload prekinut.");
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

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
