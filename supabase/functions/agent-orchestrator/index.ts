import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentTask {
  agentId: string;
  agentName: string;
  role: string;
  phase: number;
}

const agents: AgentTask[] = [
  { agentId: "managing-partner", agentName: "Atlas", role: "Managing Partner - Orchestrator", phase: 0 },
  { agentId: "client-discovery", agentName: "Echo", role: "Client Discovery Agent", phase: 1 },
  { agentId: "strategy-feasibility", agentName: "Sage", role: "Strategy & Feasibility Agent", phase: 1 },
  { agentId: "legal-compliance", agentName: "Justice", role: "Legal & Compliance Agent", phase: 2 },
  { agentId: "proposal-scope", agentName: "Blueprint", role: "Proposal & Scope Agent", phase: 2 },
  { agentId: "finance-commercial", agentName: "Ledger", role: "Finance & Commercial Agent", phase: 2 },
  { agentId: "brand-strategy", agentName: "Muse", role: "Brand Strategy Agent", phase: 3 },
  { agentId: "design-production", agentName: "Canvas", role: "Design Production Agent", phase: 3 },
  { agentId: "product-management", agentName: "Navigator", role: "Product Management Agent", phase: 4 },
  { agentId: "technical-architecture", agentName: "Architect", role: "Technical Architecture Agent", phase: 4 },
  { agentId: "build-agent", agentName: "Forge", role: "Build Agent (Engineering)", phase: 4 },
  { agentId: "ai-systems", agentName: "Synapse", role: "AI Systems Agent", phase: 4 },
  { agentId: "quality-assurance", agentName: "Inspector", role: "Quality Assurance Agent", phase: 5 },
  { agentId: "security-risk", agentName: "Sentinel", role: "Security & Risk Agent", phase: 5 },
  { agentId: "release-deployment", agentName: "Launch", role: "Release & Deployment Agent", phase: 5 },
  { agentId: "client-handover", agentName: "Bridge", role: "Client Handover Agent", phase: 6 },
  { agentId: "support-maintenance", agentName: "Guardian", role: "Support & Maintenance Agent", phase: 6 },
  { agentId: "growth-optimisation", agentName: "Catalyst", role: "Growth & Optimisation Agent", phase: 6 },
];

const getAgentPrompt = (agent: AgentTask, brief: string, previousOutputs: string): string => {
  const prompts: Record<string, string> = {
    "managing-partner": `You are Atlas, the Managing Partner of an AI software agency. You've received this project brief:
"${brief}"

Your job is to:
1. Analyze the brief and identify key requirements
2. Create a phase-by-phase execution plan
3. Assign priority levels to each phase
4. Set quality gates and approval criteria

Respond with a structured project plan in markdown format. Be concise but comprehensive.`,

    "client-discovery": `You are Echo, the Client Discovery Agent. Based on this project brief:
"${brief}"

Previous context: ${previousOutputs || "Starting fresh"}

Extract and document:
1. Core business goals
2. Target audience
3. Success metrics
4. Budget constraints
5. Timeline expectations
6. Key stakeholders

Format as a clear Project Brief document in markdown.`,

    "strategy-feasibility": `You are Sage, the Strategy & Feasibility Agent. Based on:
Brief: "${brief}"
Discovery findings: ${previousOutputs}

Provide:
1. Technical feasibility assessment
2. Risk analysis (technical, budget, timeline)
3. Recommended approach (MVP, phased, full build)
4. Go/No-Go recommendation with reasoning

Format as a Strategy Document in markdown.`,

    "legal-compliance": `You are Justice, the Legal & Compliance Agent. Based on:
Brief: "${brief}"
Strategy: ${previousOutputs}

Draft:
1. Key contract terms needed
2. IP ownership clauses
3. Data protection requirements
4. Liability limitations
5. SLA recommendations

Format as a Legal Considerations document in markdown.`,

    "proposal-scope": `You are Blueprint, the Proposal & Scope Agent. Based on:
Brief: "${brief}"
Previous work: ${previousOutputs}

Create:
1. Detailed scope of work
2. Deliverables list
3. Milestones with dates
4. Exclusions and assumptions
5. Change request process

Format as a Project Proposal in markdown.`,

    "finance-commercial": `You are Ledger, the Finance & Commercial Agent. Based on:
Brief: "${brief}"
Scope: ${previousOutputs}

Provide:
1. Cost breakdown by phase
2. Payment milestone schedule
3. Resource allocation estimate
4. ROI projection
5. Commercial risk assessment

Format as a Commercial Proposal in markdown.`,

    "brand-strategy": `You are Muse, the Brand Strategy Agent. Based on:
Brief: "${brief}"
Project context: ${previousOutputs}

Define:
1. Brand voice and tone guidelines
2. Visual direction principles
3. UX philosophy
4. Key brand attributes
5. Differentiation strategy

Format as a Brand Strategy document in markdown.`,

    "design-production": `You are Canvas, the Design Production Agent. Based on:
Brief: "${brief}"
Brand strategy: ${previousOutputs}

Outline:
1. UI/UX approach
2. Key screen layouts needed
3. Component library structure
4. Design system foundations
5. Responsive design strategy

Format as a Design Specification in markdown.`,

    "product-management": `You are Navigator, the Product Management Agent. Based on:
Brief: "${brief}"
Design specs: ${previousOutputs}

Create:
1. Feature prioritization (MoSCoW)
2. User stories for MVP
3. Product roadmap phases
4. Success metrics per feature
5. Dependencies map

Format as a Product Requirements Document in markdown.`,

    "technical-architecture": `You are Architect, the Technical Architecture Agent. Based on:
Brief: "${brief}"
Product requirements: ${previousOutputs}

Design:
1. System architecture overview
2. Technology stack recommendations
3. Database schema concepts
4. API structure
5. Security architecture
6. Scalability considerations

Format as a Technical Architecture Document in markdown.`,

    "build-agent": `You are Forge, the Build Agent. Based on:
Brief: "${brief}"
Architecture: ${previousOutputs}

Plan:
1. Development phases
2. Sprint breakdown
3. Technical implementation approach
4. Integration points
5. Code quality standards

Format as a Development Plan in markdown.`,

    "ai-systems": `You are Synapse, the AI Systems Agent. Based on:
Brief: "${brief}"
Technical context: ${previousOutputs}

Design:
1. AI/ML components needed
2. Prompt engineering approach
3. Model selection recommendations
4. Training/fine-tuning needs
5. AI ethics considerations

Format as an AI Systems Specification in markdown.`,

    "quality-assurance": `You are Inspector, the Quality Assurance Agent. Based on:
Brief: "${brief}"
Build plan: ${previousOutputs}

Create:
1. QA strategy
2. Test case categories
3. Acceptance criteria
4. Performance benchmarks
5. Bug severity definitions

Format as a QA Plan in markdown.`,

    "security-risk": `You are Sentinel, the Security & Risk Agent. Based on:
Brief: "${brief}"
System design: ${previousOutputs}

Assess:
1. Security requirements
2. Vulnerability areas
3. Data protection measures
4. Access control design
5. Compliance checklist

Format as a Security Assessment in markdown.`,

    "release-deployment": `You are Launch, the Release & Deployment Agent. Based on:
Brief: "${brief}"
QA and Security reviews: ${previousOutputs}

Plan:
1. Deployment strategy
2. Environment setup
3. Release checklist
4. Rollback procedures
5. Monitoring setup

Format as a Deployment Plan in markdown.`,

    "client-handover": `You are Bridge, the Client Handover Agent. Based on:
Brief: "${brief}"
Full project context: ${previousOutputs}

Prepare:
1. User documentation outline
2. Admin guide structure
3. Training plan
4. Support transition
5. Handover checklist

Format as a Handover Document in markdown.`,

    "support-maintenance": `You are Guardian, the Support & Maintenance Agent. Based on:
Brief: "${brief}"
Project details: ${previousOutputs}

Define:
1. Support tier structure
2. SLA definitions
3. Maintenance schedule
4. Escalation procedures
5. Monitoring dashboard requirements

Format as a Support Plan in markdown.`,

    "growth-optimisation": `You are Catalyst, the Growth & Optimisation Agent. Based on:
Brief: "${brief}"
Full project: ${previousOutputs}

Recommend:
1. Growth opportunities
2. Optimization areas
3. Upsell potential
4. Automation opportunities
5. Long-term roadmap suggestions

Format as a Growth Strategy document in markdown.`,
  };

  return prompts[agent.agentId] || `You are ${agent.agentName}, the ${agent.role}. Process this brief: "${brief}" with context: ${previousOutputs}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brief, agentId, previousOutputs } = await req.json();
    
    if (!brief) {
      return new Response(JSON.stringify({ error: 'Brief is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const agent = agents.find(a => a.agentId === agentId);
    if (!agent) {
      return new Response(JSON.stringify({ error: 'Invalid agent ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = getAgentPrompt(agent, brief, previousOutputs || '');

    console.log(`Processing agent: ${agent.agentName} (${agent.agentId})`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `You are ${agent.agentName}, the ${agent.role} at an AI software development agency. You produce professional, actionable documents. Always format your output in clean markdown. Be thorough but concise.` 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits required. Please add funds to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || 'No output generated';

    console.log(`Agent ${agent.agentName} completed successfully`);

    return new Response(JSON.stringify({ 
      agentId: agent.agentId,
      agentName: agent.agentName,
      role: agent.role,
      phase: agent.phase,
      output,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in agent-orchestrator:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
