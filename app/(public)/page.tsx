import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-container">

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Permit Automation Made Simple</h1>
          <p className="hero-subtitle">
            Upload templates, create jobs, and generate complete permit packets in seconds.
          </p>

          <div className="hero-buttons">
            <Link href="/demo" className="btn-primary">View Demo</Link>
          </div>

          <p className="hero-signup-text">
            Ready to streamline your permitting workflow?
          </p>
          <Link href="/login" className="btn-secondary hero-signup-button">
            Login / Sign Up
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2 className="section-title">What Permit Papers Can Do</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Job Dashboard</h3>
            <p>View and manage all active jobs in one place — organized by customer, contractor, and permit type.</p>
          </div>

          <div className="feature-card">
            <h3>Smart Data Entry</h3>
            <p>Auto‑fill customer and contractor information to save time and reduce errors.</p>
          </div>

          <div className="feature-card">
            <h3>PDF Generation</h3>
            <p>Generate complete permit packets with one click — fast, accurate, and ready for submission.</p>
          </div>

          <div className="feature-card">
            <h3>Secure Storage</h3>
            <p>Your documents are encrypted, backed by enterprise‑grade infrastructure, and protected by role‑based access controls.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">1</span>
            <h3>Import Company Information</h3>
            <p>Pull in your company details automatically from your saved profile.</p>
          </div>

          <div className="step-card">
            <span className="step-number">2</span>
            <h3>Create a Job</h3>
            <p>Add customer and contractor data to generate a new permit packet.</p>
          </div>

          <div className="step-card">
            <span className="step-number">3</span>
            <h3>Download Your Packet</h3>
            <p>Instantly export a complete, ready‑to‑submit PDF packet.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Permit Papers</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/forums">Forums</Link>
            <Link href="/login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
