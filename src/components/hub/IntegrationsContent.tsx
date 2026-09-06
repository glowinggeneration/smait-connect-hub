import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { Video, Calendar, Link2, CheckCircle2, XCircle, Settings2, ExternalLink, Copy, Loader2 } from "lucide-react";

interface Integration {
  id: string;
  provider: string;
  enabled: boolean;
  calendar_id?: string;
  token_expires_at?: string;
}

const PROVIDERS = {
  google: {
    name: "Google",
    description: "Connect Google Meet for video calls and Google Calendar for scheduling",
    icon: "🔵",
    features: ["Google Meet video calls", "Google Calendar sync", "Automatic meeting creation"],
    color: "bg-blue-500/10 border-blue-500/20",
  },
  zoom: {
    name: "Zoom",
    description: "Connect Zoom for video conferencing",
    icon: "🟦",
    features: ["Zoom video meetings", "Meeting recordings", "Waiting rooms"],
    color: "bg-sky-500/10 border-sky-500/20",
  },
  microsoft: {
    name: "Microsoft Teams",
    description: "Connect Microsoft Teams for video calls and Outlook Calendar",
    icon: "🟣",
    features: ["Teams video calls", "Outlook Calendar sync", "Channel meetings"],
    color: "bg-purple-500/10 border-purple-500/20",
  },
};

const IntegrationsContent = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);

  const [oauthConfig, setOauthConfig] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: window.location.origin + "/admin/integrations/callback",
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegration = (provider: string) => {
    return integrations.find((i) => i.provider === provider);
  };

  const handleConnect = (provider: string) => {
    setSelectedProvider(provider);
    setConfigDialogOpen(true);
  };

  const handleDisconnect = async (provider: string) => {
    try {
      const integration = getIntegration(provider);
      if (!integration) return;

      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", integration.id);

      if (error) throw error;

      setIntegrations(integrations.filter((i) => i.provider !== provider));
      toast.success(`${PROVIDERS[provider as keyof typeof PROVIDERS].name} disconnected`);
    } catch (error: any) {
      toast.error("Failed to disconnect: " + error.message);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedProvider) return;
    setConfiguring(true);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("integrations")
        .upsert({
          user_id: user.id,
          provider: selectedProvider,
          enabled: true,
          calendar_id: oauthConfig.clientId ? "primary" : null,
        })
        .select()
        .single();

      if (error) throw error;

      setIntegrations([...integrations.filter((i) => i.provider !== selectedProvider), data]);
      toast.success(`${PROVIDERS[selectedProvider as keyof typeof PROVIDERS].name} configured successfully`);
      setConfigDialogOpen(false);
      setOauthConfig({ clientId: "", clientSecret: "", redirectUri: window.location.origin + "/admin/integrations/callback" });
    } catch (error: any) {
      toast.error("Failed to configure: " + error.message);
    } finally {
      setConfiguring(false);
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(oauthConfig.redirectUri);
    toast.success("Redirect URI copied to clipboard");
  };

  const getOAuthInstructions = (provider: string) => {
    switch (provider) {
      case "google":
        return {
          title: "Google Cloud Console Setup",
          steps: [
            "Go to Google Cloud Console (console.cloud.google.com)",
            "Create a new project or select existing",
            "Enable Google Calendar API and Google Meet API",
            "Go to Credentials → Create OAuth 2.0 Client ID",
            "Add the redirect URI shown below",
            "Copy Client ID and Client Secret",
          ],
          docsUrl: "https://developers.google.com/calendar/api/quickstart/js",
        };
      case "zoom":
        return {
          title: "Zoom Marketplace Setup",
          steps: [
            "Go to Zoom Marketplace (marketplace.zoom.us)",
            "Click 'Develop' → 'Build App'",
            "Choose OAuth app type",
            "Add the redirect URI shown below",
            "Copy Client ID and Client Secret",
            "Add required scopes: meeting:write, meeting:read",
          ],
          docsUrl: "https://developers.zoom.us/docs/integrations/oauth/",
        };
      case "microsoft":
        return {
          title: "Azure Active Directory Setup",
          steps: [
            "Go to Azure Portal (portal.azure.com)",
            "Navigate to Azure Active Directory → App registrations",
            "Create new registration",
            "Add the redirect URI shown below",
            "Create a client secret in Certificates & secrets",
            "Add API permissions for Microsoft Graph (Calendars.ReadWrite)",
          ],
          docsUrl: "https://learn.microsoft.com/en-us/graph/auth-v2-user",
        };
      default:
        return { title: "", steps: [], docsUrl: "" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Connect video conferencing and calendar services
      </p>

      <Tabs defaultValue="video" className="space-y-4">
        <TabsList>
          <TabsTrigger value="video" className="gap-2">
            <Video className="w-4 h-4" />
            Video Conferencing
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Calendars
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PROVIDERS).map(([key, provider]) => {
              const integration = getIntegration(key);
              const isConnected = !!integration?.enabled;

              return (
                <Card key={key} className={`${provider.color} border`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <Badge variant={isConnected ? "default" : "secondary"} className="mt-1">
                            {isConnected ? (
                              <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> Not Connected</>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {provider.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="text-primary">•</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      {isConnected ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleConnect(key)}>
                            <Settings2 className="w-4 h-4 mr-1" />
                            Configure
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDisconnect(key)}>
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => handleConnect(key)}>
                          <Link2 className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Sync</CardTitle>
              <CardDescription>
                Meetings scheduled in this app will automatically sync to your connected calendars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {["google", "microsoft"].map((provider) => {
                  const integration = getIntegration(provider);
                  const isConnected = !!integration?.enabled;
                  const providerInfo = PROVIDERS[provider as keyof typeof PROVIDERS];

                  return (
                    <div
                      key={provider}
                      className={`p-4 rounded-lg border ${isConnected ? "bg-primary/5 border-primary/20" : "bg-muted/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{providerInfo.icon}</span>
                          <span className="font-medium">
                            {provider === "google" ? "Google Calendar" : "Outlook Calendar"}
                          </span>
                        </div>
                        <Switch
                          checked={isConnected}
                          onCheckedChange={() => isConnected ? handleDisconnect(provider) : handleConnect(provider)}
                        />
                      </div>
                      {isConnected && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Syncing to primary calendar
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Connect {selectedProvider && PROVIDERS[selectedProvider as keyof typeof PROVIDERS]?.name}
            </DialogTitle>
            <DialogDescription>
              Follow the steps below to set up OAuth authentication
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">
                  {getOAuthInstructions(selectedProvider).title}
                </h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  {getOAuthInstructions(selectedProvider).steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                  <a
                    href={getOAuthInstructions(selectedProvider).docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View documentation <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Redirect URI (add this to your app)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={oauthConfig.redirectUri}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button variant="outline" size="icon" onClick={copyRedirectUri}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={oauthConfig.clientId}
                    onChange={(e) => setOauthConfig({ ...oauthConfig, clientId: e.target.value })}
                    placeholder="Enter your OAuth Client ID"
                  />
                </div>

                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={oauthConfig.clientSecret}
                    onChange={(e) => setOauthConfig({ ...oauthConfig, clientSecret: e.target.value })}
                    placeholder="Enter your OAuth Client Secret"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={configuring || !oauthConfig.clientId}>
              {configuring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsContent;
