import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Search,
  BarChart3,
  Shield,
  Brain,
  User,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Database,
  Layers,
  Cpu,
  Globe,
} from "lucide-react";

/* ---------------------------------------------------
   Floating + Glow Elements (soft lavender theme)
--------------------------------------------------- */
const FloatingElement = ({ className, children, delay = 0 }) => (
  <div
    className={`absolute ${className} animate-float opacity-70`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: "6s",
    }}
  >
    {children}
  </div>
);

const GlowOrb = ({ className, delay = 0 }) => (
  <div
    className={`absolute rounded-full ${className} blur-3xl opacity-40 animate-pulse`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: "4s",
    }}
  />
);

/* ---------------------------------------------------
   Feature Cards – now violet gradient theme
--------------------------------------------------- */
const FeatureCard = ({ icon: Icon, title, description, gradient }) => (
  <Card className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border border-[#d3c4ff] hover:border-[#b8a5ff] transition-all duration-500 hover:scale-[1.02] rounded-2xl shadow-sm">
    <div className="absolute inset-0 bg-gradient-to-br from-[#ebe3ff] to-[#f3eaff] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

    <CardContent className="relative p-8">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${
              gradient || "from-[#7d5ff3] to-[#6b4de0]"
            } group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-300`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-[#321c82] mb-3">{title}</h3>
          <p className="text-[#5e4bb8] text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ---------------------------------------------------
   Login Modal – fully purple themed
--------------------------------------------------- */
const LoginForm = ({
  username,
  setUsername,
  password,
  setPassword,
  loginError,
  loginSuccess,
  isLoading,
  handleLogin,
  setShowLogin,
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center p-4 z-50">
    <Card className="w-full max-w-lg bg-white/80 backdrop-blur-xl shadow-2xl border border-[#d6c8ff] rounded-2xl overflow-hidden">
      <CardHeader className="relative text-center pb-6 px-10 pt-10">
        <div className="relative mb-6 mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7e5bf8] to-[#4927a9] shadow-purple-300 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>

        <CardTitle className="text-3xl font-bold text-[#321c82] mb-2">
          Welcome Back
        </CardTitle>
        <p className="text-[#6e59c6]">Access your NLP analytics dashboard</p>
      </CardHeader>

      <CardContent className="relative px-10 pb-10">
        <div className="space-y-6">
          {/* Username */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#5b48b3] flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="h-14 text-lg bg-white border-[#d3c4ff] focus:border-[#8b6df6] focus:ring-[#8b6df6]/20 text-[#3a2a84] rounded-xl"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#5b48b3] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-14 text-lg bg-white border-[#d3c4ff] focus:border-[#8b6df6] focus:ring-[#8b6df6]/20 text-[#3a2a84] rounded-xl"
              disabled={isLoading}
            />
          </div>

          {/* Errors / Success */}
          {loginError && (
            <div className="flex items-center gap-3 p-4 bg-red-100 border border-red-300 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-600">{loginError}</span>
            </div>
          )}

          {loginSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-100 border border-green-300 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">
                Authentication successful! Redirecting...
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogin(false)}
              className="flex-1 h-14 border-[#c5b6ff] text-[#5b48b3] hover:bg-[#efe8ff] rounded-xl"
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleLogin}
              className="flex-1 h-14 bg-gradient-to-r from-[#6e4de9] to-[#4927a9] hover:opacity-90 text-white shadow-md rounded-xl"
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

/* ---------------------------------------------------
   Main Landing Page (Light Purple Theme)
--------------------------------------------------- */
const LandingPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const DEMO_CREDENTIALS = {
    username: "ayan",
    password: "Password@123",
  };

  /* Animations */
  useEffect(() => {
    setIsVisible(true);
  }, []);

  /* Login handler */
  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setLoginError("");

    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (
      username.trim() === DEMO_CREDENTIALS.username &&
      password.trim() === DEMO_CREDENTIALS.password
    ) {
      setLoginSuccess(true);
      setTimeout(() => {
        window.location.href = "/map";
      }, 2000);
    } else {
      setLoginError("Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  }, [username, password]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#c3aaf0] via-white to-[#ac80fd]">
      {/* Soft glowing orbs */}
      <GlowOrb className="top-20 left-20 w-96 h-96 bg-[#bca6ff]" />
      <GlowOrb className="top-60 right-10 w-80 h-80 bg-[#d8c9ff]" delay={1} />
      <GlowOrb className="bottom-40 left-10 w-72 h-72 bg-[#cbb5ff]" delay={2} />

      {/* Floating shapes */}
      <FloatingElement className="top-32 right-1/4 w-6 h-6 bg-[#b59aff]/40 rounded-full" />
      <FloatingElement
        className="top-1/2 left-20 w-4 h-4 bg-[#d5c7ff]/50 rounded-full"
        delay={1.2}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-8">
          <nav className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="w-10 h-10 text-[#6d4ce3]" />
              <div>
                <span className="text-2xl font-black text-[#321c82]">
                  NLP Engine
                </span>
                <br />
                <span className="text-xs text-[#7b63d9]">
                  Advanced Analytics Platform
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowLogin(true)}
              className="border-[#c5b6ff] text-[#4927a9] hover:bg-[#efe8ff] backdrop-blur-sm px-6 py-2 rounded-xl"
            >
              <User className="w-4 h-4 mr-2" />
              Access Dashboard
            </Button>
          </nav>
        </header>

        {/* HERO SECTION */}
        <main className="flex-1 flex items-center justify-center px-8">
          <div
            className={`max-w-7xl mx-auto transition-all duration-1000 ${
              isVisible ? "opacity-100" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center mb-20">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 border border-[#d6c8ff] text-[#4927a9] text-sm font-semibold mb-8">
                <Sparkles className="w-5 h-5 text-[#a07bff]" />
                Next-Generation AI Analytics
              </div>

              {/* Heading */}
              <h1 className="text-7xl md:text-8xl font-black text-[#321c82] leading-tight mb-8">
                <span className="bg-gradient-to-r from-[#7d60ff] via-[#a992ff] to-[#7d60ff] text-transparent bg-clip-text">
                  Natural Language
                </span>
                <br />
                <span>Data Intelligence</span>
              </h1>

              <p className="text-xl text-[#5e4bb8] max-w-3xl mx-auto mb-12">
                Transform complex database interactions into intuitive
                conversations. Our AI-powered platform turns natural language
                into instant insights.
              </p>

              <Button
                onClick={() => setShowLogin(true)}
                className="h-16 px-12 text-xl bg-gradient-to-r from-[#6e4de9] to-[#4927a9] hover:opacity-90 text-white shadow-xl rounded-2xl"
              >
                <Database className="w-6 h-6 mr-3" />
                Launch Analytics Platform
              </Button>
            </div>

            {/* FEATURE GRID */}
            <div className="grid lg:grid-cols-3 gap-8 mb-20">
              <FeatureCard
                icon={Search}
                title="Natural Query Understanding"
                gradient="from-[#8567f7] to-[#6e4de9]"
                description="Converts natural language into optimized SQL queries with contextual interpretation."
              />

              <FeatureCard
                icon={BarChart3}
                title="Instant Data Visualization"
                gradient="from-[#a38bff] to-[#7d60ff]"
                description="Generates charts and dashboards instantly based on your queries."
              />

              <FeatureCard
                icon={Shield}
                title="Enterprise Security"
                gradient="from-[#9677ff] to-[#5630d0]"
                description="Role-based access, encryption, and enterprise-grade security architecture."
              />
            </div>

            {/* Value Section */}
            <div className="text-center border-t border-[#d6c8ff] pt-16">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <Globe className="w-12 h-12 text-[#6d4ce3] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#321c82]">
                    Global Scale
                  </h3>
                  <p className="text-[#5e4bb8] text-sm mt-2">
                    Multi-region deployment with enterprise reliability.
                  </p>
                </div>

                <div>
                  <Layers className="w-12 h-12 text-[#8b6df6] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#321c82]">
                    Universal Integration
                  </h3>
                  <p className="text-[#5e4bb8] text-sm mt-2">
                    Works with any database or analytics system.
                  </p>
                </div>

                <div>
                  <Cpu className="w-12 h-12 text-[#9677ff] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#321c82]">
                    AI Optimized
                  </h3>
                  <p className="text-[#5e4bb8] text-sm mt-2">
                    Learns and improves with usage patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="p-8 text-center border-t border-[#d6c8ff]">
          <p className="text-[#6e5abf] text-sm">
            © {new Date().getFullYear()} AP Analytics Platform. Powered by NLP
            Intelligence.
          </p>
        </footer>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <LoginForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          loginError={loginError}
          loginSuccess={loginSuccess}
          isLoading={isLoading}
          handleLogin={handleLogin}
          setShowLogin={setShowLogin}
        />
      )}
    </div>
  );
};

export default LandingPage;
