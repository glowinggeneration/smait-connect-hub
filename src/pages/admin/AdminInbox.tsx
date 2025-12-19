import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Mail, 
  MailOpen, 
  Star, 
  StarOff, 
  Trash2, 
  Archive,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InboxItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  type: "notification" | "message" | "alert";
  category: "inbox" | "archived";
}

const initialInbox: InboxItem[] = [
  {
    id: "1",
    from: "John Smith",
    fromEmail: "john@techcorp.com",
    subject: "Project Update Required",
    preview: "Hi, I wanted to check on the progress of the e-commerce platform redesign. Can we schedule a call to discuss the timeline?",
    timestamp: "10:30 AM",
    isRead: false,
    isStarred: true,
    type: "message",
    category: "inbox",
  },
  {
    id: "2",
    from: "System",
    fromEmail: "system@smait.com",
    subject: "New Client Registration",
    preview: "A new client 'StartupX' has been registered in the system. Please review their details and assign a project manager.",
    timestamp: "9:15 AM",
    isRead: false,
    isStarred: false,
    type: "notification",
    category: "inbox",
  },
  {
    id: "3",
    from: "Sarah Johnson",
    fromEmail: "sarah@financehub.com",
    subject: "Feedback on Deliverables",
    preview: "Thank you for the latest designs. I have a few suggestions regarding the color scheme and typography. Please find my detailed feedback attached.",
    timestamp: "Yesterday",
    isRead: true,
    isStarred: false,
    type: "message",
    category: "inbox",
  },
  {
    id: "4",
    from: "Alert",
    fromEmail: "alerts@smait.com",
    subject: "Project Deadline Approaching",
    preview: "The Mobile Banking App project has a deadline in 3 days. Current progress is at 90%. Please ensure all deliverables are ready.",
    timestamp: "Yesterday",
    isRead: true,
    isStarred: true,
    type: "alert",
    category: "inbox",
  },
  {
    id: "5",
    from: "Mike Brown",
    fromEmail: "mike@startupx.io",
    subject: "Contract Renewal Discussion",
    preview: "Our current contract is expiring next month. I'd like to discuss renewal terms and potentially expand our partnership.",
    timestamp: "2 days ago",
    isRead: true,
    isStarred: false,
    type: "message",
    category: "inbox",
  },
];

const AdminInbox = () => {
  const [inbox, setInbox] = useState<InboxItem[]>(initialInbox);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const filteredInbox = inbox.filter(
    (item) =>
      item.category === "inbox" &&
      (item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.from.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const unreadCount = inbox.filter((i) => !i.isRead && i.category === "inbox").length;
  const starredCount = inbox.filter((i) => i.isStarred && i.category === "inbox").length;

  const handleSelectItem = (item: InboxItem) => {
    setSelectedItem(item);
    if (!item.isRead) {
      setInbox(inbox.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInbox(inbox.map((i) => (i.id === id ? { ...i, isStarred: !i.isStarred } : i)));
  };

  const archiveItem = (id: string) => {
    setInbox(inbox.map((i) => (i.id === id ? { ...i, category: "archived" } : i)));
    setSelectedItem(null);
    toast({
      title: "Archived",
      description: "Message moved to archive.",
    });
  };

  const deleteItem = (id: string) => {
    setInbox(inbox.filter((i) => i.id !== id));
    setSelectedItem(null);
    toast({
      title: "Deleted",
      description: "Message has been deleted.",
    });
  };

  const getTypeIcon = (type: InboxItem["type"]) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "notification":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return null;
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

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">
              Manage your notifications and messages
            </p>
          </div>

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
                <p className="text-2xl font-bold">{filteredInbox.length}</p>
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
                {filteredInbox.length > 0 ? (
                  filteredInbox.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedItem?.id === item.id ? "bg-muted/50" : ""
                      } ${!item.isRead ? "bg-primary/5" : ""}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`text-xs ${!item.isRead ? "bg-primary/10 text-primary" : ""}`}>
                            {getInitials(item.from)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!item.isRead ? "font-semibold" : ""}`}>
                              {item.from}
                            </span>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(item.type)}
                              <button onClick={(e) => toggleStar(item.id, e)}>
                                {item.isStarred ? (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                ) : (
                                  <StarOff className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm truncate ${!item.isRead ? "font-medium" : "text-muted-foreground"}`}>
                            {item.subject}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {item.preview}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-1">No messages</h3>
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
                          {getInitials(selectedItem.from)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedItem.from}</h3>
                        <p className="text-sm text-muted-foreground">{selectedItem.fromEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => archiveItem(selectedItem.id)}>
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem(selectedItem.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold">{selectedItem.subject}</h2>
                    {selectedItem.type !== "message" && (
                      <Badge variant={selectedItem.type === "alert" ? "destructive" : "secondary"}>
                        {selectedItem.type}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Clock className="w-4 h-4" />
                    {selectedItem.timestamp}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedItem.preview}
                  </p>
                </div>
                <div className="p-4 border-t">
                  <Button variant="gradient" className="w-full">
                    Reply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MailOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">Select a message</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a message from the list to read
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminInbox;