"use client";

import styles from "./Navbar.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { FaCircleArrowRight } from "react-icons/fa6";

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className={`${styles.nav} ${pathname != "/" ? styles.bcg : ""}`}>
      <Link href="/" className={styles.logoContainer}>
        <img src="./logo.png" alt="Wedding" className={styles.logo} />{" "}
        <p className={styles.logoName}>
          Party<span>UP</span>
        </p>
      </Link>
      {pathname != "/" && (
        <Link href="/" className={styles.arrowBack}>
          <FaCircleArrowRight />
        </Link>
      )}
    </nav>
  );
}
