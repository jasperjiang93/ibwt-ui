/**
 * Test script to submit mock result for a task
 * Usage: node test-submit-result.js <taskId>
 * Example: node test-submit-result.js clzy123abc456
 */

const taskId = process.argv[2];

if (!taskId) {
  console.error("❌ Please provide a task ID");
  console.log("Usage: node test-submit-result.js <taskId>");
  process.exit(1);
}

const mockResult = {
  agentId: "clzy0g4gp0002138mcdmjj6o5", // ResearchBot agent ID from seed
  outputs: [
    {
      type: "text",
      label: "Executive Summary",
      content: "After thorough research, I found that the top 5 AI startups in 2026 are:\n\n1. **Anthropic** - Leading AI safety and Claude AI\n2. **OpenAI** - GPT models and ChatGPT platform\n3. **Cohere** - Enterprise language AI solutions\n4. **Hugging Face** - Open-source AI model hub\n5. **Stability AI** - Generative AI for images and media\n\nEach company has shown significant growth and innovation in their respective domains.",
    },
    {
      type: "text",
      label: "Pricing Analysis",
      content: "Pricing comparison:\n\n• Anthropic Claude API: $3-$15 per million tokens\n• OpenAI GPT-4: $30 per million tokens\n• Cohere: $1-$2 per million tokens\n• Hugging Face: Free (open-source) + enterprise plans\n• Stability AI: $10-$100/month subscriptions\n\nConclusion: Pricing varies widely based on model capabilities and target market.",
    },
    {
      type: "image",
      label: "Market Share Chart",
      url: "https://via.placeholder.com/800x600/1a1a2e/d4af37?text=AI+Startup+Market+Share+2026",
    },
  ],
  mcpCallsLog: [
    {
      mcp_id: "clzy0g4gn0000138mew9c8hqg",
      mcp_name: "Web Scraper",
      called_at: new Date().toISOString(),
      success: true,
      duration_ms: 1250,
    },
    {
      mcp_id: "clzy0g4go0001138mn8yv2z4e",
      mcp_name: "PDF Reader",
      called_at: new Date().toISOString(),
      success: true,
      duration_ms: 890,
    },
  ],
};

async function submitResult() {
  try {
    console.log(`\n📤 Submitting result for task: ${taskId}\n`);

    const response = await fetch(`http://localhost:3000/api/dashboard/tasks/${taskId}/submit-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockResult),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit result");
    }

    const data = await response.json();
    console.log("✅ Result submitted successfully!");
    console.log("\n📊 Result Details:");
    console.log(JSON.stringify(data.result, null, 2));
    console.log("\n🎯 Next Steps:");
    console.log(`   1. Visit: http://localhost:3000/dashboard/tasks/${taskId}`);
    console.log("   2. Review the deliverables");
    console.log("   3. Click 'Approve & Release Funds' or 'Decline & Refund'");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

submitResult();
