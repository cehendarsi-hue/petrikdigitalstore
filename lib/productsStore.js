import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { defaultData } from "@/lib/defaultData";

const localDataPath = path.join(process.cwd(), "data", "products.json");
const blobPath = "catalog/products.json";

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function textValue(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function colorValue(value, fallback) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
}

function normalizeTheme(source = {}) {
  const fallback = defaultData.theme;

  return {
    primary: colorValue(source.primary, fallback.primary),
    secondary: colorValue(source.secondary, fallback.secondary),
    accent: colorValue(source.accent, fallback.accent),
    background: colorValue(source.background, fallback.background),
    surface: colorValue(source.surface, fallback.surface),
    text: colorValue(source.text, fallback.text),
    muted: colorValue(source.muted, fallback.muted),
    heroOverlay: colorValue(source.heroOverlay, fallback.heroOverlay)
  };
}

function normalizeTextList(source, fallback) {
  const input = Array.isArray(source) ? source : [];
  return fallback.map((fallbackItem, index) => textValue(input[index], fallbackItem));
}

function normalizeSteps(source, fallback) {
  const input = Array.isArray(source) ? source : [];
  return fallback.map((fallbackItem, index) => {
    const step = input[index] || {};
    return {
      title: textValue(step.title, fallbackItem.title),
      description: textValue(step.description, fallbackItem.description)
    };
  });
}

function normalizeProduct(product, index) {
  const fallback = defaultData.products[index] || defaultData.products[0];

  return {
    id: String(product.id || fallback.id || `product-${index + 1}`),
    name: String(product.name || fallback.name),
    badge: textValue(product.badge, fallback.badge),
    description: String(product.description || fallback.description),
    image: String(product.image || fallback.image)
  };
}

export function normalizeCatalog(input = {}) {
  const productsSource = Array.isArray(input.products) ? input.products : [];
  const products = defaultData.products.map((fallback, index) =>
    normalizeProduct(productsSource[index] || fallback, index)
  );

  return {
    storeName: textValue(input.storeName, defaultData.storeName),
    logoImage: String(input.logoImage || defaultData.logoImage),
    bannerImage: String(input.bannerImage || defaultData.bannerImage),
    adminBannerImage: String(input.adminBannerImage || defaultData.adminBannerImage),
    theme: normalizeTheme(input.theme),
    topTagline: textValue(input.topTagline, defaultData.topTagline),
    heroEyebrow: textValue(input.heroEyebrow, defaultData.heroEyebrow),
    headline: textValue(input.headline, defaultData.headline),
    subheadline: textValue(input.subheadline, defaultData.subheadline),
    whatsappNumber: String(input.whatsappNumber || defaultData.whatsappNumber).replace(/[^\d]/g, ""),
    primaryActionLabel: textValue(input.primaryActionLabel, defaultData.primaryActionLabel),
    secondaryActionLabel: textValue(input.secondaryActionLabel, defaultData.secondaryActionLabel),
    trustBadges: normalizeTextList(input.trustBadges, defaultData.trustBadges),
    productsEyebrow: textValue(input.productsEyebrow, defaultData.productsEyebrow),
    productsTitle: textValue(input.productsTitle, defaultData.productsTitle),
    productsNote: textValue(input.productsNote, defaultData.productsNote),
    orderEyebrow: textValue(input.orderEyebrow, defaultData.orderEyebrow),
    orderTitle: textValue(input.orderTitle, defaultData.orderTitle),
    orderSteps: normalizeSteps(input.orderSteps, defaultData.orderSteps),
    products
  };
}

export async function getCatalog() {
  if (hasBlobToken()) {
    try {
      const blob = await get(blobPath, { access: "private", useCache: false });

      if (blob?.stream) {
        const response = new Response(blob.stream);
        return normalizeCatalog(await response.json());
      }
    } catch (error) {
      console.error("Failed to read catalog from Vercel Blob", error);
    }
  }

  try {
    const raw = await readFile(localDataPath, "utf8");
    return normalizeCatalog(JSON.parse(raw));
  } catch {
    return normalizeCatalog(defaultData);
  }
}

export async function saveCatalog(data) {
  const catalog = normalizeCatalog(data);
  const body = JSON.stringify(catalog, null, 2);

  if (hasBlobToken()) {
    await put(blobPath, body, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json"
    });
    return catalog;
  }

  if (process.env.NODE_ENV === "production") {
    const error = new Error(
      "Storage Vercel Blob belum aktif. Hubungkan Vercel Blob ke project agar edit katalog dan upload bisa tersimpan."
    );
    error.status = 500;
    throw error;
  }

  await mkdir(path.dirname(localDataPath), { recursive: true });
  await writeFile(localDataPath, body);
  return catalog;
}

export function assertAdminPassword(password) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const localPassword = process.env.NODE_ENV === "production" ? "" : "admin123";
  const expectedPassword = configuredPassword || localPassword;

  if (!expectedPassword || password !== expectedPassword) {
    const reason = configuredPassword
      ? "Password admin salah."
      : "ADMIN_PASSWORD belum diset di environment Vercel.";
    const error = new Error(reason);
    error.status = 401;
    throw error;
  }
}
