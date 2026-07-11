"use client";

import PublicNav from "../../(public)/PublicNav";

export default function BrowserSettingsPage() {
  const openChromeSettings = () => {
    window.open("chrome://settings/cookies", "_blank");
  };

  const openEdgeSettings = () => {
    window.open("edge://settings/content/cookies", "_blank");
  };

  const openFirefoxSettings = () => {
    window.open("about:preferences#privacy", "_blank");
  };

  return (
    <div className="browser-shell">
      <PublicNav />

      <div className="browser-container">
        <h1 className="browser-title">Browser Cookie Settings</h1>

        <p>
          Some browsers block secure cookies by default, especially on corporate networks.
          Use the buttons below to open your browser’s cookie settings.
        </p>

        <div className="browser-buttons">
          <button className="btn-primary" onClick={openChromeSettings}>
            Open Chrome Cookie Settings
          </button>

          <button className="btn-primary" onClick={openEdgeSettings}>
            Open Edge Cookie Settings
          </button>

          <button className="btn-primary" onClick={openFirefoxSettings}>
            Open Firefox Privacy Settings
          </button>
        </div>

        <p className="browser-note">
          If your browser blocks secure cookies, Permit Papers cannot keep you logged in.
          After updating your settings, return to the login page and try again.
        </p>
      </div>
    </div>
  );
}
