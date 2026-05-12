"use client";

import { useEffect, useRef, useState } from "react";

type Image360 = {
  id: string;
  image_url: string;
  label: string;
  position: number;
};

type Property360 = {
  id: string;
  title: string;
  show_title: boolean;
  thumbnail_url: string | null;
  external_url: string | null;
  property_360_images: Image360[];
};

declare global {
  interface Window {
    pannellum: {
      viewer: (
        container: HTMLElement,
        config: Record<string, unknown>
      ) => { destroy(): void };
    };
  }
}

export function Property360Section({
  properties,
}: {
  properties: Property360[];
}) {
  const [activeProperty, setActiveProperty] = useState<Property360 | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumRef = useRef<{ destroy(): void } | null>(null);

  // Carrega Pannellum CSS + JS do CDN uma vez
  useEffect(() => {
    if (!document.getElementById("pannellum-css")) {
      const link = document.createElement("link");
      link.id = "pannellum-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("pannellum-js")) {
      const script = document.createElement("script");
      script.id = "pannellum-js";
      script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
      document.head.appendChild(script);
    }
  }, []);

  const currentImage = activeProperty?.property_360_images?.[activeIdx];

  // Inicia/atualiza o viewer quando a imagem muda
  useEffect(() => {
    if (!currentImage?.image_url) return;

    function init() {
      if (!window.pannellum || !viewerRef.current) return;
      try { pannellumRef.current?.destroy(); } catch { /* ignorar */ }
      viewerRef.current.innerHTML = "";
      pannellumRef.current = window.pannellum.viewer(viewerRef.current, {
        type: "equirectangular",
        panorama: currentImage!.image_url,
        autoLoad: true,
        autoRotate: -2,
        compass: false,
        showControls: false,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
      });
    }

    const run = () => setTimeout(init, 80);
    if (window.pannellum) run();
    else document.getElementById("pannellum-js")?.addEventListener("load", run, { once: true });

    return () => {
      try { pannellumRef.current?.destroy(); } catch { /* ignorar */ }
      pannellumRef.current = null;
    };
  }, [currentImage]);

  // Fecha com Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function open(p: Property360) {
    const imgs = [...(p.property_360_images ?? [])].sort((a, b) => a.position - b.position);
    if (imgs.length > 0) {
      setActiveIdx(0);
      setActiveProperty({ ...p, property_360_images: imgs });
    } else if (p.external_url) {
      window.open(p.external_url, "_blank", "noopener,noreferrer");
    }
  }

  function close() {
    try { pannellumRef.current?.destroy(); } catch { /* ignorar */ }
    pannellumRef.current = null;
    setActiveProperty(null);
    setActiveIdx(0);
  }

  function switchImage(idx: number) {
    setActiveIdx(idx);
  }

  return (
    <>
      {/* Cards horizontais */}
      <div className="video-scroll-wrapper">
        <div className="video-grid">
          {properties.map((p) => {
            const count = p.property_360_images?.length ?? 0;
            return (
              <button
                key={p.id}
                onClick={() => open(p)}
                className="p360-card"
                aria-label={`Ver ${p.title} em 360°`}
              >
                {p.thumbnail_url && (
                  <img src={p.thumbnail_url} alt={p.title} className="p360-thumb" />
                )}
                <div className="video-card-overlay" />

                <div className="p360-badge"><span>360°</span></div>

                {count > 1 && (
                  <div className="p360-count"><span>{count} ambientes</span></div>
                )}

                <div className="p360-icon-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
                  </svg>
                </div>

                <div className="video-info">
                  {p.show_title !== false && (
                    <span className="video-info-title">{p.title}</span>
                  )}
                  <span className="video-info-cta" style={{ color: "#B8966E" }}>
                    {count > 1
                      ? `VER ${count} AMBIENTES`
                      : count === 1
                      ? "VER EM 360°"
                      : "VER IMÓVEL"}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" style={{ width: 9, height: 9 }}>
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}

          {/* Placeholders para garantir overflow */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="video-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
              </svg>
              <span>Em breve</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal viewer */}
      {activeProperty && (
        <div className="p360-modal" onClick={close}>
          <div className="p360-modal-inner" onClick={(e) => e.stopPropagation()}>

            {/* Cabeçalho */}
            <div className="p360-modal-header">
              <div className="p360-modal-title-wrap">
                <span className="p360-modal-eyebrow">imóvel em 360°</span>
                <span className="p360-modal-title">{activeProperty.title}</span>
              </div>
              <div className="p360-modal-actions">
                {activeProperty.external_url && (
                  <a
                    href={activeProperty.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p360-modal-link"
                  >
                    Ver vídeo →
                  </a>
                )}
                <button onClick={close} className="p360-modal-close" aria-label="Fechar">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" style={{ width: 11, height: 11 }}>
                    <path d="M2 2l12 12M14 2L2 14" />
                  </svg>
                  <span>Fechar</span>
                </button>
              </div>
            </div>

            {/* Viewer Pannellum */}
            <div ref={viewerRef} className="p360-viewer" />

            {/* Navegação entre ambientes */}
            {activeProperty.property_360_images.length > 1 && (
              <div className="p360-nav">
                {activeProperty.property_360_images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => switchImage(idx)}
                    className={`p360-nav-btn${idx === activeIdx ? " p360-nav-btn--active" : ""}`}
                  >
                    <span className="p360-nav-num">{idx + 1}</span>
                    {img.label || `Foto ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
