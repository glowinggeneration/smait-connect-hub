import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Mail, Phone, Building, Edit, Trash2, Key, Eye, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

const clientSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      // Get all profiles that have client role
      const { data: clientRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');

      if (rolesError) throw rolesError;

      if (clientRoles && clientRoles.length > 0) {
        const userIds = clientRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;
        setClients(profiles || []);
      } else {
        setClients([]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClient = async () => {
    setErrors({});
    
    try {
      const validatedData = clientSchema.parse(newClient);
      setIsCreating(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create clients.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('create-client', {
        body: validatedData,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create client');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Client Created",
        description: `${validatedData.full_name} has been added successfully.`,
      });
      
      setNewClient({ full_name: "", email: "", password: "", phone: "", company: "" });
      setIsDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error Creating Client",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (client: ClientProfile) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(client.email);
      if (error) throw error;
      
      toast({
        title: "Password Reset",
        description: `A password reset link has been sent to ${client.email}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (client: ClientProfile) => {
    // Note: Actually deleting users requires admin API through edge function
    toast({
      title: "Delete Client",
      description: "Client deletion requires admin confirmation. Feature coming soon.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-muted-foreground">
              Manage client accounts and access
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Create a new client account with login credentials.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="John Smith"
                      value={newClient.full_name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, full_name: e.target.value })
                      }
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">{errors.full_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newClient.password}
                      onChange={(e) =>
                        setNewClient({ ...newClient, password: e.target.value })
                      }
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 890"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Company Name"
                      value={newClient.company}
                      onChange={(e) =>
                        setNewClient({ ...newClient, company: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="gradient" 
                    onClick={handleCreateClient}
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create Client"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">
                {clients.length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">0</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No clients yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? "No clients match your search" : "Add your first client to get started"}
                </p>
                {!searchQuery && (
                  <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/client/${client.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={client.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(client.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.company ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            {client.company}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-500">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/client/${client.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(client)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClient(client)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminClients;