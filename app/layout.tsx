import "./globals.css";
import "./(public)/styles/home.css";
import { ToastProvider } from "./components/ToastProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-gray-800 min-h-screen bg-gray-50">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
