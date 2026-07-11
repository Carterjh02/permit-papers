"use client";

import { useEffect, useState } from "react";
import PublicNav from "../(public)/PublicNav";

type CompatibilityResults = {
  cookiesEnabled: boolean;
  basicCookieWorks: boolean;
  secureCookieWorks: boolean;
  sameSiteNoneWorks: boolean;
  thirdPartyLikelyBlocked: boolean;
};

export default function CompatibilityPage() {
  const [results, setResults] = useState<CompatibilityResults | null>(null);

  useEffect(() => {
    const testResults: CompatibilityResults = {
      cookiesEnabled: false,
      basicCookieWorks: false,
      secureCookieWorks: false,
      sameSiteNoneWorks: false,
      thirdPartyLikelyBlocked: false,
    };

    document.cookie = "pp_test_cookie=1; path=/";
    testResults.cookiesEnabled = navigator.cookieEnabled;
    testResults.basicCookieWorks = document.cookie.includes("pp_test_cookie");

    document.cookie = "pp_secure_test=1; path=/; SameSite=Lax; Secure";
    testResults.secureCookieWorks = document.cookie.includes("pp_secure_test");

    document.cookie = "pp_samesite_test=1; path=/; SameSite=None; Secure";
    testResults.sameSiteNoneWorks = document.cookie.includes("pp_samesite_test");

    testResults.thirdPartyLikelyBlocked =
      !testResults.secureCookieWorks || !testResults.sameSiteNoneWorks;

    Promise.resolve().then(() => setResults(testResults));
  }, []);

  return (
    <div className="compat-shell">
      <PublicNav />

      <div className="compat-container">
        <h1 className="compat-title">Browser Compatibility Check</h1>

        {!results && <p>Running tests...</p>}

        {results && (
          <div className="compat-results">
            <h2>Results</h2>

            <ul>
              <li>
                <strong>Cookies Enabled:</strong>{" "}
                {results.cookiesEnabled ? "Yes" : "No"}
              </li>

              <li>
                <strong>Basic Cookies Work:</strong>{" "}
                {results.basicCookieWorks ? "Yes" : "No"}
              </li>

              <li>
                <strong>Secure Cookies Work:</strong>{" "}
                {results.secureCookieWorks ? "Yes" : "No"}
              </li>

              <li>
                <strong>SameSite=None Cookies Work:</strong>{" "}
                {results.sameSiteNoneWorks ? "Yes" : "No"}
              </li>

              <li>
                <strong>Third-Party Cookies Likely Blocked:</strong>{" "}
                {results.thirdPartyLikelyBlocked ? "Yes" : "No"}
              </li>
            </ul>

            <h2>Fixes</h2>
            <p>
              If any items above show “No”, your browser or network is blocking
              secure cookies. This prevents login from working.
            </p>

            <p>
              Try switching tracking prevention to Balanced, allowing cookies,
              or disabling privacy extensions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
