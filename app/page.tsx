import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, FileText, Zap, Shield, Globe, Clock, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-blur rounded-full px-6 py-3">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="BI Feasibility Study"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold text-white">BI Feasibility Study</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">
                How It Works
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-4">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-white">Professional</span>
            <br />
            <span className="gradient-text">Feasibility Studies</span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Generate comprehensive, investor-ready feasibility reports in minutes.
            Powered by advanced AI to deliver McKinsey-quality analysis for your projects.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 h-12 text-base font-medium btn-glow">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">60+</div>
              <div className="text-sm text-slate-500 mt-1">Page Reports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">15+</div>
              <div className="text-sm text-slate-500 mt-1">Sectors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5min</div>
              <div className="text-sm text-slate-500 mt-1">Generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Enterprise-Grade Analysis
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need for comprehensive project evaluation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Comprehensive Reports"
              description="60-80 page professional reports covering market analysis, financial projections, risk assessment, and strategic recommendations."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="AI-Powered Insights"
              description="Advanced language models analyze your project parameters to generate data-driven insights and actionable recommendations."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Multi-Sector Support"
              description="Support for 15+ industry sectors including Real Estate, Healthcare, Technology, Manufacturing, and more."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Financial Modeling"
              description="Detailed 5-year projections with NPV, IRR, payback period, and sensitivity analysis across multiple scenarios."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Risk Assessment"
              description="Comprehensive risk analysis with mitigation strategies, covering market, operational, financial, and regulatory risks."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Rapid Delivery"
              description="Generate complete feasibility studies in minutes, not weeks. Review, adjust assumptions, and regenerate instantly."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Three simple steps to your professional feasibility study
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Input Project Details"
              description="Enter your project name, sector, location, and description. Optionally upload supporting documents."
            />
            <StepCard
              number="02"
              title="AI Analysis"
              description="Our AI analyzes your inputs against market data, industry benchmarks, and financial models."
            />
            <StepCard
              number="03"
              title="Download Report"
              description="Receive a comprehensive PDF report with executive summary, analysis, and recommendations."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center glow">
            <Sparkles className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of entrepreneurs and investors using AI-powered feasibility analysis.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 h-12 text-base font-medium btn-glow">
                Start Free Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="BI Feasibility Study"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold text-white">BI Feasibility Study</span>
            </div>
            <p className="mt-4 md:mt-0 text-slate-500 text-sm">
              © {new Date().getFullYear()} BI Feasibility Study. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-6 card-hover">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-500/20 flex items-center justify-center text-cyan-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="text-5xl font-bold gradient-text mb-4">{number}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
