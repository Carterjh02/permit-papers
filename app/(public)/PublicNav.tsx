"use client";

import Link from "next/link";
import Image from "next/image";

export default function PublicNav() {
  return (
    <nav className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 shadow-sm sticky top-0 z-50 py-4 sm:py-5">
      <div className="nav-inner">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logos/logo-permitpapers-plain.png"
            alt="Permit Papers"
            width={320}
            height={85}
            className="h-20 w-auto sm:h-16"
            priority
          />
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
