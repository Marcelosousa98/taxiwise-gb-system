
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AnimatePresence } from "framer-motion";

// Pages
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Maintenance from "./pages/Maintenance";
import Repairs from "./pages/Repairs";
import Finance from "./pages/Finance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AnimatePresence>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
