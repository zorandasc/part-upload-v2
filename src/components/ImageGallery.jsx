"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./imagesGallery.module.css";

import ImageModal from "./ImageModal";

//lastImageRef is a React ref callback attached to the last image element in the gallery.
export default function ImageGallery({ images, lastImageRef }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <>
      <section className={styles.uploadedImages}>
        {images?.map((item, i) => {
          const isLast = i === images.length - 1; //determin last image
          return (
            <div
              key={i}
              className={styles.imageContainer}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => setSelectedIndex(i)}
              ref={isLast ? lastImageRef : null} // observe last image
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
