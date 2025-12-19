import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Users } from "lucide-react";
import smaitLogo from "@/assets/smait-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "client">("admin");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - will be replaced with actual auth
    setTimeout(() => {
      setIsLoading(false);
      if (activeTab === "admin") {
        navigate("/admin");
      } else {
        navigate("/client");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-sidebar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-smait-teal/10" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-smait-teal/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <img src={smaitLogo} alt="SMAIT Digital" className="w-48 mb-12 animate-fade-in" />
          
          <h1 className="text-4xl font-bold text-sidebar-foreground mb-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            Project Management
            <br />
            <span className="text-gradient">Made Simple</span>
          </h1>
          
          <p className="text-sidebar-foreground/70 text-lg max-w-md animate-fade-in" style={{ animationDelay: "200ms" }}>
            Centralise your projects, streamline communication, and deliver exceptional results with real-time collaboration.
          </p>
          
          <div className="mt-12 space-y-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-3 text-sidebar-foreground/80">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span>Secure role-based access control</span>
            </div>
            <div className="flex items-center gap-3 text-sidebar-foreground/80">
              <div className="w-10 h-10 rounded-lg bg-smait-teal/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-smait-teal" />
              </div>
              <span>Real-time client collaboration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={smaitLogo} alt="SMAIT Digital" className="w-32" />
          </div>

          <Card variant="default" className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "admin" | "client")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="admin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Admin Portal
                  </TabsTrigger>
                  <TabsTrigger value="client" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Client Portal
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@smaitdigital.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          required
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

                    <Button type="submit" variant="gradient" size="lg" className="w-full mt-6" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign in as Admin"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="client">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-email">Email</Label>
                      <Input
                        id="client-email"
                        type="email"
                        placeholder="client@company.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="client-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          required
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

                    <Button type="submit" variant="gradient" size="lg" className="w-full mt-6" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign in as Client"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Contact your administrator if you need access credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
