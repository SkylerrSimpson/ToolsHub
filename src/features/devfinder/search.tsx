"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  CirclePlus,
  Link as LinkIcon,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupProfile, type GithubProfile } from "./lookup";
import { useProfiles } from "./profiles";
import styles from "./devfinder.module.css";

function ProfileCard({ profile }: { profile: GithubProfile }) {
  const profiles = useProfiles();
  const saved = profiles.profiles.some((value) => value.id === profile.id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const joined = profile.joined
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(profile.joined))
    : "Unknown Date";
  async function toggleSave() {
    if (pending || (!saved && !profile.avatarUrl)) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      if (saved) {
        await profiles.remove(profile.id);
        setMessage(`Removed ${profile.login} from saved profiles.`);
      } else {
        await profiles.add({
          id: profile.id,
          login: profile.login,
          avatarUrl: profile.avatarUrl ?? "",
        });
        setMessage(`Saved ${profile.login}.`);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update saved profiles. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <article className={styles.profile} aria-label={`${profile.login} profile`}>
      <div className={styles.avatar}>
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${profile.login}'s avatar`}
            width={160}
            height={160}
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserRound aria-label="No avatar available" size={80} />
        )}
      </div>
      <div className={styles.identity}>
        <div>
          <h1>{profile.name ?? "Unknown User"}</h1>
          <p className={styles.handle}>@{profile.login}</p>
        </div>
        <Button
          className={`${styles.saveButton} ${saved ? styles.saved : ""}`}
          variant="ghost"
          size="icon"
          aria-label={
            saved ? `Remove ${profile.login} from saved profiles` : `Save ${profile.login}`
          }
          aria-pressed={saved}
          onClick={toggleSave}
          disabled={
            pending || profiles.loading || Boolean(profiles.error) || (!saved && !profile.avatarUrl)
          }
        >
          {saved ? <CheckCircle2 /> : <CirclePlus />}
        </Button>
      </div>
      {!saved && !profile.avatarUrl && (
        <p className={styles.cardError}>
          Saving is unavailable because GitHub did not provide a supported avatar.
        </p>
      )}
      <div className={styles.biography}>
        <p className={!profile.bio ? styles.unavailable : undefined}>
          {profile.bio ?? "This profile has no Bio"}
        </p>
        <p className={styles.joined}>{profile.joined ? `Joined ${joined}` : joined}</p>
      </div>
      {error && (
        <p className={styles.cardError} role="alert">
          {error}
        </p>
      )}
      <p className={styles.srOnly} role="status">
        {message}
      </p>
      <dl className={styles.stats}>
        <div>
          <dt>Repos</dt>
          <dd>{profile.repos ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Followers</dt>
          <dd>{profile.followers ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Following</dt>
          <dd>{profile.following ?? "Unknown"}</dd>
        </div>
      </dl>
      <dl className={styles.socials}>
        <div>
          <dt>
            <MapPin size={20} aria-hidden="true" />
            <span className={styles.srOnly}>Location</span>
          </dt>
          <dd className={!profile.location ? styles.unavailable : undefined}>
            {profile.location ?? "Not Available"}
          </dd>
        </div>
        <div>
          <dt>
            <span aria-hidden="true" className={styles.at}>
              @
            </span>
            <span className={styles.srOnly}>Twitter username</span>
          </dt>
          <dd className={!profile.twitter ? styles.unavailable : undefined}>
            {profile.twitter ?? "Not Available"}
          </dd>
        </div>
        <div>
          <dt>
            <LinkIcon size={20} aria-hidden="true" />
            <span className={styles.srOnly}>Website</span>
          </dt>
          <dd>
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                {profile.websiteLabel}
                <span className={styles.srOnly}> (opens in a new tab)</span>
              </a>
            ) : (
              <span className={styles.unavailable}>Not Available</span>
            )}
          </dd>
        </div>
        <div>
          <dt>
            <Building2 size={20} aria-hidden="true" />
            <span className={styles.srOnly}>Company</span>
          </dt>
          <dd className={!profile.company ? styles.unavailable : undefined}>
            {profile.company ?? "Not Available"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ProfileSearch() {
  const params = useSearchParams();
  const initial = params.get("profile")?.trim() || "octocat";
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const [profile, setProfile] = useState<GithubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const profiles = useProfiles();
  useEffect(() => {
    setInput(initial);
    setQuery(initial);
  }, [initial]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setProfile(null);
    lookupProfile(query, controller.signal)
      .then((profile) => {
        if (!controller.signal.aborted) setProfile(profile);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof TypeError
              ? "Could not reach GitHub. Check your connection and try again."
              : error instanceof Error
                ? error.message
                : "Could not look up this profile.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, attempt]);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setQuery(value);
    setAttempt((value) => value + 1);
  }
  return (
    <section className={styles.home} aria-label="GitHub profile lookup">
      <form className={styles.search} onSubmit={search} role="search">
        <Search className={styles.searchIcon} aria-hidden="true" />
        <label htmlFor="github-username" className={styles.srOnly}>
          GitHub username
        </label>
        <Input
          id="github-username"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={100}
          placeholder="Search GitHub username…"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <Button type="submit" disabled={!input.trim()}>
          Search
        </Button>
      </form>
      {profiles.error && (
        <div className={styles.notice} role="alert">
          <p>Saved profiles could not be loaded. You can still search GitHub.</p>
          <p>{profiles.error}</p>
          <Button variant="outline" size="sm" onClick={profiles.retry}>
            Retry saved profiles
          </Button>
        </div>
      )}
      {loading && (
        <div className={styles.empty} role="status">
          <Search size={38} aria-hidden="true" />
          <p>Looking up @{query}…</p>
        </div>
      )}
      {error && (
        <div className={styles.empty} role="alert">
          <UserRound size={50} aria-hidden="true" />
          <p>{error}</p>
          <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </Button>
        </div>
      )}
      {profile && !loading && <ProfileCard key={profile.id} profile={profile} />}
    </section>
  );
}
