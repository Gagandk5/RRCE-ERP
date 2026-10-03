"use client";

import React, { useEffect, useState } from "react";
import { CSRF_COOKIE_NAME } from "@/lib/csrf";

export default function CsrfTokenInput() {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    // Read the CSRF cookie on client mount
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`));
    if (match && match[2]) {
      setCsrfToken(decodeURIComponent(match[2]));
    }
  }, []);

  if (!csrfToken) return null;

  return <input type="hidden" name="csrf_token" value={csrfToken} />;
}
