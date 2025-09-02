"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "./Modal.module.css";

export default function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ y: "100%", opacity: 0 }}   // start from bottom
            animate={{ y: 0, opacity: 1 }}       // slide into place
            exit={{ y: "100%", opacity: 0 }}     // slide back down
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
