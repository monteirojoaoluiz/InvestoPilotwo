import { Button } from "@/components/ui/button";
import { TrendingUp, Menu } from "lucide-react";

interface HeaderProps {
  onSignInClick?: () => void;
  onGetStartedClick?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Header({ onSignInClick, onGetStartedClick, onMenuClick, showMenuButton = false }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showMenuButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              data-testid="button-menu-toggle"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">Stack16</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={onSignInClick}
            data-testid="button-auth"
          >
            Sign In
          </Button>
          <Button
            onClick={onGetStartedClick}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}