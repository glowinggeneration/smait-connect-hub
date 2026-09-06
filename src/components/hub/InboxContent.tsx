import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Mail, 
  MailOpen, 
  Star, 
  StarOff, 
  Trash2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  FileUp,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  user_id: string;
  project_id: string | null;
  action: string;
  action_type: string;
  created_at: string;
  profiles?: { full_name: string; email: string };
  projects?: { name: string };
}

const PAGE_SIZE = 25;

const InboxContent = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Activity | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async (pageIndex = 0) => {
    try {
      if (pageIndex > 0) setLoadingMore(true);
      const from = pageIndex * PAGE_SIZE;
      const { data, error } = await supabase
        .from("activities")
        .select("*, profiles!activities_user_id_fkey(full_name, email), projects(name)")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setPage(pageIndex);
      setActivities((prev) => (pageIndex === 0 ? data || [] : [...prev, ...(data || [])]));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(
    (item) =>
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = activities.filter((a) => !readIds.has(a.id)).length;
  const starredCount = starredIds.size;

  const handleSelectItem = (item: Activity) => {
    setSelectedItem(item);
    setReadIds((prev) => new Set([...prev, item.id]));
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
      
      setActivities(activities.filter((a) => a.id !== id));
      setSelectedItem(null);
      toast({
        title: "Deleted",
        description: "Activity has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "milestone":
        return <Target className="w-4 h-4 text-emerald-500" />;
      case "upload":
        return <FileUp className="w-4 h-4 text-blue-500" />;
      case "create":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "delete":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-muted-foreground">
          View all notifications and activity
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{starredCount}</p>
              <p className="text-xs text-muted-foreground">Starred</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inbox Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((item) => {
                  const isRead = readIds.has(item.id);
                  const isStarred = starredIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedItem?.id === item.id ? "bg-muted/50" : ""
                      } ${!isRead ? "bg-primary/5" : ""}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`text-xs ${!isRead ? "bg-primary/10 text-primary" : ""}`}>
                            {getInitials(item.profiles?.full_name || "SY")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!isRead ? "font-semibold" : ""}`}>
                              {item.profiles?.full_name || "System"}
                            </span>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(item.action_type)}
                              <button onClick={(e) => toggleStar(item.id, e)}>
                                {isStarred ? (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                ) : (
                                  <StarOff className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm truncate ${!isRead ? "font-medium" : "text-muted-foreground"}`}>
                            {item.action}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {item.projects?.name || "General"}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">No activities</h3>
                  <p className="text-sm text-muted-foreground">
                    Your inbox is empty
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2">
          {selectedItem ? (
            <div className="h-[600px] flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedItem.profiles?.full_name || "SY")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedItem.profiles?.full_name || "System"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedItem.profiles?.email || "system@smait.com"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(selectedItem.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold">{selectedItem.action}</h2>
                  <Badge variant="secondary" className="capitalize">
                    {selectedItem.action_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(selectedItem.created_at), { addSuffix: true })}
                </div>
                {selectedItem.projects?.name && (
                  <div className="p-4 rounded-lg bg-muted/50 mb-4">
                    <p className="text-sm text-muted-foreground">Related Project</p>
                    <p className="font-medium">{selectedItem.projects.name}</p>
                  </div>
                )}
                <p className="text-muted-foreground leading-relaxed">
                  This activity was recorded on {new Date(selectedItem.created_at).toLocaleString()}.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MailOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-1">Select an activity</h3>
                <p className="text-sm text-muted-foreground">
                  Choose an item from the list to view details
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default InboxContent;
