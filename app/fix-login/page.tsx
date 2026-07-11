"use client";

import { useState } from "react";
import Link from "next/link";
import PublicNav from "../(public)/PublicNav";

export default function FixLoginPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="fix-shell">
      <PublicNav />

      <div className="fix-container">
        <h1 className="fix-title">Fix My Login</h1>

        {step === 1 && (
          <div className="fix-step">
            <h2>Step 1: Check Cookie Support</h2>
            <p>
              Permit Papers requires secure cookies to keep you logged in. Some browsers
              or networks block these by default.
            </p>

            <button
              className="btn-primary"
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="fix-step">
            <h2>Step 2: Run Browser Compatibility Test</h2>
            <p>
              This test checks whether your browser allows secure cookies, SameSite cookies,
              and session persistence.
            </p>

            <Link href="/compatibility" className="btn-primary">
              Run Compatibility Test
            </Link>

            <button
              className="btn-secondary"
              onClick={() => setStep(3)}
            >
              Skip
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="fix-step">
            <h2>Step 3: Update Browser Settings</h2>
            <p>
              If your browser blocks secure cookies, you can fix it by adjusting privacy
              settings or allowing Permit Papers.
            </p>

            <Link href="/fix-login/browser-settings" className="btn-primary">
              Open Browser Settings Guide
            </Link>

            <button
              className="btn-secondary"
              onClick={() => setStep(4)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="fix-step">
            <h2>Step 4: Try Again</h2>
            <p>
              After updating your settings, return to the login page and try again.
            </p>

            <Link href="/login" className="btn-primary">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
