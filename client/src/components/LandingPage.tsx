import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Brain, BarChart3, CheckCircle } from "lucide-react";
import heroImage from "@assets/generated_images/Financial_growth_hero_image_d98a96dd.png";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const handleGetStarted = () => {
    console.log('Get Started button clicked');
    onGetStarted?.();
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced algorithms analyze your risk profile and market conditions"
    },
    {
      icon: BarChart3,
      title: "Portfolio Optimization",
      description: "Automatically balanced portfolios tailored to your investment goals"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Intelligent risk assessment and portfolio protection strategies"
    }
  ];

  const benefits = [
    "Personalized investment recommendations",
    "Real-time portfolio monitoring",
    "AI-powered chat support",
    "ESG and geographic preferences",
    "3-year historical performance tracking"
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative min-h-[600px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 40, 49, 0.8), rgba(14, 88, 35, 0.6)), url(${heroImage})`
        }}
      >
        <img
          src={heroImage}
          alt=""
          className="hidden"
          loading="eager"
          decoding="async"
        />
        <div className="container px-4 text-center text-white w-full max-w-full">
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl break-words">
            AI-Powered
            <br />
            <span className="text-primary-foreground">Portfolio Advisor</span>
          </h1>
          <p className="mb-8 text-xl text-gray-200 max-w-2xl mx-auto">
            Get personalized investment recommendations powered by advanced AI. 
            Build your wealth with data-driven insights and professional-grade portfolio management.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={handleGetStarted}
            data-testid="button-hero-get-started"
          >
            Start Building Your Portfolio
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover-elevate">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose InvestAI?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <h3 className="text-2xl font-semibold mb-4">Get Started Today</h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of investors who trust InvestAI to manage their portfolios. 
                Start with our quick assessment and get your personalized recommendations.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={handleGetStarted}
                data-testid="button-card-get-started"
              >
                Create Your Portfolio
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}