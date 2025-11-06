"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LikedContext = createContext();

export function LikedProvider({ children }) {
  // 🟢 Load liked media once from localStorage (lazy init)
  const [likedMedia, setLikedMedia] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("likedMedia");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn("Failed to parse likedMedia:", error);
      }
    }
    return [];
  });

  // Sync to localStorage whenever likedMedia changes
  useEffect(() => {
    localStorage.setItem("likedMedia", JSON.stringify(likedMedia));
  }, [likedMedia]);

  // 🟢 Helper: toggle like/unlike
  const handleLiked = (mediaInfo) => {
    if (!mediaInfo) return;

    setLikedMedia((prev) => {
      const isLiked = prev.some((m) => m._id === mediaInfo._id);
      if (isLiked) {
        return prev.filter((m) => m._id !== mediaInfo._id);
      } else {
        return [...prev, mediaInfo];
      }
    });
  };

  // 🟢 Helper: check if a media is liked
  const isLiked = (mediaId) =>
    likedMedia.some((m) => m._id === mediaId || m.mediaId === mediaId);

  return (
    <LikedContext.Provider value={{ likedMedia, handleLiked, isLiked }}>
      {children}
    </LikedContext.Provider>
  );
}

export function useLikedContext() {
  return useContext(LikedContext);
}
