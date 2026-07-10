"use client";

import Link from "next/link";

export default function PublicNav() {
  return (
    <nav className="public-nav">
      <div className="nav-inner">

        {/* Logo */}
        <Link href="/" className="nav-logo">
          Permit Papers
        </Link>

        {/* Links */}
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/demo">Demo</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/forums">Forums</Link>
          <Link href="/login" className="nav-login">
            Login
          </Link>
          <Link href="/signup" className="nav-login">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
