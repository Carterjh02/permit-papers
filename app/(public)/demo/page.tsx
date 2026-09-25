"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("full");

  return (
    <div className="demo-container">

      {/* HERO */}
      <section className="demo-hero">
        <h1 className="demo-title">Permit Papers Demo</h1>
        <p className="demo-subtitle">
          See how Permit Papers automates permit packet creation from start to finish.
        </p>
      </section>

      {/* TUTORIALS & TIPS */}
      <section className="demo-box">
        <h2 className="section-title">Tutorials & Tips</h2>

        {/* TAB BUTTONS */}
        <div className="tab-buttons">
          <button onClick={() => setActiveTab("full")} className={activeTab === "full" ? "active" : ""}>
            Full Walkthrough
          </button>
          <button onClick={() => setActiveTab("snip")} className={activeTab === "snip" ? "active" : ""}>
            Using the Snipping Tool
          </button>
          <button onClick={() => setActiveTab("company")} className={activeTab === "company" ? "active" : ""}>
            Updating Company Information
          </button>
          <button onClick={() => setActiveTab("custom")} className={activeTab === "custom" ? "active" : ""}>
            Requesting Custom Documents
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="tab-content">
          {activeTab === "full" && (
            <video src="/demo/videos/full-video-demonstration.mp4" controls className="demo-video" />
          )}
          {activeTab === "snip" && (
            <video src="/demo/videos/snipping-tool-tutorial.mp4" controls className="demo-video" />
          )}
          {activeTab === "company" && (
            <video src="/demo/videos/update-company-info.mp4" controls className="demo-video" />
          )}
          {activeTab === "custom" && (
            <video src="/demo/videos/request-custom-documents.mp4" controls className="demo-video" />
          )}
        </div>
      </section>

      {/* GUIDED DEMO ACCESS */}
      <section className="demo-box">
        <h2 className="section-title">Guided Demo Access (Coming Soon)</h2>
        <div className="demo-content">
          <p className="demo-text">
            Soon, you’ll be able to request a temporary demo login to explore Permit Papers without creating a full account.
            You’ll receive a secure, time‑limited link that walks you through the workflow as if you were a real user.
          </p>
          <p className="demo-text">
            This guided demo will show how Permit Papers imports company data, creates jobs, and generates permit packets.
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
