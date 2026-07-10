"use client";

import { useState } from "react";

type Topic = {
  id: string;
  title: string;
  content: string;
};

const topics: Topic[] = [
  {
    id: "login-cookies",
    title: "Login issues and browser cookie settings",
    content: `
      If you find yourself stuck on the login page — especially if the URL looks like "/login?callbackUrl=/dashboard" — your browser is likely blocking the secure session cookie that Permit Papers uses to keep you logged in.

      This cookie is essential for verifying your identity and maintaining your session. When it’s blocked, the site can’t confirm that you’re logged in, so it loops back to the login screen.

      Here’s how to fix it step by step:
      1. Enable cookies for permitpapers.com
      2. Turn off strict tracking prevention
      3. Disable extensions that block cookies
      4. Ask IT to allow secure cookies if you’re on a managed computer

      Once cookies are enabled, login will work normally and you’ll be redirected to your dashboard.
    `
  },
  {
    id: "packets",
    title: "Understanding permit packets",
    content: `
      Permit Papers automatically generates complete permit packets for your jobs. A packet includes all required forms, customer and contractor details, and county-specific documents.

      You don’t need to upload or manage templates yourself — that’s handled by the master account. Your role is to create jobs and fill in the necessary information. The system then auto-fills the correct forms and produces a ready-to-submit PDF packet.
    `
  },
  {
    id: "security",
    title: "Document security and storage",
    content: `
      Permit Papers takes data security seriously. Every document and form you upload or generate is encrypted using AES-256 encryption.

      Files are stored on secure, enterprise-grade servers with multiple layers of protection:
      - Encrypted storage (in transit and at rest)
      - Role-based access control
      - Daily backups
      - Continuous monitoring for vulnerabilities

      Your data is safe, private, and accessible only to authorized users.
    `
  }
];

export default function ForumsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggleTopic = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  const filteredTopics = topics.filter(
    t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="forums-container">

      <section className="forums-hero">
        <h1 className="forums-title">Help Center & Forums</h1>
        <p className="forums-subtitle">
          Find answers to common questions, troubleshoot login issues, and learn how to get the most out of Permit Papers.
        </p>
      </section>

      {/* SEARCH SECTION */}
      <section className="forums-search-section">
        <h2>Search Help Topics</h2>
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="forums-search"
        />
      </section>

      {/* TOPICS */}
      <section className="forums-section">
        <h2 className="section-title">Topics</h2>

        <div className="accordion-list">
          {filteredTopics.length > 0 ? (
            filteredTopics.map(topic => (
              <div key={topic.id} className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleTopic(topic.id)}
                >
                  <span>{topic.title}</span>
                  <span className="accordion-icon">
                    {openId === topic.id ? "−" : "+"}
                  </span>
                </button>

                {openId === topic.id && (
                  <div className="accordion-body">
                    <p style={{ whiteSpace: "pre-line" }}>{topic.content}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="forums-text">No topics found. Try another keyword.</p>
          )}
        </div>
      </section>

      {/* SUPPORT SECTION */}
      <section className="forums-section">
        <h2 className="section-title">Still Need Help?</h2>
        <p className="forums-text">
          If you’re still having trouble, feel free to reach out. We’re here to help.
        </p>
        <br />
        <div className="forums-buttons">
          <a href="/contact" className="btn-primary">Contact Support</a>
          <a href="/report" className="btn-secondary">Report an Issue</a>
        </div>
      </section>

    </div>
  );
}
