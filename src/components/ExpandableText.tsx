import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  /** Collapsed line count. */
  lines?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
  buttonClassName?: string;
};

/**
 * Renders text clamped to `lines`, and only shows the more/less toggle when the
 * text ACTUALLY overflows (measured from the DOM, not guessed from length).
 */
export function ExpandableText({
  text,
  lines = 4,
  className = "",
  moreLabel = "Lebih banyak",
  lessLabel = "Lebih sedikit",
  buttonClassName = "mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-400",
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (open) return; // only measurable while clamped
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight - el.clientHeight > 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open, lines]);

  return (
    <>
      <p
        ref={ref}
        className={className}
        style={
          open
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {overflows && (
        <button type="button" onClick={() => setOpen((v) => !v)} className={buttonClassName}>
          {open ? lessLabel : moreLabel}
          <span aria-hidden>{open ? "‹" : "›"}</span>
        </button>
      )}
    </>
  );
}
