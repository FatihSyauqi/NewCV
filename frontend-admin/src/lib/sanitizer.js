/**
 * Custom HTML Sanitizer for Live Chat Message Safety
 * Prevents XSS (Cross-Site Scripting) and HTML Injection attacks.
 */
export function sanitizeHtml(htmlInput) {
  if (!htmlInput || typeof htmlInput !== "string") return "";

  let clean = htmlInput;

  // 1. Remove dangerous tags and their contents entirely
  const dangerousTags = [
    /script[\s\S]*?\/script/gi,
    /iframe[\s\S]*?\/iframe/gi,
    /style[\s\S]*?\/style/gi,
    /object[\s\S]*?\/object/gi,
    /embed[\s\S]*?\/embed/gi,
    /form[\s\S]*?\/form/gi,
    /button[\s\S]*?\/button/gi,
    /input[\s\S]*?\/input/gi,
    /textarea[\s\S]*?\/textarea/gi,
    /select[\s\S]*?\/select/gi,
    /meta[\s\S]*?\/meta/gi,
    /link[\s\S]*?\/link/gi,
    /svg[\s\S]*?\/svg/gi,
  ];

  dangerousTags.forEach((pattern) => {
    clean = clean.replace(new RegExp(`<${pattern.source}>`, "gi"), "");
  });

  // 2. Remove any remaining dangerous tags without matching closing tag
  clean = clean.replace(/<\/?(script|iframe|style|object|embed|form|button|input|textarea|select|meta|link|svg|base|applet|canvas|video|audio|source|track)[^>]*>/gi, "");

  // 3. Remove inline event handlers (e.g. onload, onerror, onclick, onmouseover)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 4. Remove pseudo-protocol URIs (javascript:, vbscript:, data:)
  clean = clean.replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/href\s*=\s*(?:'data:text\/html[^']*'|"data:text\/html[^"]*"|data:text\/html[^\s>]+)/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'src="#"');

  // 5. Ensure all <a> links open safely in a new tab
  clean = clean.replace(/<a\s+([^>]*?)>/gi, (match, p1) => {
    let attrs = p1;
    if (!/target\s*=/i.test(attrs)) {
      attrs += ' target="_blank"';
    }
    if (!/rel\s*=/i.test(attrs)) {
      attrs += ' rel="noopener noreferrer"';
    }
    return `<a ${attrs}>`;
  });

  // 6. Clean up empty paragraphs/divs created by execCommand
  clean = clean.replace(/<p><br><\/p>/gi, "<br/>");
  clean = clean.trim();

  return clean;
}
