import React, { useState, useEffect } from "react";
import { ExternalLink, X, AlertTriangle, Smartphone, ChevronDown, ChevronUp } from "lucide-react";

export function LineBrowserBanner() {
  const [show, setShow] = useState(false);
  const [isLine, setIsLine] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Check if dismissed in this session
    if (sessionStorage.getItem("line_browser_banner_dismissed") === "1") {
      return;
    }

    const ua = navigator.userAgent || "";
    const lineDetected = /Line\//i.test(ua);
    const inAppDetected = lineDetected || /Instagram|FBAN|FBAV|Twitter|MicroMessenger/i.test(ua);
    const iosDetected = /iPhone|iPad|iPod/i.test(ua);

    setIsLine(lineDetected);
    setIsIos(iosDetected);

    if (inAppDetected) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("line_browser_banner_dismissed", "1");
  };

  // Build external browser URL for LINE
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("openExternalBrowser", "1");
  const externalBrowserUrl = currentUrl.toString();

  return (
    <aside aria-label="ブラウザ環境に関するお知らせ" className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-forest-800 to-forest-900 text-white shadow-lg border-b border-forest-700/50 safe-top animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg shrink-0 mt-0.5 border border-amber-400/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {isLine ? "LINE内ブラウザで表示中" : "アプリ内ブラウザで表示中"}
                </span>
              </div>
              <p className="text-xs text-forest-100 mt-1 leading-snug">
                カメラ撮影や端末間データ保存を快適に行うため、
                <strong className="text-white font-bold">
                  {isIos ? "Safari" : "Chrome（標準ブラウザ）"}
                </strong>
                でのご利用を強く推奨します。
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-forest-300 hover:text-white hover:bg-forest-700/50 rounded-lg transition-colors shrink-0"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row */}
        <div className="mt-2.5 pt-2.5 border-t border-forest-700/60 flex flex-wrap items-center justify-between gap-2">
          {/* Direct External Browser Button for LINE */}
          {isLine && (
            <a
              href={externalBrowserUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-forest-950 hover:bg-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isIos ? "Safariで開く" : "標準ブラウザで開く"}</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1 text-xs text-forest-200 hover:text-white transition-colors py-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>開く手順を確認</span>
            {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Detailed Guide Accordion */}
        {showGuide && (
          <div className="mt-2.5 p-3 bg-forest-950/70 rounded-xl border border-forest-700/50 text-xs text-forest-100 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>{isIos ? "iPhone（Safari）で開く手順:" : "Android（Chrome）で開く手順:"}</span>
            </p>
            {isIos ? (
              <ol className="list-decimal pl-4 space-y-1 text-forest-200">
                <li>
                  画面右上（または右下）にあるメニューボタン
                  <span className="font-bold text-white px-1 py-0.5 bg-forest-800 rounded mx-1">「…」</span>
                  をタップします。
                </li>
                <li>
                  メニューから
                  <span className="font-bold text-amber-300 px-1 py-0.5 bg-forest-800 rounded mx-1">「Safariで開く」</span>
                  または「デフォルトのブラウザで開く」を選択します。
                </li>
              </ol>
            ) : (
              <ol className="list-decimal pl-4 space-y-1 text-forest-200">
                <li>
                  画面右上にあるメニューボタン
                  <span className="font-bold text-white px-1 py-0.5 bg-forest-800 rounded mx-1">「⋮」</span>
                  をタップします。
                </li>
                <li>
                  メニューから
                  <span className="font-bold text-amber-300 px-1 py-0.5 bg-forest-800 rounded mx-1">「他のアプリで開く」</span>
                  または「ブラウザで開く」を選択します。
                </li>
              </ol>
            )}
            <p className="text-[11px] text-forest-300 pt-1">
              ※標準ブラウザで開くと、撮影時の再読み込みやデータ消失を防ぎ、安定して利用できます。
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
