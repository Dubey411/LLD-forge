const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const readmePath = path.join(__dirname, '../../../README.md');
const aiUsagePath = path.join(__dirname, '../../../AI_USAGE.md');
const outputHtmlPath = path.join(__dirname, '../../../docs/combined_doc.html');
const outputPdfPath = path.join(__dirname, '../../../docs/README_and_AI_USAGE.pdf');

const readmeMd = fs.readFileSync(readmePath, 'utf8');
const aiUsageMd = fs.readFileSync(aiUsagePath, 'utf8');

// Simple Markdown to clean HTML converter
function simpleMarkdownToHtml(md) {
  let html = md
    // Escape basic html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="img-container"><img alt="$1" src="$2"/><p class="caption">$1</p></div>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    // Horizontal rules
    .replace(/^---$/gim, '<hr/>')
    // Unordered lists
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n+/g, '</p><p>');

  return `<p>${html}</p>`;
}

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LLD Practice Platform — README & AI Usage</title>
  <style>
    @page {
      margin: 1.5cm;
      size: A4 portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 20pt;
      color: #0f172a;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    h2 {
      font-size: 14pt;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 12pt;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p {
      margin-top: 0;
      margin-bottom: 8px;
    }
    ul {
      margin-top: 4px;
      margin-bottom: 8px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
    }
    pre {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      font-size: 9pt;
      font-family: Consolas, monospace;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    code {
      font-family: Consolas, monospace;
      font-size: 9.5pt;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #4338ca;
    }
    pre code {
      background: transparent;
      padding: 0;
      color: #1e293b;
    }
    hr {
      border: none;
      border-top: 1px solid #cbd5e1;
      margin: 20px 0;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .img-container {
      text-align: center;
      margin: 12px 0;
    }
    img {
      max-width: 90%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .caption {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 4px;
      font-style: italic;
    }
    .header-banner {
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 10pt;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <strong>CipherSchools 2-Day Engineering Assignment</strong> — Candidate Submission by Shubham Dubey
  </div>

  ${simpleMarkdownToHtml(readmeMd)}

  <div class="page-break"></div>

  <div class="header-banner">
    <strong>CipherSchools 2-Day Engineering Assignment</strong> — AI Usage Report by Shubham Dubey
  </div>

  ${simpleMarkdownToHtml(aiUsageMd)}
</body>
</html>`;

fs.writeFileSync(outputHtmlPath, fullHtml);
console.log('Generated combined HTML at:', outputHtmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${outputPdfPath}" --no-pdf-header-footer "${outputHtmlPath}"`;

try {
  execSync(cmd);
  console.log('Successfully generated PDF at:', outputPdfPath);
} catch (err) {
  console.error('Edge print failed:', err.message);
}
