import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Paperclip, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderType: "admin" | "client";
  content: string;
  timestamp: string;
  projectName?: string;
}

interface Conversation {
  id: string;
  clientName: string;
  company: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  projectName: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    clientName: "John Smith",
    company: "TechCorp Ltd",
    lastMessage: "Thanks for the update! Looking forward to the next milestone.",
    timestamp: "10 min ago",
    unread: 2,
    projectName: "E-commerce Platform",
  },
  {
    id: "2",
    clientName: "Sarah Johnson",
    company: "FinanceHub",
    lastMessage: "Can we schedule a call to discuss the revisions?",
    timestamp: "1 hour ago",
    unread: 0,
    projectName: "Mobile Banking App",
  },
  {
    id: "3",
    clientName: "Mike Brown",
    company: "StartupX",
    lastMessage: "The brand colors look great!",
    timestamp: "Yesterday",
    unread: 0,
    projectName: "Brand Identity",
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "John Smith",
    senderType: "client",
    content: "Hi, I wanted to check on the progress of the homepage redesign.",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    sender: "Admin",
    senderType: "admin",
    content: "Hi John! The homepage is coming along great. We've completed the hero section and navigation. Would you like to see a preview?",
    timestamp: "10:35 AM",
  },
  {
    id: "3",
    sender: "John Smith",
    senderType: "client",
    content: "Yes, that would be great! Please share when ready.",
    timestamp: "10:40 AM",
  },
  {
    id: "4",
    sender: "Admin",
    senderType: "admin",
    content: "I've uploaded the preview to the project documents. You can access it from your dashboard.",
    timestamp: "11:00 AM",
  },
  {
    id: "5",
    sender: "John Smith",
    senderType: "client",
    content: "Thanks for the update! Looking forward to the next milestone.",
    timestamp: "11:15 AM",
  },
];

const AdminMessages = () => {
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    mockConversations[0]
  );
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: "Admin",
      senderType: "admin",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <DashboardLayout userType="admin">
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b ${
                      selectedConversation?.id === conv.id ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.clientName}</p>
                          <span className="text-xs text-muted-foreground">
                            {conv.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-primary truncate">{conv.projectName}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="ml-2">{conv.unread}</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedConversation.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedConversation.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.company} • {selectedConversation.projectName}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderType === "admin" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              message.senderType === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderType === "admin"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button variant="gradient" size="icon" onClick={handleSendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminMessages;
