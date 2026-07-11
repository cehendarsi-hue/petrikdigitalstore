import "./globals.css";

export const metadata = {
  title: "Petrik Digital Store",
  description: "Katalog produk digital Petrik Digital Store."
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
