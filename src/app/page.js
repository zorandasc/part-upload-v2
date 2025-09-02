"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import Modal from "@/components/Modal";
import styles from "./page.module.css";

export default function Home() {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <>
      <div className={styles.wrapperImages}>
        <div className={styles.imagesLine}>
          <div
            className={`${styles.line} ${styles.large}`}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1460978812857-470ed1c77af0?q=80&w=1295&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1681841695231-d674aa32f65b?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={`${styles.line} ${styles.large}`}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1550784718-990c6de52adf?q=80&w=684&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1674581921333-959b929a2e0a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
        </div>
        <div className={styles.imagesLine}>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1711132425055-1c289c69b950?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={`${styles.line} ${styles.large}`}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1673897888993-a1db844c2ca1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1670430623154-24626c42fb33?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={`${styles.line} ${styles.large}`}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1513084012612-05b28297d5bd?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/flagged/photo-1562616382-b884d7188d8a?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
        </div>
        <div className={styles.imagesLine}>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1711189389479-922a74f2263a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={`${styles.line} ${styles.large}`}
            style={{
              backgroundImage:
                "url(https://plus.unsplash.com/premium_photo-1664530452597-fc48cc4a4e45?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1595407753234-0882f1e77954?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={styles.line}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1504993945773-3f38e1b6a626?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
          <div
            className={`${styles.line} ${styles.large}`}
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1494955870715-979ca4f13bf0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
          ></div>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img src="./logo.svg" alt="Natural Pet Bakery" />
        </div>
        <nav className={styles.menu}>
          <Link className={styles.navButton} href="/my">
            Moj sadržaj
          </Link>
          <Link className={styles.navButton} href="/all">
            Sav sadržaj
          </Link>
          <button
            className={styles.navButton}
            onClick={() => setModalOpen(true)}
          >
            + Dodaj fotografiju ili video
          </button>
        </nav>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <h2>Dodaj fotografiju ili video</h2>
        <input
          type="file"
          accept="image/*,video/*"
          className={styles.fileInput}
        />
        <button
          className={styles.uploadBtn}
          onClick={() => setModalOpen(false)}
        >
          Upload
        </button>
      </Modal>
    </>
  );
}
