import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/layout";
import { DataProvider } from "@/lib/store";

import Landing from "./pages/landing";
import Browse from "./pages/browse";
import ServiceDetail from "./pages/service-detail";
import ProviderProfile from "./pages/provider-profile";
import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Messages from "./pages/messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <Toaster richColors position="top-center" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Landing />} />
              <Route path="/selaa" element={<Browse />} />
              <Route path="/palvelu/:id" element={<ServiceDetail />} />
              <Route path="/tarjoaja/:id" element={<ProviderProfile />} />
              <Route path="/liity" element={<Onboarding />} />
              <Route path="/kirjaudu" element={<Login />} />
              <Route path="/ohjaamo" element={<Dashboard />} />
              <Route path="/viestit" element={<Messages />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
