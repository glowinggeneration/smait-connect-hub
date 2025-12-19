import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import smaitLogo from "@/assets/smait-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to verify.");
      } else {
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
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left Panel - Dark with gradient effect */}
        <div className="hidden md:flex md:w-1/2 relative bg-secondary overflow-hidden">
          {/* Abstract gradient background */}
          <div className="absolute inset-0">
            {/* Dark base */}
            <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary to-secondary" />
            
            {/* Orange/coral glow from bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-3/4">
              <div className="absolute bottom-0 left-1/4 w-32 h-96 bg-primary/60 blur-3xl transform -translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-24 h-80 bg-primary/40 blur-3xl transform -translate-x-1/2" />
              <div className="absolute bottom-0 right-1/3 w-28 h-72 bg-primary/50 blur-3xl" />
            </div>
            
            {/* Vertical light streaks effect */}
            <div className="absolute bottom-0 left-0 right-0 h-full opacity-30">
              <div className="absolute bottom-0 left-[20%] w-1 h-[60%] bg-gradient-to-t from-primary/80 to-transparent" />
              <div className="absolute bottom-0 left-[30%] w-2 h-[70%] bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-0 left-[40%] w-1 h-[50%] bg-gradient-to-t from-primary/70 to-transparent" />
              <div className="absolute bottom-0 left-[50%] w-3 h-[80%] bg-gradient-to-t from-primary/50 to-transparent" />
              <div className="absolute bottom-0 left-[60%] w-1 h-[55%] bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-0 left-[70%] w-2 h-[45%] bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
          </div>

          {/* Text content */}
          <div className="relative z-10 flex flex-col justify-center p-10">
            <h1 className="text-3xl font-semibold text-white leading-tight">
              Convert your ideas
              <br />
              into successful
              <br />
              business
            </h1>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12 bg-card">
          {/* Logo */}
          <div className="mb-8">
            <img src={smaitLogo} alt="SMAIT Digital" className="h-12 w-auto" />
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? "Get Started!" : "Welcome Back!"}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Create your account to get started with project management."
                : "Sign in to access your dashboard and projects."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-border bg-background focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12 border-border bg-background focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : isSignUp ? "Register" : "Login"}
            </Button>
          </form>

          {/* Toggle sign up / login */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
