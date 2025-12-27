import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true });

    // Fetch projects
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .order("due_date", { ascending: true });

    // Fetch leads
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .order("updated_at", { ascending: false });

    // Fetch profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    
    const systemPrompt = `You are an expert AI Project Manager assistant. Your role is to analyze the user's tasks, projects, and leads, then provide:

1. **Priority Actions**: List the top 3-5 things the user should focus on TODAY based on urgency and importance.

2. **Task Rewrites**: If any tasks have unclear or poorly written descriptions, suggest clearer versions that are actionable and specific.

3. **Reminders**: List any overdue items or items due within the next 3 days.

4. **Lead Insights**: Analyze leads in the pipeline and suggest which ones need attention.

5. **Project Health Check**: Brief assessment of each active project's status.

Be concise, actionable, and prioritize what matters most. Use the user's name when appropriate. Format your response in clear sections with markdown.

Today's date is: ${today}
User's name: ${profile?.full_name || "there"}`;

    const userContent = `Here is my current workload data:

## Tasks (${tasks?.length || 0} total)
${JSON.stringify(tasks || [], null, 2)}

## Projects (${projects?.length || 0} total)
${JSON.stringify(projects || [], null, 2)}

## Leads (${leads?.length || 0} total)
${JSON.stringify(leads || [], null, 2)}

Please analyze this data and give me my daily briefing with actionable insights.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-project-manager function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
