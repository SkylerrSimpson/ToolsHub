"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, UserRound, XCircle } from "lucide-react";
import type { SavedProfile } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { useProfiles } from "./profiles";
import { safeWebsite } from "./lookup";
import styles from "./devfinder.module.css";

function SavedCard({ profile }: { profile: SavedProfile }) {
  const { remove } = useProfiles();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const avatar = safeWebsite(profile.avatarUrl);
  async function deleteProfile() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await remove(profile.id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not remove this profile. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <li className={styles.savedCard}>
      <div className={styles.savedAvatar}>
        {avatar ? (
          <img
            src={avatar}
            alt={`${profile.login}'s avatar`}
            width={128}
            height={128}
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserRound size={80} aria-label="No avatar available" />
        )}
      </div>
      <h2>@{profile.login}</h2>
      <div className={styles.cardActions}>
        <Link
          href={`/devfinder?profile=${encodeURIComponent(profile.login)}`}
          aria-label={`View ${profile.login}'s profile`}
        >
          <Eye size={27} />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${profile.login} from saved profiles`}
          disabled={pending}
          onClick={deleteProfile}
        >
          <XCircle />
        </Button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </li>
  );
}

export function SavedProfiles() {
  const { profiles, error, loading, retry } = useProfiles();
  return (
    <section aria-label="Saved profiles">
      <h1 className={styles.srOnly}>Saved profiles</h1>
      {loading ? (
        <p role="status" className={styles.listStatus}>
          Loading saved profiles…
        </p>
      ) : error ? (
        <div role="alert" className={styles.notice}>
          <p>{error}</p>
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : profiles.length === 0 ? (
        <p className={styles.listStatus}>
          No profiles available. <Link href="/devfinder">Find a GitHub profile</Link> to save one.
        </p>
      ) : (
        <ul className={styles.savedGrid}>
          {profiles.map((profile) => (
            <SavedCard key={profile.id} profile={profile} />
          ))}
        </ul>
      )}
    </section>
  );
}
