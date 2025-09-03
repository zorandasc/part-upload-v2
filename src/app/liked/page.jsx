"use client";

import React, { useState, useEffect } from "react";
import ImageGallery from "@/components/ImageGallery";
import UploadModal from "@/components/UploadModal";

export default function Liked() {
  const [images, setImages] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const storedImages = localStorage.getItem("likedImages");
    if (storedImages) {
      setImages(JSON.parse(storedImages));
    }
  }, []);

  return (
    <>
      <ImageGallery images={images}></ImageGallery>
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      ></UploadModal>
    </>
  );
}
