"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultData } from "@/lib/defaultData";

function whatsappLink(number, message) {
  const safeNumber = String(number || defaultData.whatsappNumber).replace(/[^\d]/g, "");
  return `https://wa.me/${safeNumber}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16.02 3.2A12.72 12.72 0 0 0 5.1 22.46L3.4 28.8l6.5-1.68a12.73 12.73 0 1 0 6.12-23.92Zm0 23.28a10.48 10.48 0 0 1-5.34-1.46l-.38-.22-3.86 1 1.04-3.74-.24-.4a10.46 10.46 0 1 1 8.78 4.82Zm5.74-7.84c-.32-.16-1.86-.92-2.14-1.02-.28-.1-.48-.16-.68.16-.2.32-.78 1.02-.96 1.22-.18.22-.36.24-.68.08-.32-.16-1.34-.5-2.56-1.58-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.5.14-.66.14-.14.32-.36.48-.54.16-.18.2-.32.32-.54.1-.22.04-.4-.02-.56-.08-.16-.68-1.64-.94-2.24-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.4-.28.32-1.06 1.04-1.06 2.54 0 1.5 1.08 2.94 1.24 3.14.16.22 2.14 3.28 5.2 4.6.72.32 1.3.5 1.74.64.74.24 1.4.2 1.92.12.58-.08 1.86-.76 2.12-1.5.26-.74.26-1.36.18-1.5-.08-.14-.28-.22-.6-.38Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.62 10.8c1.44 2.83 3.75 5.14 6.58 6.58l2.2-2.2c.3-.3.74-.4 1.12-.27 1.23.4 2.54.62 3.88.62.6 0 1.1.5 1.1 1.1v3.48c0 .6-.5 1.1-1.1 1.1C10.58 21.2 2.8 13.42 2.8 3.6c0-.6.5-1.1 1.1-1.1h3.5c.6 0 1.1.5 1.1 1.1 0 1.34.2 2.65.62 3.88.12.38.03.82-.28 1.12l-2.22 2.2Z" />
    </svg>
  );
}

function BrandMark({ catalog }) {
  return (
    <span className="brand-mark">
      {catalog.logoImage ? <img src={catalog.logoImage} alt="" aria-hidden="true" /> : "P"}
    </span>
  );
}

function hexToRgb(hex) {
  const fallback = { r: 255, g: 47, b: 125 };
  const value = String(hex || "").replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function storefrontThemeStyle(catalog) {
  const theme = catalog.theme || defaultData.theme;

  return {
    "--brand": theme.primary,
    "--brand-dark": theme.primary,
    "--blue": theme.secondary,
    "--accent": theme.accent,
    "--ink": theme.text,
    "--muted": theme.muted,
    "--surface": theme.surface,
    "--soft": theme.background,
    "--page-bg": theme.background,
    "--hero-overlay": rgba(theme.heroOverlay, 0.9),
    "--hero-overlay-mid": rgba(theme.heroOverlay, 0.68),
    "--hero-glow": rgba(theme.primary, 0.52),
    "--hero-glow-alt": rgba(theme.secondary, 0.38),
    "--grid-line": rgba(theme.primary, 0.08),
    "--theme-shadow": rgba(theme.primary, 0.22)
  };
}

export default function Storefront() {
  const [catalog, setCatalog] = useState(defaultData);

  useEffect(() => {
    let active = true;
    fetch("/api/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch(() => {
        if (active) setCatalog(defaultData);
      });

    return () => {
      active = false;
    };
  }, []);

  const introMessage = useMemo(
    () => `Halo ${catalog.storeName}, saya mau tanya-tanya produk digitalnya.`,
    [catalog.storeName]
  );

  return (
    <main className="store-page" style={storefrontThemeStyle(catalog)}>
      <a
        className="whatsapp-float"
        href={whatsappLink(catalog.whatsappNumber, introMessage)}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat WhatsApp"
      >
        <WhatsAppIcon />
      </a>

      <section
        className="hero-section"
        style={{ "--hero-banner": `url("${catalog.bannerImage}")` }}
      >
        <div className="contact-strip">
          <span>{catalog.topTagline}</span>
          <a
            href={whatsappLink(catalog.whatsappNumber, introMessage)}
            target="_blank"
            rel="noreferrer"
          >
            <PhoneIcon />
            {catalog.whatsappNumber}
          </a>
        </div>

        <nav className="topbar" aria-label="Navigasi utama">
          <a className="brand" href="#top" aria-label={catalog.storeName}>
            <BrandMark catalog={catalog} />
            <span>{catalog.storeName}</span>
          </a>
          <a
            className="nav-whatsapp"
            href={whatsappLink(catalog.whatsappNumber, introMessage)}
            target="_blank"
            rel="noreferrer"
          >
            Konsultasi
          </a>
        </nav>

        <div className="hero-content" id="top">
          <p className="eyebrow">{catalog.heroEyebrow}</p>
          <h1>{catalog.storeName}</h1>
          <p className="hero-copy">{catalog.headline}</p>
          <p className="hero-subcopy">{catalog.subheadline}</p>
          <div className="hero-actions">
            <a href="#produk" className="primary-action">
              {catalog.primaryActionLabel}
            </a>
            <a
              href={whatsappLink(catalog.whatsappNumber, introMessage)}
              target="_blank"
              rel="noreferrer"
              className="secondary-action"
            >
              {catalog.secondaryActionLabel}
            </a>
          </div>
          <div className="trust-row" aria-label="Keunggulan layanan">
            {catalog.trustBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section" id="produk">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{catalog.productsEyebrow}</p>
            <h2>{catalog.productsTitle}</h2>
          </div>
          <p className="section-note">{catalog.productsNote}</p>
        </div>

        <div className="product-grid">
          {catalog.products.map((product, index) => {
            const orderMessage = `Halo ${catalog.storeName}, saya mau order ${product.name}.`;

            return (
              <article className="product-card" key={product.id || product.name}>
                <div className="product-media">
                  <img src={product.image} alt={product.name} />
                  <span className="product-number">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="product-body">
                  <span className="product-pill">{product.badge}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <a
                    className="order-button"
                    href={whatsappLink(catalog.whatsappNumber, orderMessage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Order Sekarang
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="order-steps" aria-label="Cara pemesanan">
        <div className="order-steps-inner">
          <div>
            <p className="eyebrow">{catalog.orderEyebrow}</p>
            <h2>{catalog.orderTitle}</h2>
          </div>
          <div className="steps-grid">
            {catalog.orderSteps.map((step, index) => (
              <div className="step-item" key={`${step.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span>{catalog.storeName}</span>
      </footer>
    </main>
  );
}
