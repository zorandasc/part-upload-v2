"use client";

import styles from "./Navbar.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { FaCircleArrowRight } from "react-icons/fa6";
import { GrUserAdmin } from "react-icons/gr";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { useUserContext } from "@/context/UserContext";
import { toast } from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUserContext();

  const username =
    typeof user === "string"
      ? user
      : user?.user?.username || user?.username || null;

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
      toast.success("Odjavljeni ste.");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Greška pri odjavi.");
    }
  };

  return (
    <nav className={`${styles.nav} ${pathname != "/" ? styles.bcg : ""}`}>
      <Link href="/" className={styles.logoContainer}>
        <img src="./logo.png" alt="Wedding" className={styles.logo} />{" "}
        <p className={styles.logoName}>
          Party<span>UP</span>
        </p>
      </Link>

      <div className={styles.rightActions}>
        {username && (
          <div className={styles.adminBadge} title={`Admin: ${username}`}>
            <GrUserAdmin />
            <span>{username}</span>
          </div>
        )}

        {username && (
          <button
            type="button"
            onClick={handleLogout}
            className={styles.iconBtn}
            aria-label="Logout"
            title="Logout"
          >
            <RiLogoutBoxRLine />
          </button>
        )}

        {pathname != "/" && (
          <Link href="/" className={styles.arrowBack}>
            <FaCircleArrowRight />
          </Link>
        )}
      </div>
    </nav>
  );
}
