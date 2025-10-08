import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import lightLogo from '@assets/generated_images/Dark Favicon.png';
import darkLogo from '@assets/generated_images/White Favicon.png';

interface HeaderProps {
  onSignInClick?: () => void;
  onGetStartedClick?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Header({
  onSignInClick,
  onGetStartedClick,
  onMenuClick,
  showMenuButton = false,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const updateTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      console.log('Theme changed, isDark:', isDarkMode);
      setIsDark(isDarkMode);
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <img
              src={isDark ? darkLogo : lightLogo}
              alt="Stack16 Logo"
              className="h-8 w-8 rounded-lg"
              key={isDark ? 'dark' : 'light'}
            />
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
          <Button onClick={onGetStartedClick} data-testid="button-get-started">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
