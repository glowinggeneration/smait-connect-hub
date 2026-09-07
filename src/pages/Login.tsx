import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BorderBeam } from "@/components/ui/border-beam";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Divider } from "@/components/ui/divider";
import marsBackground from "@/assets/mars-background.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleResetRequest = async () => {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent. Check your email.");
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error(errorMessage || "Could not send reset link");
    } finally {
      setIsResetting(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Check user role and redirect
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (roleData?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/client");
      }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error(errorMessage || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background with institutional overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${marsBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Floating particle field */}
      <FloatingParticles count={80} opacity={0.7} />

      {/* Login Panel */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="relative bg-card border border-border rounded-lg p-8 shadow-sm">
          <BorderBeam size={18} duration={10} borderWidth={1} />
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              System Access
            </p>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Authentication Required
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Identifier
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:ring-0 rounded-md text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Credential
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:ring-0 rounded-md text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <ShinyButton
              type="submit"
              className="mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating
                </>
              ) : (
                "Authenticate"
              )}
            </ShinyButton>
          </form>

          {/* Footer */}
          <div className="mt-6">
            <Divider label="Credential recovery" className="mb-4" />
            <button
              type="button"
              onClick={handleResetRequest}
              disabled={isResetting}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center disabled:opacity-60"
            >
              {isResetting ? "Sending reset link..." : "Request credential reset"}
            </button>
          </div>

        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Access restricted to authorized personnel.{" "}
          <a
            href="https://smait.co.za/"
            className="text-foreground hover:underline transition-colors"
          >
            Request access
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
