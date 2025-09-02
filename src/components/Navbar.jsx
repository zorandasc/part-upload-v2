import styles from "./Navbar.module.css";
import Link from "next/link";
export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logoContainer}>
        <img src="./logo2.png" alt="Wedding" className={styles.logo} />{" "}
        <p className={styles.logoName}>
          Party<span>UP</span>
        </p>
      </div>
    </nav>
  );
}
