import markdown
import re

with open('docs/Consolidated_Assignment_Report.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

# Replace screenshot placeholders with styled boxes
html_body = re.sub(
    r'\[SCREENSHOT:\s*(.*?)\]',
    r'<div class="screenshot-box"><div class="icon">📷</div><div class="title">INSERT SCREENSHOT HERE</div><div class="desc">\1</div></div>',
    html_body
)

full_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SE3090 Assignment 1 - Consolidated Report</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a202c;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #ffffff;
        }
        h1 {
            color: #1a365d;
            font-size: 24px;
            border-bottom: 2px solid #2b6cb0;
            padding-bottom: 8px;
            margin-top: 36px;
            page-break-after: avoid;
        }
        h2 {
            color: #2b6cb0;
            font-size: 19px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 28px;
            page-break-after: avoid;
        }
        h3 {
            color: #2d3748;
            font-size: 16px;
            margin-top: 20px;
            page-break-after: avoid;
        }
        p, li {
            font-size: 14px;
            color: #2d3748;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
            font-size: 13px;
            page-break-inside: avoid;
        }
        th, td {
            border: 1px solid #cbd5e0;
            padding: 8px 10px;
            text-align: left;
        }
        th {
            background-color: #ebf8ff;
            color: #2b6cb0;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f7fafc;
        }
        code {
            background-color: #edf2f7;
            color: #c53030;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: "Cascadia Code", Consolas, Monaco, monospace;
            font-size: 12.5px;
        }
        pre {
            background-color: #1a202c;
            color: #f7fafc;
            padding: 14px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.4;
            page-break-inside: avoid;
        }
        pre code {
            background-color: transparent;
            color: #e2e8f0;
            padding: 0;
        }
        .screenshot-box {
            background-color: #f0f9ff;
            border: 2px dashed #0284c7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            page-break-inside: avoid;
        }
        .screenshot-box .icon {
            font-size: 24px;
            margin-bottom: 4px;
        }
        .screenshot-box .title {
            font-weight: bold;
            color: #0369a1;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .screenshot-box .desc {
            font-style: italic;
            color: #475569;
            font-size: 13px;
            margin-top: 4px;
        }
        hr {
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 30px 0;
        }
        @media print {
            body {
                padding: 0;
                max-width: 100%;
            }
            .screenshot-box {
                border-color: #94a3b8;
                background-color: #f8fafc;
            }
        }
    </style>
</head>
<body>
""" + html_body + """
</body>
</html>
"""

with open('docs/Consolidated_Assignment_Report.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Generated docs/Consolidated_Assignment_Report.html successfully!")
