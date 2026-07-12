import "./globals.css";
import { ToastProvider } from "./components/ToastProvider";
import ClientDebug from "./debug/ClientDebug";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-800 min-h-screen flex flex-col">
      {typeof window !== "undefined" && (
      <ClientDebug serverSession={null} /> )}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
