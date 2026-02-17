"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEarningsData } from "@/lib/actions/dashboard";
import type { Transaction } from "@/types/database";
import s from "../dashboard.module.css";

type Period = "month" | "last" | "all";

interface EarningsEntry {
  subs: number;
  tips: number;
  ppv: number;
  total: number;
}

export default function EarningsPage() {
  const { profile, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { transactions: fetched } = await getEarningsData();
    setTransactions(fetched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const calcEarnings = (txs: Transaction[]): EarningsEntry => {
    const subs = txs
      .filter((t) => t.type === "subscription_earning")
      .reduce((sum, t) => sum + t.amount, 0);
    const tips = txs
      .filter((t) => t.type === "tip_received")
      .reduce((sum, t) => sum + t.amount, 0);
    const ppv = txs
      .filter((t) => t.type === "ppv_earning")
      .reduce((sum, t) => sum + t.amount, 0);
    return { subs, tips, ppv, total: subs + tips + ppv };
  };

  const earningsData: Record<Period, EarningsEntry> = {
    month: calcEarnings(
      transactions.filter((t) => t.created_at >= monthStart)
    ),
    last: calcEarnings(
      transactions.filter(
        (t) => t.created_at >= lastMonthStart && t.created_at < monthStart
      )
    ),
    all: calcEarnings(transactions),
  };

  const earningsForPeriod = earningsData[currentPeriod];
  const periodLabel =
    currentPeriod === "month"
      ? "This Month"
      : currentPeriod === "last"
        ? "Last Month"
        : "All Time";

  // Build chart data from last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const value = transactions
      .filter((t) => t.created_at >= d.toISOString() && t.created_at < end.toISOString())
      .reduce((sum, t) => sum + t.amount, 0);
    return { label, value };
  });

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);
  const balance = profile?.credit_balance ?? 0;

  if (loading) {
    return (
      <div>
        <div className={s.viewHeader}>
          <h1>Earnings</h1>
          <p>Loading your earnings data...</p>
        </div>
        <div className={s.earningsBigCard}>
          <div style={{ height: 14, width: "30%", background: "var(--input-bg)", borderRadius: 8, marginBottom: "0.75rem" }} />
          <div style={{ height: 48, width: "50%", background: "var(--input-bg)", borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={s.viewHeader}>
        <h1>Earnings</h1>
        <p>Track your revenue and manage your balance.</p>
      </div>

      <div className={s.earningsBigCard}>
        <div className={s.earningsBigLabel}>Total Earnings (All Time)</div>
        <div className={s.earningsBigValue}>
          {earningsData.all.total.toLocaleString()} credits
        </div>
      </div>

      <div className={s.periodTabs}>
        {(["month", "last", "all"] as Period[]).map((period) => (
          <button
            key={period}
            className={`${s.periodTab} ${currentPeriod === period ? s.periodTabActive : ""}`}
            onClick={() => setCurrentPeriod(period)}
          >
            {period === "month"
              ? "This Month"
              : period === "last"
                ? "Last Month"
                : "All Time"}
          </button>
        ))}
      </div>

      <div className={s.earningsBreakdown}>
        <div className={s.breakdownCard}>
          <div className={s.breakdownLabel}>Subscriptions</div>
          <div className={s.breakdownValue}>
            {earningsForPeriod.subs.toLocaleString()}
          </div>
          <div className={s.breakdownPct}>
            {earningsForPeriod.total > 0
              ? Math.round(
                  (earningsForPeriod.subs / earningsForPeriod.total) * 100
                )
              : 0}
            % of {periodLabel.toLowerCase()} revenue
          </div>
        </div>
        <div className={s.breakdownCard}>
          <div className={s.breakdownLabel}>Tips</div>
          <div className={s.breakdownValue}>
            {earningsForPeriod.tips.toLocaleString()}
          </div>
          <div className={s.breakdownPct}>
            {earningsForPeriod.total > 0
              ? Math.round(
                  (earningsForPeriod.tips / earningsForPeriod.total) * 100
                )
              : 0}
            % of {periodLabel.toLowerCase()} revenue
          </div>
        </div>
        <div className={s.breakdownCard}>
          <div className={s.breakdownLabel}>PPV Content</div>
          <div className={s.breakdownValue}>
            {earningsForPeriod.ppv.toLocaleString()}
          </div>
          <div className={s.breakdownPct}>
            {earningsForPeriod.total > 0
              ? Math.round(
                  (earningsForPeriod.ppv / earningsForPeriod.total) * 100
                )
              : 0}
            % of {periodLabel.toLowerCase()} revenue
          </div>
        </div>
      </div>

      <div className={s.chartSection}>
        <div className={s.chartTitle}>Earnings - Last 6 Months</div>
        <div className={s.chartCard}>
          <div className={s.barChart}>
            {chartData.map((d) => {
              const pct = Math.round((d.value / maxChartValue) * 100);
              return (
                <div key={d.label} className={s.barCol}>
                  <div className={s.barValue}>
                    {d.value.toLocaleString()}
                  </div>
                  <div
                    className={s.bar}
                    style={{ height: `${Math.max(pct, 3)}%` }}
                    title={`${d.value.toLocaleString()} credits`}
                  />
                  <div className={s.barLabel}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={s.withdrawCard}>
        <div className={s.withdrawInfo}>
          <div className={s.withdrawLabel}>Current Balance</div>
          <div className={`${s.withdrawAmount} ${s.gradText}`}>
            {balance.toLocaleString()} credits
          </div>
        </div>
      </div>
    </div>
  );
}
