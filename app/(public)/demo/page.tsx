import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="demo-container">

      {/* HERO */}
      <section className="demo-hero">
        <h1 className="demo-title">Permit Papers Demo</h1>
        <p className="demo-subtitle">
          See how Permit Papers automates permit packet creation from start to finish.
        </p>
      </section>

      {/* WHAT YOU’LL SEE */}
      <section className="demo-box">
        <h2 className="section-title">What You’ll See</h2>
        <div className="demo-content">
          <ul className="demo-list">
            <li>✔ Importing company information automatically from your saved profile</li>
            <li>✔ Creating and managing jobs with customer and contractor data</li>
            <li>✔ Auto‑filling forms and generating complete permit packets</li>
            <li>✔ Downloading ready‑to‑submit PDFs instantly</li>
          </ul>
        </div>
      </section>

      {/* GUIDED DEMO ACCESS */}
      <section className="demo-box">
        <h2 className="section-title">Guided Demo Access</h2>
        <div className="demo-content">
          <p className="demo-text">
            We offer a temporary demo login so you can explore Permit Papers without setting up a full account.
            You’ll receive a secure, time‑limited link that lets you walk through the workflow as if you were a real user.
          </p>
          <p className="demo-text">
            Soon, this page will include a form where you can enter your email and automatically receive a demo link.
            This guided demo will show you how Permit Papers imports company data, creates jobs, and generates permit packets.
          </p>
        </div>
      </section>

      {/* READY TO GET STARTED */}
      <section className="demo-box">
        <h2 className="section-title">Ready to Get Started?</h2>
        <div className="demo-content center">
          <p className="demo-text">
            Experience the full workflow by signing up for an account or logging in to your dashboard.
          </p>
          <Link href="/login" className="btn-primary">
            Login / Sign Up
          </Link>
        </div>
      </section>

    </div>
  );
}
