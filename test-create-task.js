/**
 * Test script to create a task via API
 */

const testData = {
  userAddress: "2Fppdut2ybtpU72DtebkVekobW3uG6Z4By9g1BKLXRZp", // Alice's wallet
  request: "Research the top 5 AI companies - revenue and market share",
  budgetIbwt: 3000,
  requirements: {
    conversation: [
      { role: "user", content: "hi" },
      { role: "assistant", content: "Hello! What do you need?" },
      { role: "user", content: "research market" },
      { role: "assistant", content: "What's your budget?" },
      { role: "user", content: "3000" }
    ],
    keywords: ["research", "market", "companies"],
    suggestedAgents: []
  }
};

async function testCreateTask() {
  try {
    console.log("\n📤 Creating task...");
    console.log("User Address:", testData.userAddress);
    console.log("Budget:", testData.budgetIbwt);
    console.log("");

    const response = await fetch("http://localhost:3000/api/dashboard/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseText);
    console.log("");

    if (!response.ok) {
      console.error("❌ Failed to create task");
      process.exit(1);
    }

    const data = JSON.parse(responseText);
    console.log("✅ Task created successfully!");
    console.log("Task ID:", data.task.id);
    console.log("Status:", data.task.status);
    console.log("Budget:", data.task.budgetIbwt, "$IBWT");
    console.log("");
    console.log("View task at: http://localhost:3000/dashboard/tasks/" + data.task.id);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testCreateTask();
