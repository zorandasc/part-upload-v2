"use client";
import React from "react";
import styles from "./uploadbutton.module.css";
import { FaCirclePlus } from "react-icons/fa6";

const UploadButton = ({ handleClick }) => {
  return (
    <div className={styles.container1}>
      <button className={styles.menu1} onClick={handleClick}>
        <FaCirclePlus />
      </button>
    </div>
  );
};

export default UploadButton;
