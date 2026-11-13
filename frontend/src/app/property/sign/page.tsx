"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useExtra } from "@/lib/i18n/extra";
import { api } from "@/lib/api";

/**
 * Printable open-house sign: a large QR code that opens the listing's sign-in form
 * (/property?id=…&openhouse=1). The QR code is generated in the browser.
 */
function OpenHouseSignPage() {
  const id = useSearchParams().get("id") ?? "";
  const { language, setLanguage } = useI18n();
  const X = useExtra();
  const P = X.publicListing;

  const [listing, setListing] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [qr, setQr] = useState("");
  const [signInUrl, setSignInUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/property?id=${id}&openhouse=1`;
    setSignInUrl(url);
    QRCode.toDataURL(url, { width: 640, margin: 1, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
    api(`/api/properties/public/${id}`, { auth: false }).then(setListing).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6">
        <p className="text-foreground/60">{P.notFound}</p>
        <Link href="/public-listings" className="text-primary hover:underline">← {P.back}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="print:hidden border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">{P.signHint}</span>
          <div className="flex items-center gap-3">
            <select value={language} onChange={e => setLanguage(e.target.value as any)} className="border border-gray-300 text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer">
              <option value="en">EN</option><option value="zh-CN">简体</option><option value="zh-TW">繁體</option><option value="es">ES</option>
            </select>
            <button onClick={() => window.print()} className="px-4 py-1.5 bg-black text-white rounded-lg text-sm font-medium">{P.print}</button>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center text-center gap-6">
        <div className="text-sm uppercase tracking-[0.3em] text-gray-500">{listing?.organization?.name ?? ""}</div>
        <h1 className="text-5xl font-bold">{P.openHouseSignIn}</h1>
        {listing && <p className="text-xl text-gray-700">{listing.address}, {listing.city}</p>}
        <p className="text-2xl font-semibold">{P.scanToSignIn}</p>
        {qr ? <img src={qr} alt={P.scanToSignIn} className="w-[420px] h-[420px] max-w-full" /> : <div className="w-[420px] h-[420px] bg-gray-100" />}
        <p className="text-sm text-gray-500 break-all">{P.orVisit} {signInUrl}</p>
        {listing?.agent?.name && <p className="text-base text-gray-700">{P.listedBy} {listing.agent.name}</p>}
      </main>
    </div>
  );
}

// Static export: the id comes from the query string (?id=), read inside a Suspense boundary
export default function OpenHouseSignPageRoute() {
  return (
    <Suspense fallback={null}>
      <OpenHouseSignPage />
    </Suspense>
  );
}
