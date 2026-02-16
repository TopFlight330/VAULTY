import s from "../dashboard-shell.module.css";

export function LoadingSkeleton({ lines = 3, blocks = 0 }: { lines?: number; blocks?: number }) {
  return (
    <div>
      {Array.from({ length: blocks }).map((_, i) => (
        <div key={`b${i}`} className={`${s.skeleton} ${s.skeletonBlock}`} />
      ))}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={`l${i}`}
          className={`${s.skeleton} ${s.skeletonLine}`}
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className={s.statCards}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={s.statCard}>
          <div className={`${s.skeleton}`} style={{ width: 40, height: 40, borderRadius: 12, marginBottom: "1rem" }} />
          <div className={`${s.skeleton} ${s.skeletonLine}`} style={{ width: "50%" }} />
          <div className={`${s.skeleton} ${s.skeletonLine}`} style={{ width: "70%", height: 28 }} />
        </div>
      ))}
    </div>
  );
}
