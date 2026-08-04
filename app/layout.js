import "./globals.css";

export const metadata = {
  title: "Adega SaaS — Gestão para Adegas",
  description: "Sistema de gestão para adegas: estoque, vendas, clientes e relatórios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
