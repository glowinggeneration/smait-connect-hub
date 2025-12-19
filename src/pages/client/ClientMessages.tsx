import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderType: "admin" | "client";
  content: string;
  timestamp: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "SMAIT Team",
    senderType: "admin",
    content: "Hi! Welcome to your project dashboard. How can we help you today?",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    sender: "You",
    senderType: "client",
    content: "Hi, I wanted to check on the progress of the homepage redesign.",
    timestamp: "10:35 AM",
  },
  {
    id: "3",
    sender: "SMAIT Team",
    senderType: "admin",
    content: "The homepage is coming along great! We've completed the hero section and navigation. Would you like to see a preview?",
    timestamp: "10:40 AM",
  },
  {
    id: "4",
    sender: "You",
    senderType: "client",
    content: "Yes, that would be great! Please share when ready.",
    timestamp: "10:45 AM",
  },
  {
    id: "5",
    sender: "SMAIT Team",
    senderType: "admin",
    content: "I've uploaded the preview to your documents section. You can access it from the Documents page. Let me know your thoughts!",
    timestamp: "11:00 AM",
  },
];

const ClientMessages = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: "You",
      senderType: "client",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <DashboardLayout userType="client">
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  SM
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">SMAIT Digital Team</h2>
                <p className="text-sm text-muted-foreground">
                  Usually responds within a few hours
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderType === "client" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.senderType === "client"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderType === "client"
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
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientMessages;
