"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { purchaseCredits } from "@/lib/actions/credits";
import { CREDIT_PACKAGES } from "@/types/database";
import type { Transaction } from "@/types/database";
import cs from "../client-dashboard.module.css";

export default function CreditsPage() {
  const { profile, refreshProfile, user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setTransactions(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleBuyCredits = async (packageId: string) => {
    setPurchasing(packageId);
    const result = await purchaseCredits(packageId);
    if (result.success) {
      showToast(result.message, "success");
      await refreshProfile();
      fetchTransactions();
    } else {
      showToast(result.message, "error");
    }
    setPurchasing(null);
  };

  const balance = profile?.credit_balance ?? 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const txDotClass = (type: string) => {
    if (type.includes("purchase")) return cs.txDotPurchase;
    if (type.includes("subscription")) return cs.txDotSubscription;
    if (type.includes("tip")) return cs.txDotTip;
    if (type.includes("ppv")) return cs.txDotSubscription;
    return cs.txDot;
  };

  const txLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit_purchase: "Credit Purchase",
      subscription_payment: "Subscription",
      tip_sent: "Tip Sent",
      ppv_payment: "PPV Unlock",
      subscription_earning: "Sub Earning",
      tip_received: "Tip Received",
      ppv_earning: "PPV Earning",
    };
    return labels[type] ?? type;
  };

  const isPositive = (type: string) =>
    type === "credit_purchase" ||
    type === "subscription_earning" ||
    type === "tip_received" ||
    type === "ppv_earning";

  // Calculate spending stats
  const thisMonthSpent = transactions
    .filter((t) => {
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();
      return t.created_at >= monthStart && !isPositive(t.type);
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => !isPositive(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-sora)", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.3rem" }}>
          Credits
        </h1>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>
          Manage your balance and purchase credits.
        </p>
      </div>

      <div className={cs.creditsTop}>
        <div className={cs.balanceCard}>
          <div className={cs.balanceLabel}>Your Balance</div>
          <div className={cs.balanceNumber}>
            {balance.toLocaleString()}
          </div>
          <div className={cs.balanceUsd}>credits available</div>
        </div>

        <div className={cs.balanceStatsCard}>
          <div className={cs.balanceStatBorder}>
            <span className={cs.balanceStatLabel}>Spent this month</span>
            <span className={cs.balanceStatValue}>
              {thisMonthSpent.toLocaleString()} credits
            </span>
          </div>
          <div className={cs.balanceStat}>
            <span className={cs.balanceStatLabel}>Total spent</span>
            <span className={cs.balanceStatValue}>
              {totalSpent.toLocaleString()} credits
            </span>
          </div>
        </div>
      </div>

      <div className={cs.creditsSectionTitle}>Buy Credits</div>
      <div className={cs.creditPackages}>
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={pkg.popular ? cs.creditPkgPopular : cs.creditPkg}
          >
            {pkg.popular && (
              <div className={cs.creditPkgBadge}>Most Popular</div>
            )}
            <div className={cs.creditPkgAmount}>
              {pkg.amount.toLocaleString()}
            </div>
            <div className={cs.creditPkgLabel}>credits</div>
            <div className={cs.creditPkgPrice}>{pkg.price}</div>
            <div className={cs.creditPkgPer}>{pkg.per_credit} / credit</div>
            <button
              className={cs.creditPkgBtn}
              onClick={() => handleBuyCredits(pkg.id)}
              disabled={purchasing === pkg.id}
            >
              {purchasing === pkg.id ? "Purchasing..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      <div className={cs.creditsSectionTitle}>Transaction History</div>
      {loading ? (
        <div className={cs.txTableWrap}>
          <table className={cs.txTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th className={cs.txAmountColHeader}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><div style={{ height: 14, width: 80, background: "var(--input-bg)", borderRadius: 6 }} /></td>
                  <td><div style={{ height: 14, width: 80, background: "var(--input-bg)", borderRadius: 6 }} /></td>
                  <td><div style={{ height: 14, width: 120, background: "var(--input-bg)", borderRadius: 6 }} /></td>
                  <td><div style={{ height: 14, width: 40, background: "var(--input-bg)", borderRadius: 6, marginLeft: "auto" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--dim)", fontSize: "0.88rem" }}>
          No transactions yet. Buy credits to get started!
        </div>
      ) : (
        <div className={cs.txTableWrap}>
          <table className={cs.txTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th className={cs.txAmountColHeader}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className={cs.txDateCol}>{formatDate(tx.created_at)}</td>
                  <td>
                    <span className={cs.txType}>
                      <span className={txDotClass(tx.type)} />
                      {txLabel(tx.type)}
                    </span>
                  </td>
                  <td>{tx.description}</td>
                  <td
                    className={`${cs.txAmountCol} ${
                      isPositive(tx.type) ? cs.txAmountPositive : cs.txAmountNegative
                    }`}
                    style={{ fontWeight: 800 }}
                  >
                    {isPositive(tx.type) ? "+" : "-"}
                    {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
