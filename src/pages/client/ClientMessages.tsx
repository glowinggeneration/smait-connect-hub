import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name?: string;
  is_mine: boolean;
}

const ClientMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get first admin to chat with
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminRole) {
        setAdminId(adminRole.user_id);
        await fetchMessages(user.id, adminRole.user_id);
        
        // Mark unread messages as read
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("receiver_id", user.id)
          .eq("sender_id", adminRole.user_id)
          .eq("read", false);

        // Subscribe to realtime messages
        const channel = supabase
          .channel("client-messages")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `receiver_id=eq.${user.id}`,
            },
            async (payload) => {
              const newMsg = payload.new as any;
              // Get sender name
              const { data: senderProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", newMsg.sender_id)
                .single();

              setMessages((prev) => [
                ...prev,
                {
                  ...newMsg,
                  sender_name: senderProfile?.full_name || "Admin",
                  is_mine: false,
                },
              ]);

              // Mark as read
              await supabase
                .from("messages")
                .update({ read: true })
                .eq("id", newMsg.id);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string, adminUserId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${adminUserId}),and(sender_id.eq.${adminUserId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Get sender names
    const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", senderIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]));

    const messagesWithNames =
      data?.map((m) => ({
        ...m,
        sender_name: profileMap.get(m.sender_id) || "Unknown",
        is_mine: m.sender_id === userId,
      })) || [];

    setMessages(messagesWithNames);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !adminId || !currentUserId) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: adminId,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          ...data,
          sender_name: "You",
          is_mine: true,
        },
      ]);
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="client">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.is_mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.is_mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.is_mine
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(message.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
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
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                disabled={sending}
              />
              <Button
                variant="gradient"
                size="icon"
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientMessages;