"use client";

import { useEffect } from "react";

export default function BootstrapLoader() {
  useEffect(() => {
    // Import Bootstrap JS on client side only
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then(() => {
        console.log("Bootstrap JS loaded successfully in Admin");
      })
      .catch((err) => {
        console.error("Error loading Bootstrap JS:", err);
      });
  }, []);

  return null;
}
