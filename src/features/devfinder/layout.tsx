"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfilesProvider } from "./profiles";
import styles from "./devfinder.module.css";

export function DevfinderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ProfilesProvider>
      <div className={styles.tool}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/devfinder">
            devfinder
          </Link>
          <nav aria-label="Devfinder">
            <ul>
              <li>
                <Link
                  href="/devfinder"
                  aria-current={pathname === "/devfinder" ? "page" : undefined}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/devfinder/saved-profiles"
                  aria-current={pathname === "/devfinder/saved-profiles" ? "page" : undefined}
                >
                  Profiles
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </ProfilesProvider>
  );
}
