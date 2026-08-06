"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function StandaloneSwaggerDocsPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        url: "/AdminFSyauqi/api/docs/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          window.SwaggerUIBundle.presets.apis,
          window.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
      });
    }
  }, []);

  const handleScriptLoad = () => {
    if (typeof window !== "undefined" && window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        url: "/AdminFSyauqi/api/docs/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          window.SwaggerUIBundle.presets.apis,
          window.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
      });
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      />
      <div className="bg-light min-vh-100 py-4">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between mb-4 px-4 py-3 bg-white rounded-3 shadow-sm border">
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-primary fs-6 px-3 py-2">OpenAPI 3.0</span>
              <div>
                <h4 className="fw-bold mb-0 text-dark">
                  CV &amp; Admin RESTful API Documentation
                </h4>
                <small className="text-muted">Interactive Standalone Swagger UI</small>
              </div>
            </div>
            <a
              href="/AdminFSyauqi/api/docs/swagger.json"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary btn-sm rounded-pill fw-semibold px-3"
            >
              <i className="bi bi-filetype-json me-1"></i> OpenAPI Spec (JSON)
            </a>
          </div>
          <div
            id="swagger-ui"
            className="bg-white rounded-4 shadow-sm p-4 border"
          ></div>
        </div>
      </div>
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        onLoad={handleScriptLoad}
      />
      <Script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" />
    </>
  );
}
