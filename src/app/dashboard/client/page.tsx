"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useToast } from "@/hooks/useToast";
import styles from "./client-dashboard.module.css";

/* ================================================================
   MOCK DATA
   ================================================================ */
const mockCreators: Record<
  string,
  { name: string; handle: string; initials: string }
> = {
  alexcreates: {
    name: "Alex Creates",
    handle: "@alexcreates",
    initials: "AC",
  },
  sophieart: { name: "Sophie Art", handle: "@sophieart", initials: "SA" },
  mikemusic: { name: "Mike Music", handle: "@mikemusic", initials: "MM" },
  emilyfitness: {
    name: "Emily Fitness",
    handle: "@emilyfitness",
    initials: "EF",
  },
  davecooks: { name: "Dave Cooks", handle: "@davecooks", initials: "DC" },
  linadesign: { name: "Lina Design", handle: "@linadesign", initials: "LD" },
};

const initialSubscriptions = [
  {
    name: "Alex Creates",
    handle: "@alexcreates",
    initials: "AC",
    tier: "premium" as const,
    tierLabel: "Premium",
    renewal: "Mar 15, 2026",
  },
  {
    name: "Sophie Art",
    handle: "@sophieart",
    initials: "SA",
    tier: "basic" as const,
    tierLabel: "Basic",
    renewal: "Mar 3, 2026",
  },
  {
    name: "Mike Music",
    handle: "@mikemusic",
    initials: "MM",
    tier: "vip" as const,
    tierLabel: "VIP",
    renewal: "Apr 1, 2026",
  },
];

interface Transaction {
  date: string;
  type: "purchase" | "subscription" | "tip";
  typeLabel: string;
  desc: string;
  amount: string;
  amountClass: "positive" | "negative";
}

const initialTransactions: Transaction[] = [
  {
    date: "Feb 12, 2026",
    type: "purchase",
    typeLabel: "Credit Purchase",
    desc: "250 credits package",
    amount: "+250",
    amountClass: "positive",
  },
  {
    date: "Feb 10, 2026",
    type: "subscription",
    typeLabel: "Subscription",
    desc: "@alexcreates - Premium",
    amount: "-45",
    amountClass: "negative",
  },
  {
    date: "Feb 8, 2026",
    type: "tip",
    typeLabel: "Tip Sent",
    desc: "@sophieart",
    amount: "-10",
    amountClass: "negative",
  },
  {
    date: "Feb 5, 2026",
    type: "subscription",
    typeLabel: "Subscription",
    desc: "@mikemusic - VIP",
    amount: "-60",
    amountClass: "negative",
  },
  {
    date: "Feb 3, 2026",
    type: "subscription",
    typeLabel: "Subscription",
    desc: "@sophieart - Basic",
    amount: "-15",
    amountClass: "negative",
  },
  {
    date: "Jan 29, 2026",
    type: "purchase",
    typeLabel: "Credit Purchase",
    desc: "100 credits package",
    amount: "+100",
    amountClass: "positive",
  },
  {
    date: "Jan 25, 2026",
    type: "tip",
    typeLabel: "Tip Sent",
    desc: "@alexcreates",
    amount: "-20",
    amountClass: "negative",
  },
  {
    date: "Jan 20, 2026",
    type: "purchase",
    typeLabel: "Credit Purchase",
    desc: "500 credits package",
    amount: "+500",
    amountClass: "positive",
  },
];

const creditPackages = [
  { amount: 50, price: "$4.99", per: "$0.10 / credit", popular: false },
  { amount: 100, price: "$8.99", per: "$0.09 / credit", popular: false },
  { amount: 250, price: "$19.99", per: "$0.08 / credit", popular: true },
  { amount: 500, price: "$34.99", per: "$0.07 / credit", popular: false },
];

type ViewName = "search" | "subscriptions" | "credits" | "settings";

/* ================================================================
   COMPONENT
   ================================================================ */
export default function ClientDashboardPage() {
  const { showToast } = useToast();

  // View switching
  const [activeView, setActiveView] = useState<ViewName>("search");

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    { key: string; name: string; handle: string; initials: string }[]
  >([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Credits
  const [currentCredits, setCurrentCredits] = useState(247);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  // Subscriptions
  const [subscriptions] = useState(initialSubscriptions);

  /* ── View switching ── */
  const switchView = useCallback(
    (view: ViewName) => {
      setActiveView(view);
      setDropdownOpen(false);
    },
    []
  );

  /* ── Dropdown ── */
  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.userMenu}`)) {
        closeDropdown();
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [closeDropdown]);

  /* ── Search ── */
  const handleSearch = useCallback(
    (query: string) => {
      const cleaned = query
        .trim()
        .toLowerCase()
        .replace("@", "")
        .replace(/https?:\/\/vaulty\.com\//, "");

      if (!cleaned) {
        setSearchResults([]);
        setShowEmpty(false);
        return;
      }

      const matches = Object.entries(mockCreators)
        .filter(
          ([key, val]) =>
            key.includes(cleaned) || val.name.toLowerCase().includes(cleaned)
        )
        .map(([key, val]) => ({ key, ...val }));

      if (matches.length > 0) {
        setSearchResults(matches);
        setShowEmpty(false);
      } else {
        setSearchResults([]);
        setShowEmpty(true);
      }
    },
    []
  );

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

  const setSearchAndRun = useCallback(
    (term: string) => {
      setSearchTerm(term);
      handleSearch(term);
    },
    [handleSearch]
  );

  /* ── Credits ── */
  const buyCredits = useCallback(
    (amount: number, price: string) => {
      setCurrentCredits((prev) => prev + amount);

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      setTransactions((prev) => [
        {
          date: dateStr,
          type: "purchase" as const,
          typeLabel: "Credit Purchase",
          desc: `${amount} credits package`,
          amount: "+" + amount,
          amountClass: "positive" as const,
        },
        ...prev,
      ]);

      showToast(`Purchased ${amount} credits for ${price}`, "success");
    },
    [showToast]
  );

  /* ── Delete Account ── */
  const confirmDelete = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      showToast("Account deletion request submitted", "info");
    }
  }, [showToast]);

  /* ── Tier badge class ── */
  const tierClass = (tier: string) => {
    switch (tier) {
      case "basic":
        return styles.subTierBasic;
      case "premium":
        return styles.subTierPremium;
      case "vip":
        return styles.subTierVip;
      default:
        return styles.subTier;
    }
  };

  /* ── Tx dot class ── */
  const txDotClass = (type: string) => {
    switch (type) {
      case "purchase":
        return styles.txDotPurchase;
      case "subscription":
        return styles.txDotSubscription;
      case "tip":
        return styles.txDotTip;
      default:
        return styles.txDot;
    }
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className={styles.dashboardWrapper}>
      {/* ====== TOPBAR ====== */}
      <div className={styles.topbar}>
        <Link href="/" className={styles.topbarLogo}>
          <div className={styles.topbarLogoIcon}>
            <div className={styles.topbarLogoVault}>
              <div className={styles.sp} />
              <div className={styles.sp} />
              <div className={styles.sp} />
              <div className={styles.sp} />
            </div>
          </div>
          <span className={styles.topbarLogoText}>Vaulty</span>
        </Link>

        <div className={styles.topbarRight}>
          <div
            className={styles.creditPill}
            onClick={() => switchView("credits")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
              <path d="M12 6v2m0 8v2" />
            </svg>
            <span className={styles.creditAmt}>
              {currentCredits.toLocaleString()}
            </span>
            <span className={styles.dimText}>credits</span>
          </div>

          <div className={styles.userMenu}>
            <button
              className={styles.userAvatarBtn}
              onClick={toggleDropdown}
            >
              JD
            </button>
            <div
              className={`${styles.userDropdown} ${
                dropdownOpen ? styles.userDropdownOpen : ""
              }`}
            >
              <div className={styles.userDropdownHeader}>
                <div className={styles.userDropdownHeaderName}>John Doe</div>
                <div className={styles.userDropdownHeaderHandle}>@johndoe</div>
              </div>
              <button
                className={styles.userDropdownItem}
                onClick={() => switchView("settings")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Settings
              </button>
              <button
                className={styles.userDropdownItem}
                onClick={() => switchView("credits")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
                  <path d="M12 6v2m0 8v2" />
                </svg>
                Buy Credits
              </button>
              <div className={styles.userDropdownSep} />
              <LogoutButton className={styles.userDropdownItemDanger}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </LogoutButton>
            </div>
          </div>
        </div>
      </div>

      {/* ====== SIDEBAR ====== */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarNav}>
          <div className={styles.sidebarSectionLabel}>Menu</div>

          <button
            className={
              activeView === "search"
                ? styles.sidebarItemActive
                : styles.sidebarItem
            }
            onClick={() => switchView("search")}
          >
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
            Search
          </button>

          <button
            className={
              activeView === "subscriptions"
                ? styles.sidebarItemActive
                : styles.sidebarItem
            }
            onClick={() => switchView("subscriptions")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            My Subscriptions
            <span className={styles.sidebarBadge}>
              {subscriptions.length}
            </span>
          </button>

          <button
            className={
              activeView === "credits"
                ? styles.sidebarItemActive
                : styles.sidebarItem
            }
            onClick={() => switchView("credits")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
              <path d="M12 6v2m0 8v2" />
            </svg>
            Credits
          </button>

          <div className={styles.sidebarSectionLabel}>Account</div>

          <button
            className={
              activeView === "settings"
                ? styles.sidebarItemActive
                : styles.sidebarItem
            }
            onClick={() => switchView("settings")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <LogoutButton className={styles.sidebarLogout}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </LogoutButton>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className={styles.main}>
        {/* ── SEARCH VIEW ── */}
        <div
          className={
            activeView === "search" ? styles.viewActive : styles.view
          }
        >
          <div className={styles.searchContainer}>
            <h1 className={styles.searchTitle}>
              Find <span className={styles.gradText}>Creators</span>
            </h1>
            <p className={styles.searchSubtitle}>
              Discover your favorite creators by searching their @username or
              pasting their profile link. No browsing, no algorithms -- just
              direct connections.
            </p>

            <div className={styles.searchBarWrap}>
              <svg
                className={styles.searchBarIcon}
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
              <input
                type="text"
                className={styles.searchBar}
                placeholder="Search by @username or paste a link"
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => onSearchInput(e.target.value)}
                onKeyDown={onSearchKeyDown}
              />
            </div>
            <p className={styles.searchHint}>
              Try searching{" "}
              <strong
                className={styles.searchHintLinkPink}
                onClick={() => setSearchAndRun("@alexcreates")}
              >
                @alexcreates
              </strong>{" "}
              or{" "}
              <strong
                className={styles.searchHintLinkPurple}
                onClick={() => setSearchAndRun("@sophieart")}
              >
                @sophieart
              </strong>
            </p>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className={styles.searchResult}>
                {searchResults.map((c) => (
                  <div key={c.key} className={styles.searchResultCard}>
                    <div className={styles.searchResultAvatar}>
                      {c.initials}
                    </div>
                    <div className={styles.searchResultInfo}>
                      <div className={styles.searchResultName}>{c.name}</div>
                      <div className={styles.searchResultHandle}>
                        {c.handle}
                      </div>
                    </div>
                    <button
                      className={styles.searchResultAction}
                      onClick={() =>
                        showToast(`Viewing ${c.name}'s profile`, "info")
                      }
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {showEmpty && (
              <div className={styles.searchEmpty}>
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
                <p>
                  No creators found for that username. Check the spelling and
                  try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── SUBSCRIPTIONS VIEW ── */}
        <div
          className={
            activeView === "subscriptions" ? styles.viewActive : styles.view
          }
        >
          <div className={styles.viewHeader}>
            <h1 className={styles.viewHeaderTitle}>My Subscriptions</h1>
            <p className={styles.viewHeaderDesc}>
              Manage your active subscriptions and see renewal dates.
            </p>
          </div>

          {subscriptions.length > 0 ? (
            <div className={styles.subsGrid}>
              {subscriptions.map((sub, i) => (
                <div key={i} className={styles.subCard}>
                  <div className={styles.subCardTop}>
                    <div className={styles.subAvatar}>{sub.initials}</div>
                    <div className={styles.subInfo}>
                      <div className={styles.subName}>{sub.name}</div>
                      <div className={styles.subHandle}>{sub.handle}</div>
                    </div>
                  </div>
                  <div className={styles.subCardDetails}>
                    <span className={tierClass(sub.tier)}>
                      {sub.tierLabel}
                    </span>
                    <span className={styles.subRenewal}>
                      Renews{" "}
                      <span className={styles.subRenewalDate}>
                        {sub.renewal}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.subsEmpty}>
              <div className={styles.subsEmptyIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3 className={styles.subsEmptyTitle}>
                No active subscriptions
              </h3>
              <p className={styles.subsEmptyDesc}>
                Search for creators and subscribe to their content.
              </p>
              <button
                className={styles.subsEmptyBtn}
                onClick={() => switchView("search")}
              >
                Find Creators
              </button>
            </div>
          )}
        </div>

        {/* ── CREDITS VIEW ── */}
        <div
          className={
            activeView === "credits" ? styles.viewActive : styles.view
          }
        >
          <div className={styles.viewHeader}>
            <h1 className={styles.viewHeaderTitle}>Credits</h1>
            <p className={styles.viewHeaderDesc}>
              Buy credits to subscribe to creators and unlock exclusive content.
            </p>
          </div>

          <div className={styles.creditsTop}>
            <div className={styles.balanceCard}>
              <div className={styles.balanceLabel}>Your Balance</div>
              <div className={styles.balanceNumber}>
                {currentCredits.toLocaleString()}
              </div>
              <div className={styles.balanceUsd}>
                Estimated value:{" "}
                <span className={styles.balanceUsdValue}>
                  ~${(currentCredits * 0.091).toFixed(2)}
                </span>
              </div>
            </div>
            <div className={styles.balanceStatsCard}>
              <div className={styles.balanceStatBorder}>
                <span className={styles.balanceStatLabel}>
                  Total purchased
                </span>
                <span className={styles.balanceStatValue}>1,200</span>
              </div>
              <div className={styles.balanceStatBorder}>
                <span className={styles.balanceStatLabel}>
                  Spent on subscriptions
                </span>
                <span className={styles.balanceStatValue}>903</span>
              </div>
              <div className={styles.balanceStat}>
                <span className={styles.balanceStatLabel}>Tips sent</span>
                <span className={styles.balanceStatValue}>50</span>
              </div>
            </div>
          </div>

          <h2 className={styles.creditsSectionTitle}>Buy Credits</h2>
          <div className={styles.creditPackages}>
            {creditPackages.map((pkg) => (
              <div
                key={pkg.amount}
                className={
                  pkg.popular ? styles.creditPkgPopular : styles.creditPkg
                }
                onClick={() => buyCredits(pkg.amount, pkg.price)}
              >
                {pkg.popular && (
                  <div className={styles.creditPkgBadge}>Most Popular</div>
                )}
                <div className={styles.creditPkgAmount}>{pkg.amount}</div>
                <div className={styles.creditPkgLabel}>credits</div>
                <div className={styles.creditPkgPrice}>{pkg.price}</div>
                <div className={styles.creditPkgPer}>{pkg.per}</div>
                <button className={styles.creditPkgBtn}>Purchase</button>
              </div>
            ))}
          </div>

          <h2 className={styles.creditsSectionTitle}>Transaction History</h2>
          <div className={styles.txTableWrap}>
            <table className={styles.txTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className={styles.txAmountColHeader}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i}>
                    <td className={styles.txDateCol}>{tx.date}</td>
                    <td>
                      <span className={styles.txType}>
                        <span className={txDotClass(tx.type)} />
                        {tx.typeLabel}
                      </span>
                    </td>
                    <td>{tx.desc}</td>
                    <td
                      className={`${styles.txAmountCol} ${
                        tx.amountClass === "positive"
                          ? styles.txAmountPositive
                          : styles.txAmountNegative
                      }`}
                    >
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SETTINGS VIEW ── */}
        <div
          className={
            activeView === "settings" ? styles.viewActive : styles.view
          }
        >
          <div className={styles.viewHeader}>
            <h1 className={styles.viewHeaderTitle}>Settings</h1>
            <p className={styles.viewHeaderDesc}>
              Manage your account, profile, and preferences.
            </p>
          </div>

          <div className={styles.settingsSections}>
            {/* Profile */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>
                Profile Information
              </h3>
              <p className={styles.settingsSectionDesc}>
                Update your personal details and profile picture.
              </p>

              <div className={styles.settingsAvatarRow}>
                <div className={styles.settingsAvatar}>JD</div>
                <div className={styles.settingsAvatarActions}>
                  <button
                    className={styles.settingsAvatarUpload}
                    onClick={() =>
                      showToast("Avatar upload coming soon", "info")
                    }
                  >
                    Upload Photo
                  </button>
                  <span className={styles.settingsAvatarHint}>
                    JPG, PNG or GIF. Max 5MB.
                  </span>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroupNoMargin}>
                  <label className={styles.formLabel}>Display Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue="John Doe"
                  />
                </div>
                <div className={styles.formGroupNoMargin}>
                  <label className={styles.formLabel}>Username</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    defaultValue="johndoe"
                    disabled
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  defaultValue="john@example.com"
                />
              </div>
              <div className={styles.formGroupBio}>
                <label className={styles.formLabel}>Bio</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Write a short bio..."
                  defaultValue=""
                />
              </div>

              <button
                className={styles.btnSave}
                onClick={() =>
                  showToast("Profile saved successfully", "success")
                }
              >
                Save Changes
              </button>
            </div>

            {/* Password */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Change Password</h3>
              <p className={styles.settingsSectionDesc}>
                Update your password to keep your account secure.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="Enter current password"
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroupNoMargin}>
                  <label className={styles.formLabel}>New Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    placeholder="Enter new password"
                  />
                </div>
                <div className={styles.formGroupNoMargin}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className={styles.passwordBtnWrap}>
                <button
                  className={styles.btnSave}
                  onClick={() =>
                    showToast("Password updated successfully", "success")
                  }
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Notifications</h3>
              <p className={styles.settingsSectionDesc}>
                Choose which notifications you want to receive.
              </p>

              <div className={styles.toggleRowBorder}>
                <div>
                  <div className={styles.toggleLabel}>New content alerts</div>
                  <div className={styles.toggleDesc}>
                    Get notified when creators you follow post new content.
                  </div>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    className={styles.toggleSwitchInput}
                    defaultChecked
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              <div className={styles.toggleRowBorder}>
                <div>
                  <div className={styles.toggleLabel}>
                    Subscription reminders
                  </div>
                  <div className={styles.toggleDesc}>
                    Get reminded before a subscription renews.
                  </div>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    className={styles.toggleSwitchInput}
                    defaultChecked
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              <div className={styles.toggleRowBorder}>
                <div>
                  <div className={styles.toggleLabel}>
                    Credit balance alerts
                  </div>
                  <div className={styles.toggleDesc}>
                    Get notified when your credit balance is low.
                  </div>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    className={styles.toggleSwitchInput}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Promotional emails</div>
                  <div className={styles.toggleDesc}>
                    Receive updates about new features and offers.
                  </div>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    className={styles.toggleSwitchInput}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className={styles.dangerZone}>
              <h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
              <p className={styles.settingsSectionDesc}>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>

              <button className={styles.btnDanger} onClick={confirmDelete}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
