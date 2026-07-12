"use client";

import { useEffect, useState } from "react";
import { defaultData } from "@/lib/defaultData";

function Field({ label, value, onChange, type = "text", rows = 3, help, placeholder }) {
  const controlId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <label className="admin-field" htmlFor={controlId}>
      <span>{label}</span>
      {rows > 1 ? (
        <textarea
          id={controlId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={controlId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
      {help ? <small>{help}</small> : null}
    </label>
  );
}

function BrandMark({ catalog }) {
  return (
    <span className="brand-mark">
      {catalog.logoImage ? <img src={catalog.logoImage} alt="" aria-hidden="true" /> : "P"}
    </span>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17.9 2.7a2.1 2.1 0 0 1 3 3l-1.3 1.3-3-3 1.3-1.3Zm-2.4 2.4 3 3-10.7 10.7-3.4.4.4-3.4L15.5 5.1Z" />
    </svg>
  );
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

async function prepareImageUpload(file, maxSize = 1800) {
  if (!file || !file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const image = await fileToImage(file);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(image.src);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob || blob.size >= file.size) return file;

  const safeName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${safeName}.jpg`, { type: "image/jpeg" });
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [catalog, setCatalog] = useState(defaultData);
  const [status, setStatus] = useState("Masukkan password untuk mulai edit katalog.");
  const [saving, setSaving] = useState(false);
  const [activeAsset, setActiveAsset] = useState("logoImage");
  const [storageStatus, setStorageStatus] = useState({ blobReady: true, isProduction: false });

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setCatalog(data))
      .catch(() => setStatus("Data lokal default dipakai sementara."));

    fetch("/api/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStorageStatus(data))
      .catch(() => setStorageStatus({ blobReady: true, isProduction: false }));
  }, []);

  function updateCatalog(field, value) {
    setCatalog((current) => ({ ...current, [field]: value }));
  }

  function updateTrustBadge(index, value) {
    setCatalog((current) => {
      const trustBadges = [...(current.trustBadges || defaultData.trustBadges)];
      trustBadges[index] = value;
      return { ...current, trustBadges };
    });
  }

  function updateOrderStep(index, field, value) {
    setCatalog((current) => ({
      ...current,
      orderSteps: (current.orderSteps || defaultData.orderSteps).map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      )
    }));
  }

  function updateProduct(index, field, value) {
    setCatalog((current) => ({
      ...current,
      products: current.products.map((product, productIndex) =>
        productIndex === index ? { ...product, [field]: value } : product
      )
    }));
  }

  async function saveCatalog(event) {
    event?.preventDefault();
    setSaving(true);
    setStatus("Menyimpan perubahan...");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, catalog })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan perubahan.");
      }

      setCatalog(result.catalog);
      setStatus("Berhasil disimpan. Halaman publik sudah pakai data terbaru.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(index, file) {
    if (!file) return;

    setStatus("Menyiapkan dan mengupload foto produk...");
    const formData = new FormData();
    const preparedFile = await prepareImageUpload(file, 1400);
    formData.append("password", password);
    formData.append("file", preparedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload gagal.");
      }

      updateProduct(index, "image", result.url);
      setStatus("Foto berhasil diupload. Klik Simpan Perubahan untuk publish.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function uploadAsset(field, file) {
    if (!file) return;

    setStatus("Menyiapkan dan mengupload aset visual...");
    const formData = new FormData();
    const maxSize = field === "logoImage" ? 720 : 1800;
    const preparedFile = await prepareImageUpload(file, maxSize);
    formData.append("password", password);
    formData.append("file", preparedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload gagal.");
      }

      updateCatalog(field, result.url);
      setStatus("Aset visual berhasil diupload. Klik Simpan Perubahan untuk publish.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className="admin-page">
      <a className="skip-link" href="#admin-form">
        Lewati ke form admin
      </a>

      <aside
        className="admin-sidebar"
        aria-label="Ringkasan admin"
        style={{ "--admin-banner": `url("${catalog.adminBannerImage}")` }}
      >
        <a className="brand admin-brand" href="/">
          <BrandMark catalog={catalog} />
          <span>Petrik Admin</span>
        </a>
        <div className="admin-summary">
          <p className="eyebrow">Dashboard</p>
          <h1>Edit semua konten website</h1>
          <p>Ubah teks, tombol, badge, foto, produk, cara order, dan nomor WhatsApp.</p>
        </div>
        <a href="/" className="secondary-action admin-preview">
          Lihat Website
        </a>
      </aside>

      <section className="admin-workspace" aria-labelledby="admin-title">
        <form id="admin-form" className="admin-form" onSubmit={saveCatalog}>
          <div className="admin-toolbar">
            <label className="admin-field" htmlFor="admin-password">
              <span>Password Admin</span>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Isi password admin"
                autoComplete="current-password"
                aria-describedby="password-help"
              />
              <small id="password-help">Lokal default: admin123. Di Vercel pakai ADMIN_PASSWORD.</small>
            </label>
            <button className="primary-action save-button" type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

          <p className="status-text" role="status" aria-live="polite">
            {status}
          </p>

          {storageStatus.isProduction && !storageStatus.blobReady ? (
            <div className="config-warning" role="alert">
              <strong>Upload belum aktif di Vercel.</strong>
              <span>
                Hubungkan Vercel Blob ke project ini supaya upload foto, banner, icon, dan save
                katalog bisa tersimpan permanen.
              </span>
            </div>
          ) : null}

          <fieldset className="settings-panel">
            <legend id="admin-title">Identitas toko</legend>
            <Field
              label="Nama Toko"
              value={catalog.storeName}
              onChange={(value) => updateCatalog("storeName", value)}
              rows={1}
            />
            <Field
              label="Nomor WhatsApp"
              value={catalog.whatsappNumber}
              onChange={(value) => updateCatalog("whatsappNumber", value)}
              type="tel"
              rows={1}
              placeholder="628xxxxxxxxxx"
              help="Gunakan format kode negara, contoh 628561631200."
            />
            <Field
              label="Teks Bar Atas"
              value={catalog.topTagline}
              onChange={(value) => updateCatalog("topTagline", value)}
              rows={1}
            />
          </fieldset>

          <fieldset className="settings-panel visual-panel">
            <legend>Custom icon dan banner</legend>
            <div className="asset-preview">
              <div className="editable-asset logo-asset">
                <div className="logo-preview">
                  {catalog.logoImage ? (
                    <img src={catalog.logoImage} alt="Preview logo toko" />
                  ) : (
                    <span>P</span>
                  )}
                </div>
                <button
                  className="asset-edit-button"
                  type="button"
                  onClick={() => setActiveAsset("logoImage")}
                  aria-label="Edit custom icon atau logo"
                >
                  <PencilIcon />
                </button>
              </div>
              <div className="asset-stack">
                <div className="editable-asset">
                  <div
                    className="banner-preview"
                    style={{ backgroundImage: `url("${catalog.bannerImage}")` }}
                    role="img"
                    aria-label="Preview banner website"
                  />
                  <button
                    className="asset-edit-button"
                    type="button"
                    onClick={() => setActiveAsset("bannerImage")}
                    aria-label="Edit banner website"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <div className="editable-asset admin-banner-card">
                  <div
                    className="banner-preview"
                    style={{ backgroundImage: `url("${catalog.adminBannerImage}")` }}
                    role="img"
                    aria-label="Preview banner admin"
                  />
                  <button
                    className="asset-edit-button"
                    type="button"
                    onClick={() => setActiveAsset("adminBannerImage")}
                    aria-label="Edit banner admin"
                  >
                    <PencilIcon />
                  </button>
                </div>
              </div>
            </div>
            <div className="asset-edit-panel">
              <div>
                <h2>
                  {activeAsset === "logoImage"
                    ? "Edit Custom Icon / Logo"
                    : activeAsset === "bannerImage"
                      ? "Edit Banner Website"
                      : "Edit Banner Admin"}
                </h2>
                <p>
                  {activeAsset === "logoImage"
                    ? "Disarankan gambar kotak, misalnya 512 x 512 px."
                    : "Disarankan gambar landscape lebar agar tidak kepotong di desktop dan mobile."}
                </p>
              </div>
              <label className="admin-field" htmlFor={`${activeAsset}-upload`}>
                <span>Upload Gambar</span>
                <input
                  id={`${activeAsset}-upload`}
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadAsset(activeAsset, event.target.files?.[0])}
                />
              </label>
              <Field
                label="Link Gambar"
                value={catalog[activeAsset]}
                onChange={(value) => updateCatalog(activeAsset, value)}
                type="url"
                rows={1}
                placeholder="https://..."
              />
            </div>
          </fieldset>

          <fieldset className="settings-panel">
            <legend>Hero utama</legend>
            <Field
              label="Label Kecil Hero"
              value={catalog.heroEyebrow}
              onChange={(value) => updateCatalog("heroEyebrow", value)}
              rows={1}
            />
            <Field
              label="Label Tombol Utama"
              value={catalog.primaryActionLabel}
              onChange={(value) => updateCatalog("primaryActionLabel", value)}
              rows={1}
            />
            <Field
              label="Label Tombol WhatsApp"
              value={catalog.secondaryActionLabel}
              onChange={(value) => updateCatalog("secondaryActionLabel", value)}
              rows={1}
            />
            <Field
              label="Headline"
              value={catalog.headline}
              onChange={(value) => updateCatalog("headline", value)}
              rows={3}
            />
            <Field
              label="Subheadline"
              value={catalog.subheadline}
              onChange={(value) => updateCatalog("subheadline", value)}
              rows={3}
            />
          </fieldset>

          <fieldset className="settings-panel">
            <legend>Badge kepercayaan</legend>
            {(catalog.trustBadges || defaultData.trustBadges).map((badge, index) => (
              <Field
                key={`badge-${index}`}
                label={`Badge ${index + 1}`}
                value={badge}
                onChange={(value) => updateTrustBadge(index, value)}
                rows={1}
              />
            ))}
          </fieldset>

          <fieldset className="settings-panel">
            <legend>Section produk</legend>
            <Field
              label="Label Kecil Produk"
              value={catalog.productsEyebrow}
              onChange={(value) => updateCatalog("productsEyebrow", value)}
              rows={1}
            />
            <Field
              label="Judul Produk"
              value={catalog.productsTitle}
              onChange={(value) => updateCatalog("productsTitle", value)}
              rows={2}
            />
            <Field
              label="Catatan Produk"
              value={catalog.productsNote}
              onChange={(value) => updateCatalog("productsNote", value)}
              rows={3}
            />
          </fieldset>

          <div className="admin-products" aria-label="Editor produk">
            {catalog.products.map((product, index) => (
              <fieldset className="editor-card" key={product.id}>
                <legend>Produk {index + 1}</legend>
                <div className="editor-image">
                  <img src={product.image} alt={`Preview ${product.name}`} />
                </div>

                <div className="editor-fields">
                  <label className="admin-field" htmlFor={`product-file-${index}`}>
                    <span>Upload Foto Produk</span>
                    <input
                      id={`product-file-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(event) => uploadImage(index, event.target.files?.[0])}
                    />
                  </label>
                  <Field
                    label={`Link Foto Produk ${index + 1}`}
                    value={product.image}
                    onChange={(value) => updateProduct(index, "image", value)}
                    type="url"
                    rows={1}
                  />
                  <Field
                    label={`Nama Produk ${index + 1}`}
                    value={product.name}
                    onChange={(value) => updateProduct(index, "name", value)}
                    rows={1}
                  />
                  <Field
                    label={`Badge Produk ${index + 1}`}
                    value={product.badge}
                    onChange={(value) => updateProduct(index, "badge", value)}
                    rows={1}
                  />
                  <Field
                    label={`Keterangan Produk ${index + 1}`}
                    value={product.description}
                    onChange={(value) => updateProduct(index, "description", value)}
                    rows={4}
                  />
                </div>
              </fieldset>
            ))}
          </div>

          <fieldset className="settings-panel">
            <legend>Cara pemesanan</legend>
            <Field
              label="Label Kecil Cara Order"
              value={catalog.orderEyebrow}
              onChange={(value) => updateCatalog("orderEyebrow", value)}
              rows={1}
            />
            <Field
              label="Judul Cara Order"
              value={catalog.orderTitle}
              onChange={(value) => updateCatalog("orderTitle", value)}
              rows={2}
            />
            {(catalog.orderSteps || defaultData.orderSteps).map((step, index) => (
              <div className="step-editor" key={`step-${index}`}>
                <h2>Langkah {index + 1}</h2>
                <Field
                  label={`Judul Langkah ${index + 1}`}
                  value={step.title}
                  onChange={(value) => updateOrderStep(index, "title", value)}
                  rows={1}
                />
                <Field
                  label={`Deskripsi Langkah ${index + 1}`}
                  value={step.description}
                  onChange={(value) => updateOrderStep(index, "description", value)}
                  rows={3}
                />
              </div>
            ))}
          </fieldset>
        </form>
      </section>
    </main>
  );
}
