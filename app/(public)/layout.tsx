import "./styles/home.css";
import PublicNav from "./PublicNav";
import "../globals.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* NAV stays full width */}
      <div className="nav-wrapper">
        <PublicNav />
      </div>

      {/* Gradient + centered content */}
      <div className="public-shell">
        <main className="public-content">{children}</main>
      </div>
    </>
  );
}
