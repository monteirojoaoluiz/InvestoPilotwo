import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@assets/generated_images/Financial_growth_hero_image_d98a96dd.png";
import { Shield, Brain, BarChart3, CheckCircle } from "lucide-react";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const handleGetStarted = () => {
    console.log("Get Started button clicked");
    onGetStarted?.();
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Advanced algorithms analyze your risk profile and market conditions",
    },
    {
      icon: BarChart3,
      title: "Portfolio Optimization",
      description:
        "Automatically balanced portfolios tailored to your investment goals",
    },
    {
      icon: Shield,
      title: "Risk Management",
      description:
        "Intelligent risk assessment and portfolio protection strategies",
    },
  ];

  const benefits = [
    "Personalized investment recommendations",
    "Real-time portfolio monitoring",
    "AI-powered chat support",
    "ESG and geographic preferences",
    "3-year historical performance tracking",
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative flex min-h-[600px] items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 40, 49, 0.8), rgba(14, 88, 35, 0.6)), url(${heroImage})`,
        }}
      >
        <img
          src={heroImage}
          alt=""
          className="hidden"
          loading="eager"
          decoding="async"
        />
        <div className="container mx-auto w-full px-4 text-center text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-6 break-words text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Stack 16
              <br />
              <span className="text-primary-foreground">
                Automate tomorrow.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-gray-200 sm:text-xl">
              Get personalized investment recommendations powered by advanced
              AI. Build your wealth with data-driven insights and
              professional-grade portfolio management.
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                className="min-h-[60px] touch-manipulation px-8 py-6 text-lg"
                onClick={handleGetStarted}
                data-testid="button-hero-get-started"
              >
                Start Building Your Portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold">Why Choose Stack16?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <h3 className="mb-4 text-2xl font-semibold">Get Started Today</h3>
              <p className="mb-6 text-muted-foreground">
                Join thousands of investors who trust Stack16 to manage their
                portfolios. Start with our quick assessment and get your
                personalized recommendations.
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
