import { cn } from "cn";

export function Logo({
  className,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
        <path
          d="M12 2.4 20 5.4v6.3c0 4.9-3.4 8.8-8 10-4.6-1.2-8-5.1-8-10V5.4l8-3Z"
          className="fill-current opacity-10"
        />
        <path
          d="M12 2.4 20 5.4v6.3c0 4.9-3.4 8.8-8 10-4.6-1.2-8-5.1-8-10V5.4l8-3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8.1 11.9h2.6l1.4 2.4 1.5-4.6 1.3 2.2h1.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark ? (
        <span className={cn("text-[15px] font-semibold tracking-[-0.01em]", wordmarkClassName)}>
          Bill Guard
        </span>
      ) : null}
    </span>
  );
}
