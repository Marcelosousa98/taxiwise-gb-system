
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Car, Wrench, Receipt, BarChart3, Menu, X
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}

const SidebarLink = ({ to, icon: Icon, label, end }: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
        "hover:bg-primary/10 hover:text-primary",
        isActive ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: isMobile ? "-100%" : 0, opacity: isMobile ? 0 : 1 }
  };

  const mainContentVariants = {
    wide: { marginLeft: isMobile ? 0 : 0 },
    narrow: { marginLeft: isMobile ? 0 : "260px" }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu toggle */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-elevated"
        >
          {sidebarOpen ? 
            <X className="h-5 w-5 text-primary" /> : 
            <Menu className="h-5 w-5 text-primary" />
          }
        </button>
      )}
      
      {/* Backdrop for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial={isMobile ? "closed" : "open"}
        animate={sidebarOpen ? "open" : "closed"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar w-60 p-4 flex flex-col z-40",
          "border-r border-sidebar-border shadow-subtle"
        )}
      >
        <div className="flex items-center justify-center py-6">
          <h1 className="text-xl font-display font-semibold text-primary">TaxiWise</h1>
        </div>
        
        <nav className="flex-1 space-y-1 pt-4">
          <SidebarLink to="/" icon={BarChart3} label="Dashboard" end />
          <SidebarLink to="/drivers" icon={Users} label="Motoristas" />
          <SidebarLink to="/vehicles" icon={Car} label="Veículos" />
          <SidebarLink to="/maintenance" icon={Wrench} label="Manutenção" />
          <SidebarLink to="/repairs" icon={Receipt} label="Reparações" />
          <SidebarLink to="/finance" icon={BarChart3} label="Finanças" />
        </nav>
        
        <div className="pt-6 pb-4 border-t border-sidebar-border mt-6">
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">© 2023 TaxiWise</p>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <motion.main
        variants={mainContentVariants}
        initial={isMobile ? "wide" : "narrow"}
        animate={sidebarOpen && !isMobile ? "narrow" : "wide"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "flex-1 min-h-screen",
          "transition-all duration-300 ease-in-out",
          isMobile ? "ml-0" : sidebarOpen ? "ml-60" : "ml-0"
        )}
      >
        <div className="container max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </div>
      </motion.main>
    </div>
  );
};
