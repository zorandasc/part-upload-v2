"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./imagesGallery.module.css";

import ImageModal from "./ImageModal";

export default function ImageGallery({ images }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <>
      <section className={styles.uploadedImages}>
        {images?.map((item, i) => {
          return (
            <div
              key={i}
              className={styles.imageContainer}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => setSelectedIndex(i)}
            >
              <Image
                priority
                src={item.url}
                alt="Image"
               fill
                className={styles.image}
                sizes="100%"
              />
            </div>
          );
        })}
      </section>
      <ImageModal
        images={images}
        currentIndex={selectedIndex}
        setCurrentIndex={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      ></ImageModal>
    </>
  );
}
