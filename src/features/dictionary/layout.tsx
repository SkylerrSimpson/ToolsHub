"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordsProvider } from "./words";
import styles from "./dictionary.module.css";

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dictionary">
      <ul className={styles.nav}>
        {[
          ["/dictionary", "Home"],
          ["/dictionary/word-list", "Word List"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DictionaryLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <WordsProvider>
      <div className={styles.tool}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <BookOpen aria-hidden="true" />
            My dictionary
          </div>
          <Navigation />
        </aside>
        <div className={styles.mobileNav}>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open dictionary navigation">
                <Menu />
              </Button>
            </Dialog.Trigger>
            <span>My dictionary</span>
            <Dialog.Portal>
              <Dialog.Overlay className={styles.overlay} />
              <Dialog.Content className={styles.drawer}>
                <div className={styles.brand}>
                  <BookOpen aria-hidden="true" />
                  <Dialog.Title>My dictionary</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close dictionary navigation">
                      <X />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={styles.srOnly}>
                  Look up a word or open your saved words.
                </Dialog.Description>
                <Navigation onNavigate={() => setOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </WordsProvider>
  );
}
