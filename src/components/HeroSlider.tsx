import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { Anime } from "../lib/types";
import { Play } from "lucide-react";

export function HeroSlider({ items }: { items: Anime[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const widthRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      widthRef.current = containerRef.current?.offsetWidth ?? 0;
      animate(x, -i * widthRef.current, { duration: 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [i, x]);

  useEffect(() => {
    animate(x, -i * widthRef.current, { type: "spring", stiffness: 260, damping: 32 });
  }, [i, x]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 3000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  const goTo = (idx: number) => setI(((idx % items.length) + items.length) % items.length);

  return (
    <section
      ref={containerRef}
      className="relative mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10 animate-fade-in select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 1500)}
    >
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -(items.length - 1) * (widthRef.current || 0), right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          const w = widthRef.current || 1;
          const offset = info.offset.x;
          const velocity = info.velocity.x;
          if (offset < -w / 4 || velocity < -500) goTo(i + 1);
          else if (offset > w / 4 || velocity > 500) goTo(i - 1);
          else goTo(i);
        }}
      >
        {items.map((a) => (
          <div key={a.id} className="relative w-full shrink-0">
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
              <img
                src={a.banner_url || a.poster_url}
                alt={a.title}
                referrerPolicy="no-referrer"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
              {a.type && (
                <span className="mb-2 inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                  {a.type}
                </span>
              )}
              <h1 className="text-xl md:text-4xl font-bold tracking-tight line-clamp-1">
                {a.title}
              </h1>
              {a.description && (
                <p className="mt-2 max-w-2xl text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {a.description}
                </p>
              )}
              <Link
                to="/anime/$animeId"
                params={{ animeId: a.id }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={(e) => {
                  // prevent click after drag
                  if (Math.abs(x.get() + i * (widthRef.current || 0)) > 5) e.preventDefault();
                }}
              >
                <Play className="h-4 w-4 fill-current" /> Watch Now
              </Link>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="absolute bottom-2 right-3 z-10 flex gap-1">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={
              "h-1.5 rounded-full transition-all " +
              (idx === i ? "w-5 bg-primary" : "w-1.5 bg-white/40")
            }
          />
        ))}
      </div>
    </section>
  );
}
