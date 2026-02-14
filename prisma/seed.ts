import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Helpers ----

function daysAgo(n: number, hourOffset = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, 0, 0, 0);
  return d;
}

function tasksPerDay(day: number): number {
  if (day === 0) return 5;
  if (day < 7) return 4;
  return day % 2 === 0 ? 4 : 3;
}

interface McpRef { id: string; name: string; pricePerCall: number }

function buildMcpPlan(
  type: "research" | "writer",
  total: number,
  mcps: { scraper: McpRef; pdf: McpRef; imageGen: McpRef },
) {
  if (type === "research") {
    const scraperCalls = Math.max(1, Math.round(total * 0.35 / mcps.scraper.pricePerCall));
    const scraperSub = scraperCalls * mcps.scraper.pricePerCall;
    const pdfCalls = Math.max(1, Math.round(total * 0.15 / mcps.pdf.pricePerCall));
    const pdfSub = pdfCalls * mcps.pdf.pricePerCall;
    const agentFee = total - scraperSub - pdfSub;
    return {
      agentFee,
      plan: [
        { mcp_id: mcps.scraper.id, mcp_name: mcps.scraper.name, calls: scraperCalls, price_per_call: mcps.scraper.pricePerCall, subtotal: scraperSub },
        { mcp_id: mcps.pdf.id, mcp_name: mcps.pdf.name, calls: pdfCalls, price_per_call: mcps.pdf.pricePerCall, subtotal: pdfSub },
      ],
    };
  } else {
    const imgCalls = Math.max(1, Math.round(total * 0.35 / mcps.imageGen.pricePerCall));
    const imgSub = imgCalls * mcps.imageGen.pricePerCall;
    const scraperCalls = Math.max(1, Math.round(total * 0.2 / mcps.scraper.pricePerCall));
    const scraperSub = scraperCalls * mcps.scraper.pricePerCall;
    const agentFee = total - imgSub - scraperSub;
    return {
      agentFee,
      plan: [
        { mcp_id: mcps.imageGen.id, mcp_name: mcps.imageGen.name, calls: imgCalls, price_per_call: mcps.imageGen.pricePerCall, subtotal: imgSub },
        { mcp_id: mcps.scraper.id, mcp_name: mcps.scraper.name, calls: scraperCalls, price_per_call: mcps.scraper.pricePerCall, subtotal: scraperSub },
      ],
    };
  }
}

// ---- Task templates ----

const templates: { request: string; type: "research" | "writer"; total: number }[] = [
  { request: "Analyze DeFi protocol metrics and TVL trends", type: "research", total: 4200 },
  { request: "Generate marketing copy for token launch campaign", type: "writer", total: 3800 },
  { request: "Research competitor pricing in Web3 infrastructure space", type: "research", total: 5100 },
  { request: "Create social media content calendar for Q1", type: "writer", total: 3200 },
  { request: "Audit smart contract for reentrancy vulnerabilities", type: "research", total: 7500 },
  { request: "Write technical API documentation for SDK", type: "writer", total: 2800 },
  { request: "Scrape and analyze NFT marketplace trading data", type: "research", total: 4800 },
  { request: "Generate promotional banner images for launch", type: "writer", total: 4500 },
  { request: "Summarize findings from DeFi audit whitepapers", type: "research", total: 3500 },
  { request: "Create investor pitch deck content and visuals", type: "writer", total: 5500 },
  { request: "Analyze on-chain transaction patterns for whale tracking", type: "research", total: 6200 },
  { request: "Draft blog post about autonomous AI agents", type: "writer", total: 2500 },
  { request: "Compile market intelligence report on L2 solutions", type: "research", total: 5800 },
  { request: "Generate brand identity assets for new protocol", type: "writer", total: 4100 },
  { request: "Research regulatory compliance for token offerings", type: "research", total: 3800 },
  { request: "Create email marketing sequence for product launch", type: "writer", total: 3500 },
  { request: "Analyze Solana validator performance metrics", type: "research", total: 4600 },
  { request: "Design and write onboarding flow copy", type: "writer", total: 6000 },
  { request: "Research cross-chain bridge security incidents", type: "research", total: 5200 },
  { request: "Generate tutorial content for developer docs", type: "writer", total: 3000 },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // ---- Clean existing data ----
  await prisma.taskMessage.deleteMany();
  await prisma.accessKey.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.result.deleteMany();
  await prisma.task.updateMany({ data: { acceptedBidId: null } });
  await prisma.bid.deleteMany();
  await prisma.task.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.mcp.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users ----
  const alice = await prisma.user.create({
    data: {
      walletAddress: "A1icEw4LLet111111111111111111111111111111111",
      role: "user",
    },
  });

  const bob = await prisma.user.create({
    data: {
      walletAddress: "B0bWaLLet1111111111111111111111111111111111",
      role: "user",
    },
  });

  console.log(`  Users: ${alice.id} (alice), ${bob.id} (bob)`);

  // ---- MCPs (tools provided by alice) ----
  const mcpPdf = await prisma.mcp.create({
    data: {
      name: "PDF Reader",
      description: "Extract text and images from PDF files",
      providerAddress: alice.walletAddress,
      endpoint: "https://mcp.ibwt.io/pdf-reader",
      pricePerCall: 50,
    },
  });

  const mcpScraper = await prisma.mcp.create({
    data: {
      name: "Web Scraper",
      description: "Scrape and parse web pages with structured output",
      providerAddress: alice.walletAddress,
      endpoint: "https://mcp.ibwt.io/web-scraper",
      pricePerCall: 100,
    },
  });

  const mcpImageGen = await prisma.mcp.create({
    data: {
      name: "Image Generator",
      description: "Generate images using AI models",
      providerAddress: alice.walletAddress,
      endpoint: "https://mcp.ibwt.io/image-gen",
      pricePerCall: 500,
    },
  });

  const mcps = {
    scraper: { id: mcpScraper.id, name: "Web Scraper", pricePerCall: 100 },
    pdf: { id: mcpPdf.id, name: "PDF Reader", pricePerCall: 50 },
    imageGen: { id: mcpImageGen.id, name: "Image Generator", pricePerCall: 500 },
  };

  console.log(`  MCPs: ${mcpPdf.id}, ${mcpScraper.id}, ${mcpImageGen.id}`);

  // ---- Agents (owned by alice) ----
  const agentResearch = await prisma.agent.create({
    data: {
      name: "ResearchBot",
      description: "Specializes in web research and data analysis",
      ownerId: alice.id,
      walletAddress: "ResearchB0tWa11et111111111111111111111111111",
      webhookUrl: "https://agents.ibwt.io/research-bot/webhook",
      webhookSecret: "whsec_research_bot_dev",
      capabilities: ["research", "analysis", "summarization"],
      supportedMcps: [mcpPdf.id, mcpScraper.id],
      status: "available",
      rating: 4.8,
      completedTasks: 0,
    },
  });

  const agentWriter = await prisma.agent.create({
    data: {
      name: "ContentWriter",
      description: "Creates high-quality written content and visuals",
      ownerId: alice.id,
      walletAddress: "ContentWr1terWa11et11111111111111111111111",
      webhookUrl: "https://agents.ibwt.io/content-writer/webhook",
      webhookSecret: "whsec_content_writer_dev",
      capabilities: ["writing", "editing", "translation", "design"],
      supportedMcps: [mcpImageGen.id, mcpScraper.id],
      status: "busy",
      rating: 4.5,
      completedTasks: 0,
    },
  });

  const agents = {
    research: agentResearch,
    writer: agentWriter,
  };

  console.log(`  Agents: ${agentResearch.id}, ${agentWriter.id}`);

  // ---- Generate completed tasks across 30 days ----

  let templateIdx = 0;
  let totalTasks = 0;
  let totalBids = 0;
  const agentTaskCounts = { research: 0, writer: 0 };

  for (let day = 29; day >= 0; day--) {
    const numTasks = tasksPerDay(day);

    for (let t = 0; t < numTasks; t++) {
      const tmpl = templates[templateIdx % templates.length];
      const agent = agents[tmpl.type];
      const hourOffset = 8 + ((templateIdx * 3) % 12); // spread across business hours
      const date = daysAgo(day, hourOffset);

      const { agentFee, plan } = buildMcpPlan(tmpl.type, tmpl.total, mcps);

      const task = await prisma.task.create({
        data: {
          userId: bob.id,
          userAddress: bob.walletAddress,
          request: tmpl.request,
          budgetIbwt: Math.round(tmpl.total * 1.2),
          status: "completed",
          createdAt: date,
        },
      });

      const bid = await prisma.bid.create({
        data: {
          taskId: task.id,
          agentId: agent.id,
          agentAddress: agent.walletAddress,
          agentFee,
          mcpPlan: plan,
          total: tmpl.total,
          etaMinutes: 30 + ((templateIdx * 7) % 150),
          message: "I can handle this task efficiently",
          status: "accepted",
          createdAt: date,
        },
      });

      await prisma.task.update({
        where: { id: task.id },
        data: { acceptedBidId: bid.id },
      });

      await prisma.result.create({
        data: {
          taskId: task.id,
          agentId: agent.id,
          outputs: [{ type: "text", label: "Result", content: "Task completed successfully." }],
          submittedAt: date,
        },
      });

      agentTaskCounts[tmpl.type]++;
      totalTasks++;
      totalBids++;
      templateIdx++;
    }
  }

  // ---- Alice's spending tasks (small, spread across month) ----

  const aliceSpendingTasks = [
    { request: "Quick grammar check on agent documentation", total: 400, day: 1, type: "writer" as const },
    { request: "Generate a logo concept for my new MCP tool", total: 700, day: 8, type: "writer" as const },
    { request: "Proofread SDK integration guide", total: 350, day: 15, type: "writer" as const },
    { request: "Summarize changelog for latest release", total: 500, day: 22, type: "research" as const },
  ];

  for (const spec of aliceSpendingTasks) {
    const agent = agents[spec.type];
    const date = daysAgo(spec.day, 14);
    const { agentFee, plan } = buildMcpPlan(spec.type, spec.total, mcps);

    const task = await prisma.task.create({
      data: {
        userId: alice.id,
        userAddress: alice.walletAddress,
        request: spec.request,
        budgetIbwt: Math.round(spec.total * 1.3),
        status: "completed",
        createdAt: date,
      },
    });

    const bid = await prisma.bid.create({
      data: {
        taskId: task.id,
        agentId: agent.id,
        agentAddress: agent.walletAddress,
        agentFee,
        mcpPlan: plan,
        total: spec.total,
        etaMinutes: 15,
        message: "Quick turnaround",
        status: "accepted",
        createdAt: date,
      },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { acceptedBidId: bid.id },
    });

    await prisma.result.create({
      data: {
        taskId: task.id,
        agentId: agent.id,
        outputs: [{ type: "text", label: "Result", content: "Done." }],
        submittedAt: date,
      },
    });

    totalTasks++;
    totalBids++;
  }

  // ---- Open tasks (recent, waiting for bids) ----

  function hoursAgo(h: number): Date {
    return new Date(Date.now() - h * 60 * 60 * 1000);
  }

  const openSpecs = [
    { request: "Translate documentation from English to Chinese", budget: 2000, hours: 2 },
    { request: "Build a comparison chart of top L2 solutions", budget: 3500, hours: 5 },
    { request: "Write SEO-optimized landing page copy", budget: 2800, hours: 8 },
    { request: "Analyze gas fee trends across EVM chains", budget: 4200, hours: 14 },
  ];

  for (const spec of openSpecs) {
    const openTask = await prisma.task.create({
      data: {
        userId: bob.id,
        userAddress: bob.walletAddress,
        request: spec.request,
        budgetIbwt: spec.budget,
        status: "open",
        createdAt: hoursAgo(spec.hours),
      },
    });

    await prisma.bid.create({
      data: {
        taskId: openTask.id,
        agentId: agentWriter.id,
        agentAddress: agentWriter.walletAddress,
        agentFee: Math.round(spec.budget * 0.4),
        mcpPlan: [{ mcp_id: mcpPdf.id, mcp_name: "PDF Reader", calls: 10, price_per_call: 50, subtotal: 500 }],
        total: Math.round(spec.budget * 0.4) + 500,
        etaMinutes: 120,
        message: "I can handle this efficiently",
        status: "pending",
        createdAt: hoursAgo(spec.hours - 0.5),
      },
    });

    await prisma.bid.create({
      data: {
        taskId: openTask.id,
        agentId: agentResearch.id,
        agentAddress: agentResearch.walletAddress,
        agentFee: Math.round(spec.budget * 0.35),
        mcpPlan: [{ mcp_id: mcpScraper.id, mcp_name: "Web Scraper", calls: 8, price_per_call: 100, subtotal: 800 }],
        total: Math.round(spec.budget * 0.35) + 800,
        etaMinutes: 60,
        message: "Fast turnaround on this",
        status: "pending",
        createdAt: hoursAgo(spec.hours - 0.5),
      },
    });

    totalTasks++;
    totalBids += 2;
  }

  // ---- In-progress tasks ----

  const ipSpecs = [
    { request: "Create a market analysis report for DeFi protocols", budget: 5000, hours: 3, agent: "research" as const },
    { request: "Design infographic series for tokenomics overview", budget: 6000, hours: 6, agent: "writer" as const },
    { request: "Compile due diligence report on Solana DePIN projects", budget: 4500, hours: 10, agent: "research" as const },
  ];

  for (const spec of ipSpecs) {
    const agent = agents[spec.agent];
    const { agentFee, plan } = buildMcpPlan(spec.agent, Math.round(spec.budget * 0.9), mcps);

    const ipTask = await prisma.task.create({
      data: {
        userId: bob.id,
        userAddress: bob.walletAddress,
        request: spec.request,
        budgetIbwt: spec.budget,
        status: "in_progress",
        createdAt: hoursAgo(spec.hours),
      },
    });

    const ipBid = await prisma.bid.create({
      data: {
        taskId: ipTask.id,
        agentId: agent.id,
        agentAddress: agent.walletAddress,
        agentFee,
        mcpPlan: plan,
        total: Math.round(spec.budget * 0.9),
        etaMinutes: 180,
        message: "Working on it now",
        status: "accepted",
        createdAt: hoursAgo(spec.hours - 0.5),
      },
    });

    await prisma.task.update({
      where: { id: ipTask.id },
      data: { acceptedBidId: ipBid.id },
    });

    totalTasks++;
    totalBids++;
  }

  // ---- Update agent completed task counts ----

  await prisma.agent.update({
    where: { id: agentResearch.id },
    data: { completedTasks: agentTaskCounts.research },
  });

  await prisma.agent.update({
    where: { id: agentWriter.id },
    data: { completedTasks: agentTaskCounts.writer },
  });

  // ---- Summary ----
  const openCount = openSpecs.length;
  const ipCount = ipSpecs.length;
  const completedTasks = totalTasks - openCount - ipCount;
  console.log(`\n✅ Seed complete!`);
  console.log(`  - 2 users (alice, bob)`);
  console.log(`  - 3 MCPs (PDF Reader, Web Scraper, Image Generator)`);
  console.log(`  - 2 agents (ResearchBot: ${agentTaskCounts.research} tasks, ContentWriter: ${agentTaskCounts.writer} tasks)`);
  console.log(`  - ${totalTasks} tasks (${completedTasks} completed, ${openCount} open, ${ipCount} in_progress)`);
  console.log(`  - ${totalBids} bids`);
  console.log(`  - Data spread across 30 days`);
  console.log(`\n  Alice's wallet: ${alice.walletAddress}`);
  console.log(`  Bob's wallet:   ${bob.walletAddress}\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
