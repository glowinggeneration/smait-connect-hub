import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Paperclip, MoreVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  is_mine: boolean;
}

interface Conversation {
  client_id: string;
  client_name: string;
  company: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const AdminMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      await fetchConversations(user.id);

      // Subscribe to new messages
      const channel = supabase
        .channel("admin-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          async (payload) => {
            const newMsg = payload.new as any;
            
            // If it's for the current conversation, add it
            if (
              selectedConversation &&
              (newMsg.sender_id === selectedConversation.client_id ||
                newMsg.receiver_id === selectedConversation.client_id)
            ) {
              setMessages((prev) => [
                ...prev,
                {
                  ...newMsg,
                  is_mine: newMsg.sender_id === user.id,
                },
              ]);

              // Mark as read if received
              if (newMsg.receiver_id === user.id) {
                await supabase
                  .from("messages")
                  .update({ read: true })
                  .eq("id", newMsg.id);
              }
            }

            // Refresh conversations to update unread counts
            await fetchConversations(user.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const fetchConversations = async (adminId: string) => {
    // Get all clients with their profiles
    const { data: clientRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "client");

    if (!clientRoles || clientRoles.length === 0) {
      setConversations([]);
      return;
    }

    const clientIds = clientRoles.map((r) => r.user_id);

    // Get profiles for all clients
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, company, avatar_url")
      .in("user_id", clientIds);

    // Get latest message and unread count for each client
    const conversationsData: Conversation[] = [];

    for (const profile of profiles || []) {
      // Get latest message
      const { data: latestMessage } = await supabase
        .from("messages")
        .select("content, created_at")
        .or(
          `and(sender_id.eq.${profile.user_id},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${profile.user_id})`
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", profile.user_id)
        .eq("receiver_id", adminId)
        .eq("read", false);

      conversationsData.push({
        client_id: profile.user_id,
        client_name: profile.full_name,
        company: profile.company,
        avatar_url: profile.avatar_url,
        last_message: latestMessage?.content || "No messages yet",
        last_message_time: latestMessage?.created_at || new Date().toISOString(),
        unread_count: count || 0,
      });
    }

    // Sort by latest message time
    conversationsData.sort(
      (a, b) =>
        new Date(b.last_message_time).getTime() -
        new Date(a.last_message_time).getTime()
    );

    setConversations(conversationsData);

    // Auto-select first conversation if none selected
    if (!selectedConversation && conversationsData.length > 0) {
      selectConversation(conversationsData[0], adminId);
    }
  };

  const selectConversation = async (conv: Conversation, adminId?: string) => {
    setSelectedConversation(conv);
    setLoadingMessages(true);

    const userId = adminId || currentUserId;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${conv.client_id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${conv.client_id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithMine =
        data?.map((m) => ({
          ...m,
          is_mine: m.sender_id === userId,
        })) || [];

      setMessages(messagesWithMine);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", conv.client_id)
        .eq("receiver_id", userId)
        .eq("read", false);

      // Update unread count in conversations
      setConversations((prev) =>
        prev.map((c) =>
          c.client_id === conv.client_id ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedConversation.client_id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          ...data,
          is_mine: true,
        },
      ]);
      setNewMessage("");

      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c.client_id === selectedConversation.client_id
            ? { ...c, last_message: data.content, last_message_time: data.created_at }
            : c
        )
      );
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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.client_id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b ${
                        selectedConversation?.client_id === conv.client_id
                          ? "bg-muted/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          {conv.avatar_url && (
                            <AvatarImage src={conv.avatar_url} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conv.client_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.client_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.last_message_time), {
                                addSuffix: false,
                              })}
                            </span>
                          </div>
                          {conv.company && (
                            <p className="text-xs text-primary truncate">{conv.company}</p>
                          )}
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conv.last_message}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge className="ml-2">{conv.unread_count}</Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
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
                        {selectedConversation.avatar_url && (
                          <AvatarImage src={selectedConversation.avatar_url} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedConversation.client_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedConversation.client_name}</p>
                        {selectedConversation.company && (
                          <p className="text-sm text-muted-foreground">
                            {selectedConversation.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
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
                    )}
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
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && handleSendMessage()
                        }
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