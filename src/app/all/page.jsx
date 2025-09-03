"use client";

import { useState } from "react";
import ImageGallery from "@/components/ImageGallery";
import UploadButton from "@/components/UploadButton";
import UploadModal from "@/components/UploadModal";

export default function All() {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <>
      <ImageGallery></ImageGallery>
      <UploadButton handleClick={() => setModalOpen(true)}></UploadButton>
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      ></UploadModal>
    </>
  );
}
