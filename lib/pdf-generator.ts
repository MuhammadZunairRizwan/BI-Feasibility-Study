import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface Report {
  id: string;
  executiveSummary: string | null;
  marketAnalysis: string | null;
  technicalAnalysis: string | null;
  financialAnalysis: string | null;
  riskAssessment: string | null;
  recommendations: string | null;
  createdAt: Date;
  project: {
    name: string;
    sector: string;
    country: string;
    city: string;
    loanAvailable: boolean;
    description: string;
  };
  assumptions: Array<{
    category: string;
    key: string;
    value: string;
    rationale: string | null;
  }>;
}

interface PDFOptions {
  companyName?: string;
  companyLogo?: string; // Base64 encoded image or URL
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  projectCode?: string;
  primaryColor?: string;
  accentColor?: string;
  watermarkImage?: string; // Base64 encoded watermark image or URL
}

export async function generatePDF(report: Report, options: PDFOptions = {}): Promise<Buffer> {
  // Load watermark.png if not already provided
  if (!options.watermarkImage) {
    try {
      const watermarkPath = path.join(process.cwd(), 'watermark.png');
      if (fs.existsSync(watermarkPath)) {
        const imageBuffer = fs.readFileSync(watermarkPath);
        options.watermarkImage = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        console.log('✓ Watermark image loaded successfully');
      }
    } catch (error) {
      console.warn('⚠ Could not load watermark.png:', error);
    }
  }

  const html = generateHTML(report, options);

  let browser;
  try {
    console.log('🔍 Launching Chromium...');
    browser = await puppeteer.launch({
      headless: true,
      timeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-sync',
        '--no-first-run',
        '--single-process=false',
      ],
    });
    console.log('✓ Chromium launched successfully');
  } catch (launchError: any) {
    console.error('❌ Failed to launch browser. Error:', launchError.message);
    throw new Error(`Browser launch failed: ${launchError.message}`);
  }

  try {
    const page = await browser!.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    // Set viewport
    await page.setViewport({ width: 850, height: 1100 });

    // Load HTML content
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Wait for fonts and images to load
    await page.evaluateHandle('document.fonts.ready');

    // Delay to ensure all rendering is complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '80px',
        right: '50px',
        bottom: '100px',
        left: '50px',
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; width: 100%; padding: 10px 50px; display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb;">
          <div>
            <span style="color: #6366f1; font-weight: 600;">Project Code:</span>
            <span style="color: #374151; margin-left: 8px;">${options.projectCode || 'N/A'}</span>
          </div>
          <div>
            <span style="color: #6366f1; font-weight: 600;">Project Name:</span>
            <span style="color: #374151; margin-left: 8px;">${escapeHtml(report.project.name)}</span>
          </div>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 12px; width: 100%; padding: 16px 50px; display: flex; justify-content: space-between; align-items: center; border-top: 3px solid #6366f1; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); color: white;">
          <div style="display: flex; align-items: center; gap: 24px; font-weight: 500;">
            ${options.companyWebsite ? `<span style="font-size: 11px;">Website: ${options.companyWebsite}</span>` : ''}
            ${options.companyEmail ? `<span style="font-size: 11px;">Email: ${options.companyEmail}</span>` : ''}
            ${options.companyPhone ? `<span style="font-size: 11px;">Phone: ${options.companyPhone}</span>` : ''}
          </div>
          <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        </div>
      `,
    });

    await page.close();
    return Buffer.from(pdfBuffer);
  } catch (pdfError: any) {
    console.error('PDF rendering error:', pdfError?.message);
    throw pdfError;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function detectLanguage(text: string): 'en' | 'ar' {
  // Detect if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? 'ar' : 'en';
}

const translations = {
  en: {
    tableOfContents: 'Table of Contents',
    section1: 'Executive Summary',
    section2: 'Market Analysis',
    section3: 'Technical Feasibility',
    section4: 'Financial Analysis',
    section5: 'Risk Assessment',
    section6: 'Recommendations',
    section7: 'Key Assumptions',
    preparedBy: 'Prepared By',
    projectCode: 'Project Code:',
    location: 'Location:',
    reportDate: 'Report Date:',
    feasibilityStudy: 'FEASIBILITY STUDY',
    tagline: 'Professional AI-Powered Feasibility Analysis',
    disclaimer: '⚠️ Disclaimer: This feasibility study is based on the assumptions listed above and information available at the time of preparation. Actual results may vary significantly based on market conditions, execution capabilities, and other factors beyond our control. This report is for informational purposes only and should not be construed as financial, legal, or professional advice. Users should conduct their own due diligence and consult with qualified professionals before making investment decisions.',
    noContent: 'No content available.',
  },
  ar: {
    tableOfContents: 'جدول المحتويات',
    section1: 'الملخص التنفيذي',
    section2: 'تحليل السوق',
    section3: 'الجدوى الفنية',
    section4: 'التحليل المالي',
    section5: 'تقييم المخاطر',
    section6: 'التوصيات',
    section7: 'الافتراضات الرئيسية',
    preparedBy: 'أعده',
    projectCode: 'رمز المشروع:',
    location: 'الموقع:',
    reportDate: 'تاريخ التقرير:',
    feasibilityStudy: 'دراسة الجدوى',
    tagline: 'تحليل جدوى قائم على الذكاء الاصطناعي احترافي',
    disclaimer: '⚠️ تحذير: تستند هذه دراسة الجدوى على الافتراضات المذكورة أعلاه والمعلومات المتاحة في وقت التحضير. قد تختلف النتائج الفعلية بشكل كبير بناءً على ظروف السوق والقدرات على التنفيذ وعوامل أخرى خارجة عن سيطرتنا. هذا التقرير لأغراض إعلامية فقط ولا ينبغي اعتباره نصيحة مالية أو قانونية أو مهنية. يجب على المستخدمين إجراء العناية الواجبة والتشاور مع المتخصصين المؤهلين قبل اتخاذ قرارات الاستثمار.',
    noContent: 'لا توجد محتوى متاح.',
  },
};

function generateHTML(report: Report, options: PDFOptions): string {
  // Detect language from report content
  const language = detectLanguage(
    (report.executiveSummary ?? '') +
    (report.marketAnalysis ?? '') +
    (report.technicalAnalysis ?? '') +
    (report.financialAnalysis ?? '') +
    (report.riskAssessment ?? '') +
    (report.recommendations ?? '')
  );

  const date = new Date(report.createdAt).toLocaleDateString(
    language === 'ar' ? 'ar-SA' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const primaryColor = options.primaryColor || '#6366f1';
  const accentColor = options.accentColor || '#8b5cf6';
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const textAlign = language === 'ar' ? 'right' : 'left';

  return `
<!DOCTYPE html>
<html dir="${direction}" lang="${language}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    :root {
      --primary: ${primaryColor};
      --accent: ${accentColor};
      --text-dark: #1f2937;
      --text-medium: #4b5563;
      --text-light: #6b7280;
      --border: #e5e7eb;
      --bg-light: #f9fafb;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: var(--text-dark);
      background: white;
      direction: ${direction};
      text-align: ${textAlign};
    }

    /* RTL Support */
    ${language === 'ar' ? `
      table {
        margin-right: 0;
        margin-left: auto;
      }

      th, td {
        text-align: ${textAlign};
      }

      ul, ol {
        list-style: none;
        margin: 0;
        padding: 0;
        text-align: right;
      }

      li {
        text-align: ${textAlign};
        direction: rtl;
        margin-bottom: 8px;
        margin-left: 0;
        margin-right: 0;
        padding-left: 0;
        padding-right: 20px;
        position: relative;
      }

      li::before {
        content: '•';
        position: absolute;
        right: 8px;
        color: inherit;
      }

      .section-title {
        border-${direction === 'rtl' ? 'right' : 'left'}: 4px solid var(--primary);
        padding-${direction === 'rtl' ? 'right' : 'left'}: 12px;
      }

      .stats-box {
        text-align: center;
      }
    ` : ''}

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      background: white;
      padding: 60px;
      position: relative;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, var(--primary), var(--accent), #ec4899);
    }

    .cover-logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 40px;
    }

    .cover-page h1 {
      font-size: 28pt;
      font-weight: 800;
      color: var(--text-dark);
      margin-bottom: 16px;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-size: 18pt;
      font-weight: 300;
      color: var(--primary);
      margin-bottom: 50px;
      letter-spacing: 2px;
    }

    .cover-prepared {
      font-size: 11pt;
      color: var(--text-light);
      margin-bottom: 10px;
    }

    .cover-company {
      font-size: 16pt;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 40px;
    }

    .cover-tagline {
      font-size: 10pt;
      color: var(--text-light);
      font-style: italic;
      margin-bottom: 30px;
    }

    .cover-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 40px;
    }

    .cover-meta-item {
      font-size: 10pt;
      color: var(--text-medium);
    }

    .cover-meta-item span {
      color: var(--primary);
      font-weight: 600;
    }

    .cover-badge {
      display: inline-block;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white;
      padding: 10px 30px;
      border-radius: 25px;
      font-size: 11pt;
      font-weight: 500;
      margin-top: 30px;
    }

    /* Table of Contents */
    .toc-page {
      page-break-after: always;
      padding: 40px 0;
    }

    .toc-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .toc-header h2 {
      font-size: 24pt;
      font-weight: 700;
      color: var(--primary);
      position: relative;
      display: inline-block;
    }

    .toc-header h2::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      border-radius: 2px;
    }

    .toc-list {
      max-width: 500px;
      margin: 0 auto;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      margin-bottom: 8px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .toc-item:nth-child(1) { background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05)); border-left: 4px solid #6366f1; }
    .toc-item:nth-child(2) { background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)); border-left: 4px solid #10b981; }
    .toc-item:nth-child(3) { background: linear-gradient(90deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05)); border-left: 4px solid #f59e0b; }
    .toc-item:nth-child(4) { background: linear-gradient(90deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)); border-left: 4px solid #ef4444; }
    .toc-item:nth-child(5) { background: linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05)); border-left: 4px solid #8b5cf6; }
    .toc-item:nth-child(6) { background: linear-gradient(90deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05)); border-left: 4px solid #ec4899; }
    .toc-item:nth-child(7) { background: linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05)); border-left: 4px solid #06b6d4; }

    .toc-item .title {
      font-weight: 600;
      color: var(--text-dark);
    }

    .toc-item .dots {
      flex: 1;
      border-bottom: 2px dotted var(--border);
      margin: 0 15px;
      height: 1px;
    }

    .toc-item .page {
      font-weight: 600;
      color: var(--text-light);
      min-width: 30px;
      text-align: right;
    }

    /* Sections */
    .section {
      page-break-before: always;
      padding: 20px 0;
      position: relative;
      overflow: hidden;
    }

    .section-header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 3px solid;
    }

    .section:nth-of-type(1) .section-header { border-color: #6366f1; }
    .section:nth-of-type(2) .section-header { border-color: #10b981; }
    .section:nth-of-type(3) .section-header { border-color: #f59e0b; }
    .section:nth-of-type(4) .section-header { border-color: #ef4444; }
    .section:nth-of-type(5) .section-header { border-color: #8b5cf6; }
    .section:nth-of-type(6) .section-header { border-color: #ec4899; }
    .section:nth-of-type(7) .section-header { border-color: #06b6d4; }

    .section h2 {
      font-size: 20pt;
      font-weight: 700;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      font-size: 16pt;
      font-weight: 700;
      color: white;
    }

    .section:nth-of-type(1) .section-number { background: #6366f1; }
    .section:nth-of-type(2) .section-number { background: #10b981; }
    .section:nth-of-type(3) .section-number { background: #f59e0b; }
    .section:nth-of-type(4) .section-number { background: #ef4444; }
    .section:nth-of-type(5) .section-number { background: #8b5cf6; }
    .section:nth-of-type(6) .section-number { background: #ec4899; }
    .section:nth-of-type(7) .section-number { background: #06b6d4; }

    .section h3 {
      font-size: 13pt;
      font-weight: 700;
      color: var(--primary);
      margin: 28px 0 14px;
      padding-left: 12px;
      border-left: 3px solid var(--primary);
    }

    .section h4 {
      font-size: 11pt;
      font-weight: 600;
      color: var(--text-dark);
      margin: 20px 0 10px;
    }

    .section p {
      margin-bottom: 14px;
      text-align: justify;
      color: var(--text-medium);
    }

    .section ul, .section ol {
      margin: 16px 0 16px 0;
      padding-left: 0;
      list-style: none;
    }

    .section li {
      margin-bottom: 12px;
      color: var(--text-medium);
      position: relative;
      padding-left: 24px;
      line-height: 1.6;
    }

    .section ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 8px;
      height: 8px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 50%;
    }

    .section ol {
      counter-reset: item;
    }

    .section ol li {
      counter-increment: item;
    }

    .section ol li::before {
      content: counter(item) ".";
      position: absolute;
      left: 0;
      font-weight: 600;
      color: var(--primary);
    }

    .section li strong {
      color: var(--text-dark);
    }

    /* Highlight boxes */
    .highlight-box {
      background: linear-gradient(135deg, var(--bg-light), white);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .key-metric {
      display: inline-block;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white;
      padding: 4px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 10pt;
      margin: 3px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 24px 0;
      font-size: 9.5pt;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid var(--border);
    }

    thead {
      background: linear-gradient(135deg, var(--primary), var(--accent));
    }

    th {
      color: white;
      font-weight: 600;
      text-align: left;
      padding: 14px 16px;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid rgba(255,255,255,0.2);
    }

    th:first-child {
      border-top-left-radius: 9px;
    }

    th:last-child {
      border-top-right-radius: 9px;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-medium);
      vertical-align: top;
      line-height: 1.5;
    }

    td strong {
      color: var(--primary);
    }

    tbody tr {
      transition: background-color 0.15s;
    }

    tbody tr:nth-child(even) {
      background: var(--bg-light);
    }

    tbody tr:hover {
      background: rgba(99, 102, 241, 0.05);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:last-child td:first-child {
      border-bottom-left-radius: 9px;
    }

    tbody tr:last-child td:last-child {
      border-bottom-right-radius: 9px;
    }

    /* Financial highlight cells */
    td:first-child {
      font-weight: 500;
      color: var(--text-dark);
    }

    /* Assumptions */
    .assumptions-section {
      page-break-before: always;
    }

    .assumption-category {
      margin: 24px 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .assumption-category h4 {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white;
      padding: 14px 20px;
      margin: 0;
      font-size: 12pt;
      border-left: none;
    }

    .assumption-list {
      border: 1px solid var(--border);
      border-top: none;
    }

    .assumption-item {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .assumption-item:last-child {
      border-bottom: none;
    }

    .assumption-item .key {
      font-weight: 600;
      color: var(--text-dark);
    }

    .assumption-item .value {
      color: var(--primary);
      font-weight: 600;
    }

    .assumption-item .rationale {
      width: 100%;
      font-size: 9pt;
      color: var(--text-light);
      margin-top: 4px;
      padding-left: 12px;
      border-left: 2px solid var(--border);
    }

    /* Disclaimer */
    .disclaimer {
      margin-top: 40px;
      padding: 24px;
      background: linear-gradient(135deg, #fef3c7, #fffbeb);
      border: 1px solid #f59e0b;
      border-radius: 10px;
      font-size: 9pt;
      color: #92400e;
    }

    .disclaimer strong {
      color: #b45309;
    }

    /* Typography enhancements */
    strong {
      font-weight: 600;
      color: var(--text-dark);
    }

    em {
      font-style: italic;
      color: var(--primary);
    }

    /* Decorative elements */
    .decorative-line {
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--accent), #ec4899, #06b6d4);
      border-radius: 2px;
      margin: 30px 0;
    }

    /* Watermark styling for PDF - appears on all pages */
    body::before {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      width: 400px;
      height: 400px;
      margin-left: -200px;
      margin-top: -200px;
      background-image: url('${options.watermarkImage || ''}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }

    .watermark-container {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 400px;
      height: 400px;
      margin-left: -200px;
      margin-top: -200px;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }

    .watermark-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .section,
    .toc-page,
    .cover-page {
      position: relative;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <!-- Global Watermark on All Pages -->
  ${
    options.watermarkImage
      ? `<div class="watermark-container" style="background-image: url('${options.watermarkImage}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>`
      : ''
  }

  <!-- Cover Page -->
  <div class="cover-page">
    ${options.companyLogo ? `<img src="${options.companyLogo}" alt="Logo" class="cover-logo" />` : ''}

    <h1>${escapeHtml(report.project.name)}</h1>
    <div class="cover-subtitle">${translations[language].feasibilityStudy}</div>

    <div class="cover-prepared">${translations[language].preparedBy}</div>
    <div class="cover-company">${escapeHtml(options.companyName || 'BI Feasibility Study')}</div>

    <div class="cover-tagline">${translations[language].tagline}</div>

    <div class="cover-badge">${escapeHtml(report.project.sector)}</div>

    <div class="cover-meta">
      ${options.projectCode ? `<div class="cover-meta-item"><span>${translations[language].projectCode}</span> ${escapeHtml(options.projectCode)}</div>` : ''}
      <div class="cover-meta-item"><span>${translations[language].location}</span> ${escapeHtml(report.project.city)}, ${escapeHtml(report.project.country)}</div>
      <div class="cover-meta-item"><span>${translations[language].reportDate}</span> ${date}</div>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc-page">
    <div class="toc-header">
      <h2>${translations[language].tableOfContents}</h2>
    </div>
    <div class="toc-list">
      <div class="toc-item">
        <span class="title">1. ${translations[language].section1}</span>
        <span class="dots"></span>
        <span class="page">3</span>
      </div>
      <div class="toc-item">
        <span class="title">2. ${translations[language].section2}</span>
        <span class="dots"></span>
        <span class="page">5</span>
      </div>
      <div class="toc-item">
        <span class="title">3. ${translations[language].section3}</span>
        <span class="dots"></span>
        <span class="page">8</span>
      </div>
      <div class="toc-item">
        <span class="title">4. ${translations[language].section4}</span>
        <span class="dots"></span>
        <span class="page">11</span>
      </div>
      <div class="toc-item">
        <span class="title">5. ${translations[language].section5}</span>
        <span class="dots"></span>
        <span class="page">15</span>
      </div>
      <div class="toc-item">
        <span class="title">6. ${translations[language].section6}</span>
        <span class="dots"></span>
        <span class="page">18</span>
      </div>
      <div class="toc-item">
        <span class="title">7. ${translations[language].section7}</span>
        <span class="dots"></span>
        <span class="page">21</span>
      </div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <div class="section-header">
      <h2><span class="section-number">1</span> ${translations[language].section1}</h2>
    </div>
    ${formatContent(report.executiveSummary || '', language)}
  </div>

  <!-- Market Analysis -->
  <div class="section">
    <div class="section-header">
      <h2><span class="section-number">2</span> ${translations[language].section2}</h2>
    </div>
    ${formatContent(report.marketAnalysis || '', language)}
  </div>

  <!-- Technical Feasibility -->
  <div class="section">
    <div class="section-header">
      <h2><span class="section-number">3</span> ${translations[language].section3}</h2>
    </div>
    ${formatContent(report.technicalAnalysis || '', language)}
  </div>

  <!-- Financial Analysis -->
  <div class="section">
    <div class="section-header">
      <h2><span class="section-number">4</span> ${translations[language].section4}</h2>
    </div>
    ${formatContent(report.financialAnalysis || '', language)}
  </div>

  <!-- Risk Assessment -->
  <div class="section">
    <div class="section-header">
      <h2><span class="section-number">5</span> ${translations[language].section5}</h2>
    </div>
    ${formatContent(report.riskAssessment || '', language)}
  </div>

  <!-- Recommendations -->
  <div class="section">
    <div class="section-header">
      <h2><span class="section-number">6</span> ${translations[language].section6}</h2>
    </div>
    ${formatContent(report.recommendations || '', language)}
  </div>

  <!-- Key Assumptions -->
  <div class="section assumptions-section">
    <div class="section-header">
      <h2><span class="section-number">7</span> ${translations[language].section7}</h2>
    </div>
    <p>${language === 'ar' ? 'الافتراضات التالية تدعم التحليل والتوقعات المقدمة في دراسة الجدوى هذه:' : 'The following assumptions underpin the analysis and projections presented in this feasibility study:'}</p>

    <div class="decorative-line"></div>

    ${formatAssumptions(report.assumptions)}

    <div class="disclaimer">
      <strong>${translations[language].disclaimer}</strong>
    </div>
  </div>
</body>
</html>
`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function formatContent(content: string, language: 'en' | 'ar' = 'en'): string {
  if (!content) return `<p>${translations[language].noContent}</p>`;

  // First, clean up the content
  let cleaned = content
    // Remove horizontal rules
    .replace(/^[-_*]{3,}\s*$/gm, '')
    // Remove placeholder patterns
    .replace(/\[Insert[^\]]*\]/gi, '')
    .replace(/\[TBD[^\]]*\]/gi, '')
    .replace(/\[Your[^\]]*\]/gi, '')
    .replace(/\[Company[^\]]*\]/gi, '')
    .replace(/\[Client[^\]]*\]/gi, '')
    .replace(/\[Date[^\]]*\]/gi, '')
    .replace(/\[Name[^\]]*\]/gi, '')
    .replace(/\[Senior[^\]]*\]/gi, '')
    .replace(/\[Consulting[^\]]*\]/gi, '')
    .replace(/Prepared\s+by:\s*$/gim, '')
    .replace(/Date:\s*$/gim, '')
    // Remove multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Process markdown tables first (before escaping HTML)
  const lines = cleaned.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a table row (starts and ends with |, or has | in the middle)
    const isTableRow = line.includes('|') && (line.startsWith('|') || line.match(/^\S+\s*\|/));
    const isTableSeparator = /^\|?[\s\-:|]+\|[\s\-:|]*\|?$/.test(line);

    if (isTableRow || isTableSeparator) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (!isTableSeparator) {
        tableRows.push(line);
      }
    } else {
      if (inTable && tableRows.length > 0) {
        // Convert accumulated table rows to HTML table
        processedLines.push(convertTableToHtml(tableRows));
        tableRows = [];
        inTable = false;
      }
      processedLines.push(line);
    }
  }

  // Handle table at end of content
  if (inTable && tableRows.length > 0) {
    processedLines.push(convertTableToHtml(tableRows));
  }

  // Now process the rest of the markdown
  let html = processedLines.join('\n');

  // Escape HTML in non-table content (tables are already HTML)
  const parts = html.split(/(<table[\s\S]*?<\/table>)/);
  html = parts.map((part, i) => {
    if (part.startsWith('<table')) {
      return part; // Don't escape table HTML
    }
    return escapeHtml(part);
  }).join('');

  // Convert markdown formatting
  html = html
    // Headers
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h3>$1</h3>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Handle numbered lists
    .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
    // Handle bullet lists (-, •, *)
    .replace(/^[\-\•\*]\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // Wrap in paragraph (but not tables)
  html = `<p>${html}</p>`;

  // Fix consecutive list items - wrap in ul
  html = html.replace(/(<li>[\s\S]*?<\/li>(\s*<br \/>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br \/>/g, '') + '</ul>';
  });

  // Clean up empty paragraphs and formatting issues
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*<br \/>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<table)/g, '$1');
  html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<br \/>\s*<br \/>/g, '</p><p>');

  return html;
}

function convertTableToHtml(rows: string[]): string {
  if (rows.length === 0) return '';

  const parseRow = (row: string): string[] => {
    // Remove leading/trailing pipes and split by |
    return row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
  };

  const headerCells = parseRow(rows[0]);

  let tableHtml = '<table><thead><tr>';
  headerCells.forEach(cell => {
    tableHtml += `<th>${escapeHtml(cell)}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  // Process data rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const cells = parseRow(rows[i]);
    tableHtml += '<tr>';
    cells.forEach(cell => {
      // Handle bold text in cells
      const formattedCell = escapeHtml(cell)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      tableHtml += `<td>${formattedCell}</td>`;
    });
    tableHtml += '</tr>';
  }

  tableHtml += '</tbody></table>';
  return tableHtml;
}

function formatAssumptions(
  assumptions: Array<{
    category: string;
    key: string;
    value: string;
    rationale: string | null;
  }>
): string {
  if (!assumptions || !assumptions.length) {
    return '<p>No assumptions documented.</p>';
  }

  // Group by category
  const grouped = assumptions.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof assumptions>);

  let html = '';
  for (const [category, items] of Object.entries(grouped)) {
    html += `
      <div class="assumption-category">
        <h4>${escapeHtml(category)} Assumptions</h4>
        <div class="assumption-list">
          ${items
            .map(
              (item) => `
            <div class="assumption-item">
              <span class="key">${escapeHtml(item.key)}:</span>
              <span class="value">${escapeHtml(item.value)}</span>
              ${item.rationale ? `<div class="rationale">${escapeHtml(item.rationale)}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  return html;
}
