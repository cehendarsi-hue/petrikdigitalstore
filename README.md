# Petrik Digital Store

Website katalog satu halaman dengan dashboard admin untuk mengedit 3 produk.

## Jalanin lokal

```bash
npm install
npm run dev
```

Buka:

- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

Password lokal default: `admin123`

## Deploy ke Vercel

1. Push project ini ke GitHub.
2. Import repository di Vercel.
3. Tambahkan environment variable `ADMIN_PASSWORD` dengan password yang kuat.
4. Buat Vercel Blob store lalu hubungkan ke project agar `BLOB_READ_WRITE_TOKEN` tersedia.
5. Deploy.

Tanpa Vercel Blob, halaman tetap bisa tampil, tapi upload foto dan edit data permanen di production tidak akan jalan.

## Custom domain

Tambahkan `petrikdigitalstore.com` dari dashboard Vercel di menu Project Settings > Domains, lalu ikuti DNS record yang diberikan Vercel.
