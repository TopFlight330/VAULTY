import s from "../dashboard-shell.module.css";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyStateIcon}>{icon}</div>
      <div className={s.emptyStateTitle}>{title}</div>
      <div className={s.emptyStateDesc}>{description}</div>
      {action}
    </div>
  );
}
