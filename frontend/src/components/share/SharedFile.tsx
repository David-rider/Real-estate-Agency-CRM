"use client";

import React, { useEffect, useRef, useState } from "react";

// One shared document drawn into canvases, with the viewer's watermark painted into the pixels.
// PDFs are rendered page by page with pdf.js (each page only when it scrolls near the screen); images become one "page".
// The watermark only discourages forwarding — it cannot stop a screenshot, and the screen says so.

type Props = {
  url: string;
  kind: "pdf" | "image";
  watermark: string | null;
  pageLabel: (n: number) => string;
  errorText: string;
  // Called when a page becomes the one mostly on screen (used for view tracking)
  onPageVisible?: (page: number) => void;
  // Asks for a fresh address when the 10-minute one has expired
  refreshUrl?: () => Promise<string | null>;
};

// Diagonal repeated text across the whole canvas
function paintWatermark(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = Math.max(14, Math.round(canvas.width / 38));
  ctx.save();
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = "rgba(120, 120, 120, 0.22)";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6);
  const step = size * 7;
  const span = Math.hypot(canvas.width, canvas.height);
  for (let y = -span; y < span; y += step) {
    for (let x = -span; x < span; x += ctx.measureText(text).width + size * 4) ctx.fillText(text, x, y);
  }
  ctx.restore();
}

async function fetchBytes(url: string, refreshUrl?: () => Promise<string | null>): Promise<ArrayBuffer> {
  let res = await fetch(url);
  if (!res.ok && refreshUrl) {
    const fresh = await refreshUrl();
    if (fresh) res = await fetch(fresh);
  }
  if (!res.ok) throw new Error(String(res.status));
  return res.arrayBuffer();
}

type PdfDoc = { numPages: number; getPage(n: number): Promise<any> };
let workerReady = false;

async function loadPdf(data: ArrayBuffer): Promise<PdfDoc> {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
    workerReady = true;
  }
  return pdfjs.getDocument({ data }).promise as Promise<PdfDoc>;
}

function PdfPage({ doc, n, width, watermark, label, onVisible }: { doc: PdfDoc; n: number; width: number; watermark: string | null; label: string; onVisible?: (n: number) => void }) {
  const holder = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [ratio, setRatio] = useState(1.294); // US Letter until the page tells us
  const [near, setNear] = useState(n === 1);
  const drawn = useRef(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setNear(true);
        if (e.intersectionRatio >= 0.5) onVisible?.(n);
      }
    }, { rootMargin: "600px 0px", threshold: [0, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [n, onVisible]);

  useEffect(() => {
    if (!near || drawn.current || !canvas.current || !width) return;
    drawn.current = true;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      if (cancelled) return;
      setRatio(base.height / base.width);
      const scale = (width / base.width) * Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale });
      const c = canvas.current!;
      c.width = Math.floor(viewport.width);
      c.height = Math.floor(viewport.height);
      await page.render({ canvas: c, viewport }).promise;
      if (!cancelled && watermark) paintWatermark(c, watermark);
    })().catch(() => { drawn.current = false; });
    return () => { cancelled = true; };
  }, [near, doc, n, width, watermark]);

  return (
    <div ref={holder} className="relative bg-white shadow-sm" style={{ width, height: Math.round(width * ratio) }} aria-label={label}>
      <canvas ref={canvas} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />
      <span className="absolute bottom-1 right-2 text-[10px] text-gray-400 select-none">{label}</span>
    </div>
  );
}

export default function SharedFile({ url, kind, watermark, pageLabel, errorText, onPageVisible, refreshUrl }: Props) {
  const box = useRef<HTMLDivElement | null>(null);
  const imageCanvas = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(0);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [failed, setFailed] = useState(false);

  // Pages follow the width of the column (re-measured when the window changes)
  useEffect(() => {
    const measure = () => setWidth(Math.min(box.current?.clientWidth || 0, 900));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    (async () => {
      const bytes = await fetchBytes(url, refreshUrl);
      if (cancelled) return;
      if (kind === "pdf") {
        const d = await loadPdf(bytes);
        if (cancelled) return;
        setDoc(d);
        onPageVisible?.(1); // the first page is on screen when the document opens; scrolling updates it
      } else {
        const bitmap = await createImageBitmap(new Blob([bytes]));
        const c = imageCanvas.current;
        if (cancelled || !c) return;
        c.width = bitmap.width;
        c.height = bitmap.height;
        c.getContext("2d")?.drawImage(bitmap, 0, 0);
        if (watermark) paintWatermark(c, watermark);
        onPageVisible?.(1);
      }
    })().catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, kind, watermark]);

  return (
    <div ref={box} className="w-full flex flex-col items-center gap-4">
      {failed && <p className="text-sm text-foreground/60 py-6">{errorText}</p>}
      {kind === "image" && !failed && (
        <canvas ref={imageCanvas} className="max-w-full h-auto bg-white shadow-sm" style={{ maxWidth: 900 }} onContextMenu={(e) => e.preventDefault()} />
      )}
      {kind === "pdf" && doc && width > 0 &&
        Array.from({ length: doc.numPages }, (_, i) => (
          <PdfPage key={i} doc={doc} n={i + 1} width={width} watermark={watermark} label={pageLabel(i + 1)} onVisible={onPageVisible} />
        ))}
    </div>
  );
}
