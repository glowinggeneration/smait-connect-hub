import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import marsBackground from "@/assets/mars-background.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden safe-area-top safe-area-bottom">
      {/* Mars space background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${marsBackground})` }}
      />
      {/* Space overlay with stars effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 stars-overlay" />

      {/* Back to home arrow */}
      <a 
        href="https://www.smait.co.za" 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors group touch-target"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
      </a>

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 px-1">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back</h1>
            <div className="w-12 h-1 bg-primary rounded-full mb-4 mx-auto sm:mx-0" />
            <p className="text-white/70 text-sm">
              Sign in to access your portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs uppercase tracking-wider font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 sm:h-13 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary rounded-xl text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-white/60 text-xs uppercase tracking-wider font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 sm:h-13 pl-11 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary rounded-xl text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-13 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-5">
            <button type="button" className="text-sm text-white/50 hover:text-white/70 transition-colors py-2">
              Forgot password?
            </button>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-sm text-white/60 mt-6 px-4">
          Don't have an account?{" "}
          <a
            href="https://www.smait.co.za"
            className="font-semibold text-white hover:underline transition-colors"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
