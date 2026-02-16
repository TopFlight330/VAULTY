"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import cs from "./client-dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    const cleaned = query
      .trim()
      .toLowerCase()
      .replace("@", "")
      .replace(/https?:\/\/vaulty\.com\//, "");

    if (!cleaned) {
      setResults([]);
      setShowEmpty(false);
      return;
    }

    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "creator")
      .eq("is_banned", false)
      .or(`username.ilike.%${cleaned}%,display_name.ilike.%${cleaned}%`)
      .limit(10);

    const matches = data ?? [];
    setResults(matches);
    setShowEmpty(matches.length === 0);
    setSearching(false);
  }, []);

  const onSearchInput = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
    },
    [handleSearch]
  );

  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        handleSearch(searchTerm);
      }
    },
    [handleSearch, searchTerm]
  );

  return (
    <div>
      <h1 className={cs.searchTitle}>
        Discover <span className={cs.gradText}>Creators</span>
      </h1>
      <p className={cs.searchSubtitle}>
        Search for your favorite creators by name, username, or paste their
        Vaulty link.
      </p>

      <div className={cs.searchBarWrap}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cs.searchBarIcon}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={cs.searchBar}
          placeholder="Search by name, @username, or vaulty.com/@..."
          value={searchTerm}
          onChange={(e) => onSearchInput(e.target.value)}
          onKeyDown={onSearchKeyDown}
        />
      </div>

      <div className={cs.searchHint}>
        {searching ? "Searching..." : "Type to search creators"}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className={cs.searchResult}>
          {results.map((creator) => (
            <Link
              key={creator.id}
              href={`/@${creator.username}`}
              className={cs.searchResultCard}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className={cs.searchResultAvatar}>
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  getInitials(creator.display_name)
                )}
              </div>
              <div className={cs.searchResultInfo}>
                <div className={cs.searchResultName}>
                  {creator.display_name}
                </div>
                <div className={cs.searchResultHandle}>
                  @{creator.username}
                </div>
              </div>
              <span className={cs.searchResultAction}>View Page</span>
            </Link>
          ))}
        </div>
      )}

      {showEmpty && !searching && (
        <div className={cs.searchEmpty}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <div>No creators found matching &quot;{searchTerm}&quot;</div>
        </div>
      )}
    </div>
  );
}
