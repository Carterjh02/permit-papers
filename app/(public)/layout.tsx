import "./styles/home.css";
import PublicNav from "./PublicNav";
import "../globals.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <PublicNav />
      <main className="public-main">
        {children}
      </main>
    </div>
  );
}
