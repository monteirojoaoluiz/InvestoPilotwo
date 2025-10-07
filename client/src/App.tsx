import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query"; // Add useQuery
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button"; // Add Button import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Clock, Heart, MapPin, Target, LogOut, Download, Trash2 } from "lucide-react";
import stack16Logo from "@assets/generated_images/White Favicon.png";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { apiRequest } from "./lib/queryClient";

// Components
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import AppSidebar from "./components/AppSidebar";
import RiskAssessment from "./components/RiskAssessment";
import PortfolioChat from "./components/PortfolioChat";
import ErrorBoundary from "./components/ErrorBoundary";
import ResetPassword from "./pages/reset-password";

// New pages
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Account from "./pages/Account";
import ETFCatalog from "./pages/etf-catalog";
import AuthModal from "./components/AuthModal";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  const [location, navigate] = useLocation(); // Add useLocation
  const { data: assessment, isLoading: assessmentLoading } = useQuery({ // Add useQuery for assessment
    queryKey: ['assessment'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/risk-assessment');
      if (!res.ok) throw new Error('Failed to fetch assessment');
      const data = await res.json();
      return data;
    },
  });

  useEffect(() => { // Add useEffect for redirect
    if (!assessmentLoading) {
      // Allow access to account page even without assessment
      const allowedPagesWithoutAssessment = ['/account', '/assessment'];

      if (!assessment && !allowedPagesWithoutAssessment.includes(location)) {
        // Only redirect to assessment if user doesn't have assessment and isn't on allowed pages
        navigate('/assessment', { replace: true });
      } else if (assessment && location === '/') {
        // If user has assessment and is at root, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [assessmentLoading, assessment, location, navigate]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed for mobile
  const sidebarToggledByUserRef = useRef(false);
  const [isCompactSidebar, setIsCompactSidebar] = useState(true); // Assume mobile by default

  useEffect(() => {
    const updateCompactState = () => {
      try {
        if (typeof window === 'undefined') return;
        const width = window.innerWidth;
        // Force sidebar closed on mobile (< 768px) and tablet (768-1024px)
        const shouldBeCompact = width < 1024;
        console.log('Screen width:', width, 'Compact sidebar:', shouldBeCompact, 'User agent:', navigator.userAgent);
        setIsCompactSidebar(shouldBeCompact);
      } catch (error) {
        console.error('Error updating compact sidebar state:', error);
      }
    };

    updateCompactState();
    window.addEventListener('resize', updateCompactState);
    return () => window.removeEventListener('resize', updateCompactState);
  }, []);

  useEffect(() => {
    if (isCompactSidebar) {
      sidebarToggledByUserRef.current = false;
      setIsSidebarOpen(false);
    } else if (!sidebarToggledByUserRef.current) {
      setIsSidebarOpen(true);
    }
  }, [isCompactSidebar]);

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    try {
      sidebarToggledByUserRef.current = true;
      setIsSidebarOpen(open);
    } catch (error) {
      console.error('Error changing sidebar state:', error);
    }
  }, []);

  return (
    <SidebarProvider
      style={style}
      open={isSidebarOpen}
      onOpenChange={handleSidebarOpenChange}
    >
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Force sidebar to be hidden on mobile/tablet */}
        <div className={`${isCompactSidebar ? 'hidden' : ''}`}>
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-x-hidden">
          <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full max-w-full">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className={`${isCompactSidebar ? 'block' : 'md:hidden'} mr-2 flex-shrink-0`} />
              <img
                src={stack16Logo}
                alt="Stack16 Logo"
                className="w-8 h-8 rounded-lg flex-shrink-0"
              />
              <span className="font-semibold text-lg truncate">Stack16</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto w-full max-w-full min-h-0">
            <ErrorBoundary>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/assessment" component={Assessment} />
                <Route path="/etf-catalog" component={ETFCatalog} />
                <Route path="/account" component={Account} />
                <Route path="/" component={Dashboard} />
              </Switch>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openLoginModal = () => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    console.log('Opening register modal');
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedRouter />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSignInClick={openLoginModal} onGetStartedClick={openRegisterModal} showMenuButton={false} />
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <LandingPage onGetStarted={openRegisterModal} />
          </Route>
          <Route path="/reset-password" component={ResetPassword} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // Refresh auth state
          window.location.reload();
        }}
        defaultTab={authModalTab}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="investai-ui-theme">
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;