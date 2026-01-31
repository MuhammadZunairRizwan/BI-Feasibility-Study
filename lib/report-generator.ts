import { generateContent, generateJSON } from '@/lib/openrouter';

interface Project {
  id: string;
  name: string;
  sector: string;
  country: string;
  city: string;
  loanAvailable: boolean;
  description: string;
  documents: Array<{
    id: string;
    filename?: string;
    content?: string | null;
  }>;
}

interface ReportSection {
  content: string;
}

interface Assumption {
  category: string;
  key: string;
  value: string;
  rationale: string;
}

export interface GeneratedReport {
  executiveSummary: string;
  marketAnalysis: string;
  technicalAnalysis: string;
  financialAnalysis: string;
  riskAssessment: string;
  recommendations: string;
  assumptions: Assumption[];
  createdAt: Date;
}

// Calculate word counts for each section based on total desired word count
function calculateSectionWordCounts(totalWordCount: number) {
  // Distribution: Executive (12%), Market (25%), Technical (20%), Financial (25%), Risk (12%), Recommendations (6%)
  return {
    executiveSummary: Math.round(totalWordCount * 0.12),
    marketAnalysis: Math.round(totalWordCount * 0.25),
    technicalAnalysis: Math.round(totalWordCount * 0.20),
    financialAnalysis: Math.round(totalWordCount * 0.25),
    riskAssessment: Math.round(totalWordCount * 0.12),
    recommendations: Math.round(totalWordCount * 0.06),
  };
}

// Count words in text
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

// Clean up LLM output - remove placeholder text, horizontal rules, and other artifacts
function cleanContent(content: string): string {
  return content
    // Remove horizontal rules (---, ___, ***)
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
    .replace(/\[Firm[^\]]*\]/gi, '')
    .replace(/\[Project[^\]]*\]/gi, '')
    .replace(/\[Location[^\]]*\]/gi, '')
    .replace(/\[Address[^\]]*\]/gi, '')
    .replace(/\[Phone[^\]]*\]/gi, '')
    .replace(/\[Email[^\]]*\]/gi, '')
    .replace(/\[Website[^\]]*\]/gi, '')
    .replace(/\[Logo[^\]]*\]/gi, '')
    // Remove letterhead/signature patterns
    .replace(/Prepared\s+by:\s*\[?[^\]\n]*\]?\s*$/gim, '')
    .replace(/Date:\s*\[?[^\]\n]*\]?\s*$/gim, '')
    .replace(/Confidential\s*[-–]\s*.*$/gim, '')
    // Remove multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace
    .trim();
}

// Synchronous version that returns the report data directly (for use without Firebase Admin)
export async function generateFeasibilityReportSync(project: Project, wordCount: number = 5000): Promise<GeneratedReport> {
  console.log('Starting synchronous report generation for project:', project.id, 'with wordCount:', wordCount);

  // Prepare document context
  const documentContext = project.documents
    .filter((doc) => doc.content)
    .map((doc) => `Document: ${doc.filename}\n${doc.content}`)
    .join('\n\n');

  const projectContext = `
Project Name: ${project.name}
Industry Sector: ${project.sector}
Location: ${project.city}, ${project.country}
Financing Available: ${project.loanAvailable ? 'Yes' : 'No'}
Project Description: ${project.description}

${documentContext ? `Supporting Documents:\n${documentContext}` : ''}
`;

  const sectionWordCounts = calculateSectionWordCounts(wordCount);
  console.log('📊 Section word count breakdown:', sectionWordCounts);

  // Generate all sections in parallel for faster processing
  console.log('🚀 Generating all sections in parallel...');
  const [
    executiveSummary,
    marketAnalysis,
    technicalAnalysis,
    financialAnalysis,
    riskAssessment,
    recommendations,
    assumptions,
  ] = await Promise.all([
    generateExecutiveSummary(projectContext, sectionWordCounts.executiveSummary),
    generateMarketAnalysis(projectContext, sectionWordCounts.marketAnalysis),
    generateTechnicalAnalysis(projectContext, sectionWordCounts.technicalAnalysis),
    generateFinancialAnalysis(projectContext, sectionWordCounts.financialAnalysis),
    generateRiskAssessment(projectContext, sectionWordCounts.riskAssessment),
    generateRecommendations(projectContext, sectionWordCounts.recommendations),
    generateAssumptions(projectContext),
  ]);

  // Calculate total word count
  const totalWords =
    countWords(executiveSummary.content) +
    countWords(marketAnalysis.content) +
    countWords(technicalAnalysis.content) +
    countWords(financialAnalysis.content) +
    countWords(riskAssessment.content) +
    countWords(recommendations.content);

  console.log(`✅ All sections generated successfully (sync mode)`);
  console.log(`📊 TOTAL WORDS: ${totalWords} (Target: ${wordCount})`);

  return {
    executiveSummary: executiveSummary.content,
    marketAnalysis: marketAnalysis.content,
    technicalAnalysis: technicalAnalysis.content,
    financialAnalysis: financialAnalysis.content,
    riskAssessment: riskAssessment.content,
    recommendations: recommendations.content,
    assumptions,
    createdAt: new Date(),
  };
}

export async function generateFeasibilityReport(project: Project, wordCount: number = 5000): Promise<void> {
  // Dynamic import to handle case where Firebase Admin is not configured
  const { adminDb } = await import('@/lib/firebase-admin');

  try {
    console.log('🚀 Starting report generation for project:', project.id, 'with wordCount:', wordCount);

    // Prepare document context
    const documentContext = project.documents
      .filter((doc) => doc.content)
      .map((doc) => `Document: ${doc.filename}\n${doc.content}`)
      .join('\n\n');

    const projectContext = `
Project Name: ${project.name}
Industry Sector: ${project.sector}
Location: ${project.city}, ${project.country}
Financing Available: ${project.loanAvailable ? 'Yes' : 'No'}
Project Description: ${project.description}

${documentContext ? `Supporting Documents:\n${documentContext}` : ''}
`;

    const sectionWordCounts = calculateSectionWordCounts(wordCount);
    console.log('📊 Section word count breakdown:', sectionWordCounts);

    // Generate all sections in parallel for faster processing
    console.log('🚀 Generating all sections in parallel...');
    const [
      executiveSummary,
      marketAnalysis,
      technicalAnalysis,
      financialAnalysis,
      riskAssessment,
      recommendations,
      assumptions,
    ] = await Promise.all([
      generateExecutiveSummary(projectContext, sectionWordCounts.executiveSummary),
      generateMarketAnalysis(projectContext, sectionWordCounts.marketAnalysis),
      generateTechnicalAnalysis(projectContext, sectionWordCounts.technicalAnalysis),
      generateFinancialAnalysis(projectContext, sectionWordCounts.financialAnalysis),
      generateRiskAssessment(projectContext, sectionWordCounts.riskAssessment),
      generateRecommendations(projectContext, sectionWordCounts.recommendations),
      generateAssumptions(projectContext),
    ]);

    // Calculate total word count
    const totalWords =
      countWords(executiveSummary.content) +
      countWords(marketAnalysis.content) +
      countWords(technicalAnalysis.content) +
      countWords(financialAnalysis.content) +
      countWords(riskAssessment.content) +
      countWords(recommendations.content);

    console.log(`✅ All sections generated successfully`);
    console.log(`📊 TOTAL WORDS: ${totalWords} (Target: ${wordCount})`);

    // Save to Firestore if adminDb is available
    if (adminDb) {
      // Create the report in Firestore
      const reportRef = adminDb
        .collection('projects')
        .doc(project.id)
        .collection('reports')
        .doc();

      const reportData = {
        executiveSummary: executiveSummary.content,
        marketAnalysis: marketAnalysis.content,
        technicalAnalysis: technicalAnalysis.content,
        financialAnalysis: financialAnalysis.content,
        riskAssessment: riskAssessment.content,
        recommendations: recommendations.content,
        createdAt: new Date(),
      };

      await reportRef.set(reportData);

      // Create assumptions as subcollection
      const batch = adminDb.batch();
      for (const assumption of assumptions) {
        const assumptionRef = reportRef.collection('assumptions').doc();
        batch.set(assumptionRef, {
          category: assumption.category,
          key: assumption.key,
          value: assumption.value,
          rationale: assumption.rationale,
        });
      }
      await batch.commit();

      // Update project status
      await adminDb.collection('projects').doc(project.id).update({
        status: 'completed',
        updatedAt: new Date(),
      });

      console.log(`Report generated and saved successfully for project ${project.id}`);
    } else {
      console.warn('Firebase Admin not configured. Report generated but cannot be saved server-side.');
      console.log('Report sections generated:', {
        executiveSummary: executiveSummary.content.substring(0, 100) + '...',
        marketAnalysis: 'Generated',
        technicalAnalysis: 'Generated',
        financialAnalysis: 'Generated',
        riskAssessment: 'Generated',
        recommendations: 'Generated',
        assumptions: assumptions.length + ' assumptions',
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    if (adminDb) {
      await adminDb.collection('projects').doc(project.id).update({
        status: 'failed',
        updatedAt: new Date(),
      });
    }
    throw error;
  }
}

async function generateExecutiveSummary(context: string, wordCount: number = 600): Promise<ReportSection> {
  const minWords = Math.round(wordCount * 0.9);
  const maxWords = Math.round(wordCount * 1.1);

  const prompt = `You are a senior management consultant at a top-tier firm (McKinsey, BCG, Bain level).
Generate a DETAILED and COMPREHENSIVE Executive Summary for this feasibility study.

${context}

The Executive Summary MUST include the following sections with EXTENSIVE detail:

1. PROJECT OVERVIEW (Write 2-3 detailed paragraphs covering):
   - Detailed description of the project concept and scope
   - Strategic rationale and business case
   - Key stakeholders and their roles
   - Market context and timing

2. KEY FINDINGS (Provide 8-10 detailed bullet points covering):
   - Market opportunity assessment
   - Technical feasibility assessment
   - Financial viability indicators
   - Risk profile summary
   - Competitive positioning
   - Operational readiness

3. FINANCIAL HIGHLIGHTS (Provide detailed section covering):
   - Estimated Total Investment Required (with breakdown)
   - NPV calculation with discount rate
   - IRR projection
   - Payback Period estimate
   - 5-year revenue potential
   - Break-even analysis

4. STRATEGIC RECOMMENDATION (Provide detailed section with):
   - Clear GO/NO-GO recommendation
   - Confidence level (HIGH/MEDIUM/LOW) with justification
   - Top 3 reasons supporting the recommendation
   - Key conditions or dependencies

5. CRITICAL SUCCESS FACTORS (Provide 5-7 detailed points with):
   - Factor description
   - Why it's critical
   - How it will be addressed

IMPORTANT FORMATTING RULES:
- Write in a professional, authoritative tone
- Use specific numbers, percentages, and data
- Use markdown headers (## for main sections, ### for subsections)
- Use bullet points with "-" for lists
- DO NOT use "---" horizontal rules
- DO NOT include placeholder text
- Start directly with content
- Include detailed explanations, not just brief statements

CRITICAL WORD COUNT REQUIREMENT:
- MINIMUM: ${minWords} words
- MAXIMUM: ${maxWords} words
- Your response MUST be between these word counts
- To reach this word count, expand each section with detailed analysis, specific examples, and comprehensive explanations
- If you complete the outline in fewer words, add more depth to each section
- Do not use filler text - only substantive content that adds value`;

  const content = await generateContent({
    prompt,
    systemPrompt: 'You are a senior management consultant producing professional feasibility studies. Never include placeholder text, letterheads, or signature blocks. Start directly with substantive content.',
    temperature: 0.7,
  });

  const cleanedContent = cleanContent(content);
  const actualWords = countWords(cleanedContent);
  console.log(`📝 Executive Summary: Target ${minWords}-${maxWords} words, Actual: ${actualWords} words`);

  return { content: cleanedContent };
}

async function generateMarketAnalysis(context: string, wordCount: number = 1250): Promise<ReportSection> {
  const minWords = Math.round(wordCount * 0.9);
  const maxWords = Math.round(wordCount * 1.1);

  const prompt = `You are a senior market research analyst at a top consulting firm.
Generate a DETAILED and COMPREHENSIVE Market Analysis section for this feasibility study.

${context}

The Market Analysis MUST include the following sections with EXTENSIVE detail:

1. INDUSTRY OVERVIEW (Write detailed section covering):
   - Current market size with specific figures and currency
   - Historical growth rates and CAGR (Compound Annual Growth Rate)
   - Future growth projections (3-5 year forecast)
   - Key market drivers (regulations, technology, demographics, etc.)
   - Market restraints and challenges
   - Regulatory environment and compliance requirements
   - Industry trends and shifts

2. TARGET MARKET ANALYSIS (Write detailed section covering):
   - Detailed customer segmentation (minimum 4-5 segments)
   - Size and characteristics of each segment
   - Customer pain points and needs
   - Demand assessment with quantified estimates
   - Purchasing behavior and decision factors
   - Pricing analysis with competitor comparison
   - Customer acquisition cost (CAC) estimates

3. COMPETITIVE LANDSCAPE (Write detailed section covering):
   - Minimum 4-5 key competitors with detailed analysis of each:
     * Company profile and market position
     * Product/service offerings
     * Pricing strategy
     * Market share estimates
     * Strengths and weaknesses
   - Create a comparison table with 5-7 attributes
   - Competitive positioning recommendations
   - Barriers to entry analysis
   - Competitive advantages for this project

4. MARKET OPPORTUNITY ASSESSMENT (Write detailed section covering):
   - Identified market gaps and unmet needs
   - Total addressable market (TAM)
   - Serviceable addressable market (SAM)
   - Realistic target market share projections
   - Quantified opportunity sizing
   - Growth potential and expansion opportunities
   - Timeline for market development

IMPORTANT FORMATTING RULES:
- Use industry-specific data and benchmarks with specific numbers and percentages
- Include realistic financial figures based on industry standards
- Use markdown headers (## for main sections, ### for subsections)
- Create detailed comparison tables for competitor analysis
- Use bullet points with "-" for lists
- DO NOT use "---" horizontal rules
- DO NOT include placeholder text
- Start directly with content

CRITICAL WORD COUNT REQUIREMENT:
- MINIMUM: ${minWords} words
- MAXIMUM: ${maxWords} words
- Your response MUST be between these word counts
- To reach this word count, provide extensive detail on each competitor, market segment, and opportunity
- Include specific numbers, market percentages, and financial figures
- If you complete the analysis in fewer words, add more depth to competitor profiles and opportunity assessment
- Every section must be substantive and data-driven`;

  const content = await generateContent({
    prompt,
    systemPrompt: 'You are a senior market research analyst producing professional market analysis. Never include placeholder text. Use proper markdown tables for comparisons.',
    temperature: 0.7,
  });

  const cleanedContent = cleanContent(content);
  const actualWords = countWords(cleanedContent);
  console.log(`📝 Market Analysis: Target ${minWords}-${maxWords} words, Actual: ${actualWords} words`);

  return { content: cleanedContent };
}

async function generateTechnicalAnalysis(context: string, wordCount: number = 1000): Promise<ReportSection> {
  const minWords = Math.round(wordCount * 0.9);
  const maxWords = Math.round(wordCount * 1.1);

  const prompt = `You are a senior technical consultant specializing in project feasibility.
Generate a DETAILED and COMPREHENSIVE Technical Feasibility Analysis for this project.

${context}

The Technical Analysis MUST include the following sections with EXTENSIVE detail:

1. TECHNICAL REQUIREMENTS (Write detailed section covering):
   - Complete infrastructure needs breakdown
   - Specific technology stack with versions and costs
   - Equipment requirements with specifications and quantities
   - Facility requirements and modifications needed
   - IT infrastructure and security requirements
   - Integration requirements with existing systems
   - Data management and storage needs

2. RESOURCE ASSESSMENT (Write detailed section covering):
   - Complete staffing plan with roles and quantities
   - Technical expertise requirements by domain
   - Skill gaps and training plans
   - Hiring timeline and costs
   - Contractor/consultant needs
   - Organizational structure for technical team

3. IMPLEMENTATION CONSIDERATIONS (Write detailed section covering):
   - Identified technical challenges (minimum 5-7 challenges)
   - Detailed analysis of each challenge
   - Multiple solution approaches for each challenge
   - Risk mitigations
   - Dependencies and critical path items
   - Industry best practices and standards
   - Lessons learned from similar projects

4. OPERATIONAL MODEL (Write detailed section covering):
   - Detailed process flows and workflows
   - System architecture and components
   - Data flows and integration points
   - Quality assurance procedures and standards
   - Performance metrics and KPIs
   - Monitoring and maintenance procedures
   - Disaster recovery and business continuity plans

5. TECHNOLOGY ROADMAP (Write detailed section covering):
   - Phase-by-phase implementation plan (minimum 4-5 phases)
   - Specific deliverables for each phase
   - Timeline with milestones and dependencies
   - Technology scalability assessment
   - Capacity planning and growth projections
   - Future technology needs and upgrades
   - Maintenance and support strategy

IMPORTANT FORMATTING RULES:
- Be specific and technical with concrete specifications
- Include cost estimates and resource quantities
- Use markdown headers (## for main sections, ### for subsections)
- Create detailed requirements table, timeline table, and resource table
- Use proper markdown table format
- DO NOT use "---" horizontal rules
- DO NOT include placeholder text
- Start directly with content

CRITICAL WORD COUNT REQUIREMENT:
- MINIMUM: ${minWords} words
- MAXIMUM: ${maxWords} words
- Your response MUST be between these word counts
- To reach this word count, provide extensive technical specifications, detailed implementation plans, and comprehensive resource assessments
- Include specific technologies, costs, timelines, and quantities
- If you complete the analysis in fewer words, add more depth to each phase and resource requirement
- Every section must include concrete, actionable technical details`;

  const content = await generateContent({
    prompt,
    systemPrompt: 'You are a senior technical consultant producing professional technical assessments. Use proper markdown tables for specifications.',
    temperature: 0.7,
  });

  const cleanedContent = cleanContent(content);
  const actualWords = countWords(cleanedContent);
  console.log(`📝 Technical Analysis: Target ${minWords}-${maxWords} words, Actual: ${actualWords} words`);

  return { content: cleanedContent };
}

async function generateFinancialAnalysis(context: string, wordCount: number = 1250): Promise<ReportSection> {
  const minWords = Math.round(wordCount * 0.9);
  const maxWords = Math.round(wordCount * 1.1);

  const prompt = `You are a senior financial analyst at a leading investment firm.
Generate a DETAILED and COMPREHENSIVE Financial Analysis for this feasibility study.

${context}

The Financial Analysis MUST include the following sections with EXTENSIVE detail:

1. CAPITAL REQUIREMENTS (Write detailed section covering):
   - Detailed itemized initial investment breakdown with quantities and unit costs
   - Land and facility costs (if applicable)
   - Equipment and technology costs
   - Working capital requirements with detailed justification
   - Pre-operating expenses
   - Contingency allocation (typically 10-15%) with rationale
   - Total capital requirement with escalation factors
   - Create detailed capital requirements table

2. REVENUE PROJECTIONS (Write detailed section covering):
   - Detailed 5-year revenue forecast with monthly/quarterly detail for year 1
   - Multiple revenue streams with individual projections
   - Pricing strategy and rate assumptions
   - Volume/unit sales projections by product/service
   - Market penetration assumptions
   - Create detailed revenue projection table with growth rates
   - Justification for growth assumptions based on market analysis

3. COST STRUCTURE (Write detailed section covering):
   - Fixed costs analysis with detailed breakdown:
     * Salaries and personnel costs
     * Facility and rent costs
     * Licenses and insurance
     * Administrative overhead
   - Variable costs as percentage of revenue
   - Operating expense projections by category
   - Cost escalation factors and inflation assumptions
   - Create detailed cost structure tables

4. PROFITABILITY ANALYSIS (Write detailed section covering):
   - Year-by-year profitability projections
   - Gross margin analysis with industry comparisons
   - EBITDA margin projections
   - Net profit margin analysis
   - Break-even point analysis (units and timeframe)
   - Path to profitability
   - Create comprehensive profitability summary table

5. INVESTMENT RETURNS (Write detailed section covering):
   - NPV calculation with detailed cash flow analysis and discount rate justification
   - IRR calculation and interpretation
   - Payback period analysis
   - Return on Investment (ROI) over multiple time horizons
   - Return on Equity (ROE) analysis
   - Create key financial metrics table with detailed explanations

6. SENSITIVITY ANALYSIS (Write detailed section covering):
   - Base case, optimistic case, and conservative case scenarios
   - Impact analysis of key variables (pricing, volume, costs)
   - Break-even sensitivity
   - Financial metrics under different scenarios
   - Create comprehensive sensitivity analysis table

7. FUNDING STRUCTURE (Write detailed section covering):
   - Recommended debt/equity mix with rationale
   - Specific financing options available
   - Debt service requirements and repayment schedules
   - Weighted average cost of capital (WACC) calculation
   - Interest rate and refinancing assumptions
   - Funding timeline and disbursement schedule

IMPORTANT FORMATTING RULES:
- Include specific, realistic numbers based on industry benchmarks
- Use markdown headers (## for main sections, ### for subsections)
- MUST use proper markdown tables for all financial data
- Include multiple detailed tables for different financial aspects
- DO NOT use "---" horizontal rules
- DO NOT include placeholder text
- Start directly with content

CRITICAL WORD COUNT REQUIREMENT:
- MINIMUM: ${minWords} words
- MAXIMUM: ${maxWords} words
- Your response MUST be between these word counts
- To reach this word count, provide extensive financial analysis, detailed projections, comprehensive tables, and thorough explanations
- Include specific numbers, percentages, and financial figures for every section
- If you complete the analysis in fewer words, add more depth to sensitivity analysis, scenario planning, and financial assumptions
- Every table must include detailed data and explanations`;

  const content = await generateContent({
    prompt,
    systemPrompt: 'You are a senior financial analyst producing professional financial assessments. Always use proper markdown tables for financial projections and metrics. Never use placeholder text.',
    temperature: 0.6,
  });

  const cleanedContent = cleanContent(content);
  const actualWords = countWords(cleanedContent);
  console.log(`📝 Financial Analysis: Target ${minWords}-${maxWords} words, Actual: ${actualWords} words`);

  return { content: cleanedContent };
}

async function generateRiskAssessment(context: string, wordCount: number = 600): Promise<ReportSection> {
  const minWords = Math.round(wordCount * 0.9);
  const maxWords = Math.round(wordCount * 1.1);

  const prompt = `You are a senior risk management consultant.
Generate a DETAILED and COMPREHENSIVE Risk Assessment for this feasibility study.

${context}

The Risk Assessment MUST include the following sections with EXTENSIVE detail:

1. RISK IDENTIFICATION (Write detailed section covering minimum 12-15 risks across categories):
   - MARKET RISKS (4-5 risks):
     * Demand fluctuation and market size changes
     * Pricing pressure and competition
     * Market timing and adoption rates
     * Customer concentration risks
     * Detailed analysis and likelihood assessment for each

   - OPERATIONAL RISKS (4-5 risks):
     * Resource availability and staffing
     * Supply chain disruptions
     * Technology and system failures
     * Process execution and implementation delays
     * Detailed analysis and impact assessment for each

   - FINANCIAL RISKS (3-4 risks):
     * Cost overruns and budget constraints
     * Financing and funding risks
     * Cash flow and working capital issues
     * Currency and inflation risks

   - REGULATORY/COMPLIANCE RISKS (2-3 risks):
     * Regulatory changes and compliance requirements
     * Licensing and permits
     * Environmental and social compliance

   - STRATEGIC RISKS (2-3 risks):
     * Technology obsolescence
     * Strategic misalignment
     * Partnership/vendor risks

2. RISK ANALYSIS MATRIX (Write detailed section with):
   - Create comprehensive risk matrix table with minimum 12-15 risks
   - Columns: Risk Description, Probability (High/Medium/Low), Impact (High/Medium/Low), Priority, Current Controls
   - Detailed narrative explanation of each risk
   - Scoring rationale for probability and impact

3. RISK MITIGATION STRATEGIES (Write detailed section covering):
   - For each HIGH priority risk: detailed preventive measures
   - Contingency plans and backup strategies
   - Risk transfer options (insurance, hedging, contracts)
   - Responsibility assignment for each mitigation
   - Timeline for implementing mitigation measures

4. RISK MONITORING FRAMEWORK (Write detailed section covering):
   - Create risk monitoring table with:
     * Risk Category
     * Key Risk Indicator (KRI)
     * Threshold/Alert Level
     * Monitoring Frequency
     * Responsible Party
   - Detailed explanation of each KRI and why it's important
   - Escalation procedures when thresholds are breached

5. SCENARIO ANALYSIS (Write detailed section covering):
   - Stress testing under different scenarios (pessimistic, moderate, optimistic)
   - Impact on financial projections
   - Operational implications
   - Recovery strategies and mitigation timelines
   - Contingency budgets and reserves

IMPORTANT FORMATTING RULES:
- Be specific about risks relevant to the industry and location
- Use markdown headers (## for main sections, ### for subsections)
- Create detailed risk matrix and monitoring tables
- Include specific probability percentages and impact quantifications
- DO NOT use "---" horizontal rules
- DO NOT include placeholder text
- Start directly with content

CRITICAL WORD COUNT REQUIREMENT:
- MINIMUM: ${minWords} words
- MAXIMUM: ${maxWords} words
- Your response MUST be between these word counts
- To reach this word count, provide extensive risk analysis, detailed mitigation strategies, and comprehensive monitoring framework
- Include specific numbers, percentages, and financial quantifications for risks
- If you complete the analysis in fewer words, add more depth to risk scenarios and mitigation strategies
- Every risk must have detailed analysis and actionable mitigation steps`;

  const content = await generateContent({
    prompt,
    systemPrompt: 'You are a senior risk management consultant producing professional risk assessments. Always use proper markdown tables for risk matrices.',
    temperature: 0.7,
  });

  const cleanedContent = cleanContent(content);
  const actualWords = countWords(cleanedContent);
  console.log(`📝 Risk Assessment: Target ${minWords}-${maxWords} words, Actual: ${actualWords} words`);

  return { content: cleanedContent };
}

async function generateRecommendations(context: string, wordCount: number = 300): Promise<ReportSection> {
  const minWords = Math.round(wordCount * 0.9);
  const maxWords = Math.round(wordCount * 1.1);

  const prompt = `You are a senior strategy consultant providing actionable recommendations.
Generate a DETAILED and COMPREHENSIVE Recommendations section for this feasibility study.

${context}

The Recommendations section MUST include the following sections with EXTENSIVE detail:

1. OVERALL RECOMMENDATION (Write detailed section with):
   - Clear GO/NO-GO recommendation with confidence level (HIGH/MEDIUM/LOW)
   - Top 3-5 reasons supporting the recommendation with detailed explanations
   - Key conditions or dependencies for success
   - Timeline rationale (when to start)
   - Detailed risk/reward analysis

2. STRATEGIC RECOMMENDATIONS (Write detailed section covering):
   - Market entry strategy with specific approach:
     * Geographic strategy
     * Customer acquisition approach
     * Channel strategy
   - Competitive positioning strategy
   - Growth strategy with scaling plans
   - Strategic partnerships and alliances
   - Detailed justification for each recommendation

3. IMPLEMENTATION ROADMAP (Write detailed section covering):
   - Detailed timeline with minimum 4-5 phases
   - Each phase with:
     * Specific deliverables and milestones
     * Activities and tasks
     * Timeline and dependencies
     * Resource requirements
     * Budget and investment
   - Create comprehensive implementation timeline table
   - Critical path and dependencies

4. RISK MANAGEMENT RECOMMENDATIONS (Write detailed section covering):
   - Top 5-7 priority risks to address
   - For each risk: specific actions and mitigation steps
   - Implementation timeline for mitigations
   - Responsible parties
   - Monitoring plan
   - Contingency plans

5. FINANCIAL RECOMMENDATIONS (Write detailed section covering):
   - Recommended funding structure (debt vs equity mix)
   - Specific investment timing and disbursement schedule
   - Target financial metrics and KPIs
   - Pricing strategy
   - Cost management recommendations
   - Break-even targets and milestones

6. ORGANIZATIONAL & OPERATIONAL RECOMMENDATIONS (Write detailed section covering):
   - Organizational structure recommendations
   - Key personnel and roles needed
   - Capability building and training needs
   - Operational procedures and standards
   - Governance and decision-making framework

7. NEXT STEPS / ACTION ITEMS (Write detailed section with):
   - Create detailed action items table with:
     * Priority (High/Medium/Low)
     * Specific Action
     * Responsible Owner
     * Deadline
     * Success Criteria
   - Immediate priorities (next 30 days)
   - Short-term actions (1-3 months)
   - Medium-term actions (3-6 months)

8. SUCCESS METRICS & KPIs (Write detailed section with):
   - Create comprehensive KPI table with:
     * KPI Name
     * Target Value
     * Baseline/Current Value
     * Measurement Frequency
     * Responsible Party
   - Leading indicators (predictive metrics)
   - Lagging indicators (outcome metrics)
   - Review and adjustment cadence

IMPORTANT FORMATTING RULES:
- Be specific, actionable, and prioritized
- Use markdown headers (## for main sections, ### for subsections)
- Create detailed tables for implementation roadmap, action items, and KPIs
- DO NOT use "---" horizontal rules
- DO NOT include placeholder text
- Start directly with content

CRITICAL WORD COUNT REQUIREMENT:
- MINIMUM: ${minWords} words
- MAXIMUM: ${maxWords} words
- Your response MUST be between these word counts
- To reach this word count, provide extensive strategic analysis, detailed implementation steps, comprehensive action plans, and specific success metrics
- Include specific timelines, responsibilities, and measurable targets
- If you complete the recommendations in fewer words, add more depth to implementation phases and strategic rationale
- Every recommendation must include detailed justification and actionable steps`;

  const content = await generateContent({
    prompt,
    systemPrompt: 'You are a senior strategy consultant providing actionable business recommendations. Use proper markdown tables for implementation timelines.',
    temperature: 0.7,
  });

  const cleanedContent = cleanContent(content);
  const actualWords = countWords(cleanedContent);
  console.log(`📝 Recommendations: Target ${minWords}-${maxWords} words, Actual: ${actualWords} words`);

  return { content: cleanedContent };
}

async function generateAssumptions(context: string): Promise<Assumption[]> {
  const prompt = `Generate key assumptions for this feasibility study.

${context}

Provide assumptions in the following categories:
1. Market Assumptions (market size, growth rate, market share)
2. Financial Assumptions (inflation, interest rates, tax rates, costs)
3. Operational Assumptions (capacity, efficiency, staffing)
4. Timeline Assumptions (construction, ramp-up, milestones)

For each assumption provide:
- category: The category name
- key: The assumption name
- value: The specific value or range
- rationale: Brief explanation for the assumption

Provide 15-20 key assumptions total.

Return as a JSON array of objects with the structure:
[{"category": "...", "key": "...", "value": "...", "rationale": "..."}]`;

  try {
    const assumptions = await generateJSON<Assumption[]>(prompt);
    return assumptions;
  } catch (error) {
    console.error('Error generating assumptions:', error);
    return [
      {
        category: 'Financial',
        key: 'Discount Rate',
        value: '10%',
        rationale: 'Based on industry standard cost of capital',
      },
      {
        category: 'Financial',
        key: 'Inflation Rate',
        value: '3% annually',
        rationale: 'Conservative estimate based on economic forecasts',
      },
      {
        category: 'Market',
        key: 'Market Growth',
        value: '5-7% annually',
        rationale: 'Based on industry trends and regional economic growth',
      },
    ];
  }
}
