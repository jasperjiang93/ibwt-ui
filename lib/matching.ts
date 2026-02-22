export interface MatchedAgent {
  agentId: string;
  agentName: string;
  matchScore: number;
  matchedCapabilities: string[];
  suggestedMcps: Array<{
    mcpId: string;
    mcpName: string;
    pricePerCall: number;
  }>;
}

/**
 * Match agents to a task based on keywords and capabilities
 * Returns top 3 matched agents with their supported MCPs
 */
export async function matchAgentsToTask(
  taskDescription: string,
  keywords: string[]
): Promise<MatchedAgent[]> {
  try {
    // Fetch all agents from local database
    const agentsRes = await fetch('/api/dashboard/agents');
    if (!agentsRes.ok) {
      console.error('Failed to fetch agents');
      return [];
    }
    const { agents } = await agentsRes.json();

    if (!agents || agents.length === 0) {
      return [];
    }

    // Fetch all MCPs for pricing lookup
    const mcpsRes = await fetch('/api/dashboard/mcps');
    const { mcps } = mcpsRes.ok ? await mcpsRes.json() : { mcps: [] };

    // Create MCP lookup map
    const mcpMap = new Map<string, { name: string; pricePerCall: number }>(
      mcps.map((mcp: any) => [mcp.id, { name: mcp.name, pricePerCall: mcp.pricePerCall }])
    );

    // Match each agent
    const matches: Array<{ agent: any; score: number; matched: string[] }> = [];

    for (const agent of agents) {
      // Skip agents that are not available (busy, offline, etc.)
      if (agent.status !== 'available') {
        console.log(`Skipping agent ${agent.name} - status: ${agent.status}`);
        continue;
      }

      if (!agent.capabilities || agent.capabilities.length === 0) {
        continue;
      }

      // Calculate match score based on keyword overlap with capabilities
      const matchedCapabilities = agent.capabilities.filter((cap: string) =>
        keywords.some((kw) =>
          cap.toLowerCase().includes(kw.toLowerCase()) ||
          kw.toLowerCase().includes(cap.toLowerCase())
        )
      );

      if (matchedCapabilities.length > 0) {
        const score = matchedCapabilities.length / agent.capabilities.length;
        matches.push({ agent, score, matched: matchedCapabilities });
      }
    }

    // Sort by score descending and take top 3
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3);

    // Build result with suggested MCPs
    const result: MatchedAgent[] = topMatches.map(({ agent, score, matched }) => {
      // Get suggested MCPs for this agent
      const suggestedMcps = agent.supportedMcps
        .map((mcpId: string) => {
          const mcpInfo = mcpMap.get(mcpId);
          if (!mcpInfo) return null;
          return {
            mcpId,
            mcpName: mcpInfo.name,
            pricePerCall: mcpInfo.pricePerCall,
          };
        })
        .filter(Boolean);

      return {
        agentId: agent.id,
        agentName: agent.name,
        matchScore: score,
        matchedCapabilities: matched,
        suggestedMcps,
      };
    });

    return result;
  } catch (error) {
    console.error('Error matching agents:', error);
    return [];
  }
}
