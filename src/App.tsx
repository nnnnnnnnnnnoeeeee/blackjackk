import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TranslationProvider } from "@/ui/blackjack/i18n";
import { Loader2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Route-level code splitting: each page ships in its own chunk and is fetched
// on demand, so visiting /login no longer downloads the heavy Game/Table pages.
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ModeSelection = lazy(() => import("./pages/ModeSelection"));
const Game = lazy(() => import("./pages/Game"));
const Lobby = lazy(() => import("./pages/Lobby"));
const MultiplayerTable = lazy(() => import("./pages/MultiplayerTable"));
const PokerLobby = lazy(() => import("./pages/PokerLobby"));
const PokerTable = lazy(() => import("./pages/PokerTable"));
const PokerSolo = lazy(() => import("./pages/PokerSolo"));
const UxPreview = lazy(() => import("./pages/UxPreview"));

const queryClient = new QueryClient();

// Full-screen fallback shown while a route chunk loads.
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#062114]">
    <Loader2 className="h-10 w-10 animate-spin text-[#d4af37]" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TranslationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/mode-selection" element={<ModeSelection />} />
              <Route path="/game" element={<Game />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/table/:id" element={<MultiplayerTable />} />
              <Route path="/poker/lobby" element={<PokerLobby />} />
              <Route path="/poker/solo" element={<PokerSolo />} />
              <Route path="/poker/table/:id" element={<PokerTable />} />
              <Route path="/ux-preview" element={<UxPreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </TranslationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
