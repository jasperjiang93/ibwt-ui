import { MatchedAgent } from './matching';

/**
 * Generate 4-5 mock bids for a task based on matched agents
 * Creates bids with realistic pricing and MCP plans
 */
export async function generateMockBids(
  taskId: string,
  budget: number,
  matchedAgents: MatchedAgent[]
): Promise<void> {
  if (matchedAgents.length === 0) {
    console.log('No matched agents to generate bids');
    return;
  }

  // Generate 4-5 bids from top matched agents with varied pricing
  const numBids = Math.min(5, matchedAgents.length);
  const bidsToCreate = matchedAgents.slice(0, numBids);

  // Create each bid with different pricing strategies for comparison
  const bidPromises = bidsToCreate.map(async (agent, index) => {
    // Calculate total with varied percentages for comparison effect
    // Strategy 1: Competitive (72%), 2: Mid-low (78%), 3: Balanced (85%), 4: Mid-high (88%), 5: Premium (92%)
    const percentages = [0.72, 0.78, 0.85, 0.88, 0.92];
    const total = Math.floor(budget * percentages[index % percentages.length]);

    // Agent fee with varied percentages for price diversity
    const agentFeePercentages = [0.42, 0.48, 0.52, 0.55, 0.58];
    const agentFee = Math.floor(total * agentFeePercentages[index % agentFeePercentages.length]);

    // Remaining budget for MCPs
    const mcpBudget = total - agentFee;

    // Build MCP plan with varied call counts for price diversity
    const mcpPlan = [];
    if (agent.suggestedMcps.length > 0) {
      // Vary MCP distribution across bids
      const firstMcpShares = [0.65, 0.58, 0.62, 0.55, 0.60];
      const firstMcpBudget = Math.floor(mcpBudget * firstMcpShares[index % firstMcpShares.length]);
      const remainingBudget = mcpBudget - firstMcpBudget;

      // First MCP
      const firstMcp = agent.suggestedMcps[0];
      const firstMcpCalls = Math.max(1, Math.floor(firstMcpBudget / firstMcp.pricePerCall));
      const firstMcpSubtotal = firstMcpCalls * firstMcp.pricePerCall;
      mcpPlan.push({
        mcp_id: firstMcp.mcpId,
        mcp_name: firstMcp.mcpName,
        calls: firstMcpCalls,
        price_per_call: firstMcp.pricePerCall,
        subtotal: firstMcpSubtotal,
      });

      // Remaining MCPs split the rest
      const otherMcps = agent.suggestedMcps.slice(1);
      if (otherMcps.length > 0) {
        const budgetPerMcp = Math.floor(remainingBudget / otherMcps.length);
        otherMcps.forEach((mcp) => {
          const calls = Math.max(1, Math.floor(budgetPerMcp / mcp.pricePerCall));
          const subtotal = calls * mcp.pricePerCall;
          mcpPlan.push({
            mcp_id: mcp.mcpId,
            mcp_name: mcp.mcpName,
            calls,
            price_per_call: mcp.pricePerCall,
            subtotal,
          });
        });
      }
    }

    // Random ETA between 30-120 minutes
    const etaMinutes = 30 + Math.floor(Math.random() * 90);

    // Auto-generated message based on capabilities
    const capabilities = agent.matchedCapabilities.join(', ');
    const message = `I can help with this ${capabilities} task! I have experience with similar projects and can deliver quality results.`;

    // Create bid via API
    const bidData = {
      taskId,
      agentId: agent.agentId,
      agentFee,
      mcpPlan,
      total,
      etaMinutes,
      message,
    };

    try {
      const res = await fetch('/api/dashboard/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidData),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to create bid:', error);
      } else {
        console.log(`Created bid for agent ${agent.agentName}`);
      }
    } catch (error) {
      console.error('Error creating bid:', error);
    }
  });

  await Promise.all(bidPromises);
}
