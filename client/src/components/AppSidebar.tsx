import {
  Home,
  FileText,
  BarChart3,
  Settings,
  User,
  Lock,
  Database,
  PanelLeftIcon,
  PieChart,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    testId: 'link-dashboard',
  },
  {
    title: 'ETF Catalog',
    url: '/etf-catalog',
    icon: Database,
    testId: 'link-etf-catalog',
  },
  {
    title: 'Investor Profile',
    url: '/assessment',
    icon: FileText,
    testId: 'link-assessment',
  },
  {
    title: 'Asset Allocation',
    url: '/allocation',
    icon: PieChart,
    testId: 'link-allocation',
  },
];

const accountItems = [
  {
    title: 'Account',
    url: '/account',
    icon: User,
    testId: 'link-account',
  },
];

// Remove onItemClick and activeItem props
export default function AppSidebar() {
  const [location] = useLocation();
  const { setOpen, setOpenMobile, isMobile, toggleSidebar } = useSidebar();

  const { data: assessment } = useQuery<{ investorProfile: any }>({
    queryKey: ['/api/risk-assessment'],
  });

  const hasAssessment = !!assessment;

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarTrigger className="w-full h-auto p-2 justify-start">
                    <PanelLeftIcon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {isMobile ? 'Close Menu' : 'Toggle Menu'}
                    </span>
                  </SidebarTrigger>
                </SidebarMenuItem>
                {menuItems.map((item) => {
                  const isDashboard = item.url === '/dashboard';
                  const isDisabled = isDashboard && !hasAssessment;

                  if (isDisabled) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              disabled
                              className="opacity-50 cursor-not-allowed"
                            >
                              <div className="w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                                <Lock className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">
                                  {item.title}
                                </span>
                              </div>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Complete your investor profile first</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                      >
                        <Link href={item.url}>
                          <a
                            className="w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
                            data-testid={item.testId}
                            aria-label={item.title}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </a>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url}>
                        <a
                          className="w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
                          data-testid={item.testId}
                          aria-label={item.title}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                        </a>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
