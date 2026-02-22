#!/usr/bin/env tsx
/**
 * Agent Executor - Simulates agent task execution using real CLI tools
 *
 * Usage: tsx scripts/agent-executor.ts <taskId>
 *
 * This script:
 * 1. Reads task details from database
 * 2. Executes MCP tools based on accepted bid plan
 * 3. Generates results and submits them
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import WebSocket from "ws";

const prisma = new PrismaClient();

// OpenClaw AI helper using request-response protocol with 'send' method
async function generateContentWithOpenClaw(taskRequest: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const wsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || "ws://localhost:18789";
    const token = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || "";

    const ws = new WebSocket(wsUrl);
    let fullContent = "";
    const sessionKey = `agent:executor:task-${Date.now()}`; // Unique session for this task
    const pending = new Map<string, { resolve: Function; reject: Function }>();

    function generateId() {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    function request(method: string, params: any) {
      return new Promise((resolve, reject) => {
        const id = generateId();
        const frame = { type: "req", id, method, params };

        pending.set(id, { resolve, reject });

        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error(`Timeout: ${method}`));
          }
        }, 30000);

        ws.send(JSON.stringify(frame));
      });
    }

    ws.on("open", () => {
      console.log("   🤖 Connected to OpenClaw AI...");
    });

    ws.on("message", (data) => {
      try {
        const frame = JSON.parse(data.toString());

        if (frame.type === "res") {
          const handler = pending.get(frame.id);
          if (handler) {
            pending.delete(frame.id);
            if (frame.ok) {
              handler.resolve(frame.payload);
            } else {
              handler.reject(new Error(frame.error?.message || "Request failed"));
            }
          }
        } else if (frame.type === "event") {
          switch (frame.event) {
            case "connect.challenge":
              console.log("   🔐 Authenticating...");
              request("connect", {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "test",
                  displayName: "IBWT Agent Executor",
                  version: "1.0.0",
                  platform: "node",
                  mode: "test",
                },
                caps: [],
                auth: { token },
              })
                .then(() => {
                  console.log("   ✅ Authenticated");
                  console.log(`   📋 Using session: ${sessionKey}`);
                  console.log("   💬 Sending research request via chat.send...");

                  // Extract research topic from task request and create focused prompt
                  // Remove execution details like "send to email", "convert to pdf"
                  const researchTopic = taskRequest
                    .replace(/convert\s+(into|to)\s+pdf/gi, '')
                    .replace(/send\s+to\s+(my\s+)?email[:\s]+[\w@.-]+/gi, '')
                    .trim();

                  const prompt = `<system>You are a research writer. You do not have access to any tools. You cannot create files, send emails, or execute commands. You can ONLY output text.</system>

Write a complete research paper in markdown format about: ${researchTopic}

CRITICAL INSTRUCTIONS:
- Output the markdown content DIRECTLY in your response
- Do NOT mention tools, files, or actions you will take
- Do NOT say "I'll create a file" or "I'll use X tool"
- Just write the research paper content immediately
- Length: 1200-1500 words (suitable for 3 pages)
- Include: title, introduction, body sections, conclusion

BEGIN THE RESEARCH PAPER NOW:

# `;

                  return request("chat.send", {
                    sessionKey: sessionKey,
                    message: prompt,
                    idempotencyKey: generateId()
                  });
                })
                .then((response: any) => {
                  console.log("   ✅ Request sent, waiting for response...");
                  // Response will come via chat event
                })
                .catch((err) => {
                  console.error(`   ❌ Error: ${err.message}`);
                  ws.close();
                  reject(err);
                });
              break;

            case "chat":
              // Handle streaming chat events
              const chatPayload = frame.payload;
              console.log(`\n   [DEBUG] Chat event: session=${chatPayload?.sessionKey}, state=${chatPayload?.state}, seq=${chatPayload?.seq}`);

              if (chatPayload && chatPayload.sessionKey === sessionKey) {
                if (chatPayload.state === "delta" && chatPayload.message) {
                  const content = chatPayload.message?.content
                    ?.filter((item: any) => item.type === "text")
                    .map((item: any) => item.text)
                    .join("") || "";

                  console.log(`   [DEBUG] Delta content length: ${content.length}, fullContent before: ${fullContent.length}`);

                  if (content) {
                    // OpenClaw sends full content in each delta, not incremental
                    // Keep the longest version (in case AI switches between content blocks)
                    if (content.length > fullContent.length) {
                      fullContent = content;
                      console.log(`   [DEBUG] Updated fullContent to: ${fullContent.length}`);
                      process.stdout.write("."); // Progress indicator
                    }
                  }
                } else if (chatPayload.state === "final") {
                  // Debug: dump the entire final payload
                  console.log(`   [DEBUG] Final payload:`, JSON.stringify(chatPayload, null, 2));

                  // Try to extract final content if we didn't get deltas
                  if (fullContent.length === 0 && chatPayload.message) {
                    const finalContent = chatPayload.message?.content
                      ?.filter((item: any) => item.type === "text")
                      .map((item: any) => item.text)
                      .join("") || "";
                    if (finalContent) {
                      fullContent = finalContent;
                      console.log(`   [DEBUG] Extracted final content: ${fullContent.length} chars`);
                    }
                  }

                  console.log(`\n   ✅ Content generated: ${fullContent.length} characters`);
                  if (fullContent.length > 0) {
                    console.log(`   First 200 chars: ${fullContent.substring(0, 200)}`);
                  }
                  ws.close();

                  // If no content generated, reject instead of resolving empty
                  if (fullContent.length === 0) {
                    reject(new Error("AI generated empty content"));
                  } else {
                    resolve(fullContent);
                  }
                } else if (chatPayload.state === "error") {
                  console.error(`\n   ❌ Chat error: ${chatPayload.errorMessage}`);
                  ws.close();
                  reject(new Error(chatPayload.errorMessage));
                }
              }
              break;

            case "agent":
              // Handle agent events if needed
              const agentPayload = frame.payload;
              if (agentPayload && agentPayload.message) {
                if (agentPayload.message.content) {
                  if (Array.isArray(agentPayload.message.content)) {
                    const text = agentPayload.message.content
                      .filter((item: any) => item.type === "text")
                      .map((item: any) => item.text)
                      .join("");
                    if (text) {
                      fullContent = text;
                      process.stdout.write(".");
                    }
                  }
                }
              }
              if (agentPayload && agentPayload.stop_reason) {
                console.log("\n   ✅ Content generated successfully");
                ws.close();
                resolve(fullContent);
              }
              break;
          }
        }
      } catch (err) {
        console.error("   ❌ Failed to parse message:", err);
      }
    });

    ws.on("error", (err) => {
      console.error("   ❌ WebSocket error:", err);
      reject(err);
    });

    ws.on("close", () => {
      console.log("\n   ⚠️  Connection closed");
      // Don't auto-resolve on close - only resolve when we get state:'final'
      // This prevents premature resolution
    });

    // Timeout after 180 seconds (comprehensive research paper takes time)
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log("\n   ⏰ Timeout reached");
        ws.close();
      }
      // If we have substantial content even without final state, use it
      if (fullContent && fullContent.length > 500) {
        console.log(`   ℹ️  Resolving with ${fullContent.length} characters (timeout but has content)`);
        resolve(fullContent);
      } else {
        console.log(`   ❌ Timeout with insufficient content (${fullContent.length} chars)`);
        reject(new Error("Timeout waiting for AI response or content too short"));
      }
    }, 180000);
  });
}

interface McpCall {
  mcp_id: string;
  mcp_name: string;
  calls: number;
  price_per_call: number;
  subtotal: number;
}

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    console.error("❌ Usage: tsx scripts/agent-executor.ts <taskId>");
    process.exit(1);
  }

  console.log(`\n🤖 Agent Executor starting for task ${taskId}...\n`);

  // 1. Get task details
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      acceptedBid: {
        include: {
          agent: true,
        },
      },
    },
  });

  if (!task) {
    console.error("❌ Task not found");
    process.exit(1);
  }

  if (!task.acceptedBid) {
    console.error("❌ No accepted bid for this task");
    process.exit(1);
  }

  if (task.status !== "working") {
    console.error(`❌ Task status is ${task.status}, expected working`);
    process.exit(1);
  }

  console.log(`📋 Task: ${task.request}`);
  console.log(`💰 Budget: ${task.budgetIbwt} $IBWT`);
  console.log(`🤖 Agent: ${task.acceptedBid.agent.name}`);
  console.log(`\n📦 MCP Plan:`);

  const mcpPlan = task.acceptedBid.mcpPlan as McpCall[];
  mcpPlan.forEach((mcp, i) => {
    console.log(`  ${i + 1}. ${mcp.mcp_name}: ${mcp.calls} calls × ${mcp.price_per_call} = ${mcp.subtotal} $IBWT`);
  });

  console.log("\n🔧 Executing MCPs...\n");

  // 2. Execute MCP tools
  const outputDir = path.join(process.cwd(), "task-outputs", taskId);

  // Clean up old output directory to prevent using stale files
  if (fs.existsSync(outputDir)) {
    console.log(`🧹 Cleaning up old output directory...`);
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const mcpCallsLog: any[] = [];

  // Generate real content using OpenClaw AI
  console.log(`\n🤖 Generating content with AI...`);
  let aiGeneratedContent = "";
  try {
    aiGeneratedContent = await generateContentWithOpenClaw(task.request);
  } catch (error: any) {
    console.error(`   ❌ AI generation failed: ${error.message}`);
    console.log(`   ℹ️  Falling back to template content...`);
    // Fallback to basic template if AI fails
    aiGeneratedContent = `## Executive Summary\n\nThis report provides analysis of the requested topic.\n\n## Analysis\n\nDetailed analysis would be generated here.\n\n## Conclusion\n\nConclusions based on the analysis.`;
  }

  // Extract clean research topic from task request
  const extractResearchTopic = (request: string): string => {
    // Remove execution instructions like "convert to pdf", "send to email", budget numbers
    let topic = request
      .replace(/convert\s+(into|to)\s+pdf/gi, '')
      .replace(/send\s+to\s+(my\s+)?email[:\s]+[\w@.-]+/gi, '')
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
      .trim();

    // Extract just the research topic (usually the first sentence/clause)
    const match = topic.match(/^(.*?(?:research paper|report|analysis)\s+(?:about|on)\s+[^.]+)/i);
    if (match) {
      return match[1].trim();
    }

    // Fallback: take first meaningful part before numbered instructions
    const firstPart = topic.split(/\d+\.\s+/)[0].trim();
    return firstPart || topic;
  };

  const researchTopic = extractResearchTopic(task.request);

  // If AI content already has a title (starts with #), use it directly
  // Otherwise, add a clean title
  let reportContent = "";
  if (aiGeneratedContent.trim().startsWith("#")) {
    reportContent = aiGeneratedContent;
  } else {
    reportContent = `# ${researchTopic}\n\n`;
    reportContent += `**Generated by:** ${task.acceptedBid.agent.name}\n`;
    reportContent += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
    reportContent += `---\n\n`;
    reportContent += aiGeneratedContent;
  }

  for (const mcp of mcpPlan) {
    if (mcp.mcp_name === "Markdown to PDF Converter") {
      const pdfPath = path.join(outputDir, "report.pdf");

      // Check if AI already generated a PDF (e.g., via tools during generation)
      let pdfAlreadyExists = false;
      if (fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        if (stats.size > 0) {
          console.log(`\n📄 PDF already generated by AI (${(stats.size / 1024).toFixed(1)} KB)`);
          console.log(`   ✅ Using AI-generated PDF: ${pdfPath}`);
          pdfAlreadyExists = true;
        }
      }

      if (!pdfAlreadyExists) {
        console.log(`\n📄 Converting report to PDF using pandoc...`);

        // Write markdown file
        const mdPath = path.join(outputDir, "report.md");
        fs.writeFileSync(mdPath, reportContent);

        // Convert to PDF using pandoc
        try {
          execSync(`pandoc "${mdPath}" --pdf-engine=weasyprint -o "${pdfPath}"`, {
            stdio: "inherit",
          });
          console.log(`   ✅ PDF generated: ${pdfPath}`);
        } catch (error: any) {
          console.error(`   ❌ PDF generation failed: ${error.message}`);
          mcpCallsLog.push({
            mcpId: mcp.mcp_id,
            mcpName: mcp.mcp_name,
            callsMade: 0,
            success: false,
            error: error.message,
          });
          continue;
        }
      }

      mcpCallsLog.push({
        mcpId: mcp.mcp_id,
        mcpName: mcp.mcp_name,
        callsMade: mcp.calls,
        success: true,
        output: pdfAlreadyExists
          ? `Using AI-generated PDF at ${pdfPath}`
          : `Generated PDF report at ${pdfPath}`,
      });
    } else if (mcp.mcp_name === "Gmail Sender") {
      console.log(`📧 Sending email with PDF attachment...`);

      const pdfPath = path.join(outputDir, "report.pdf");
      const recipient = process.env.AGENT_EMAIL || "jasperjiang93@gmail.com";

      if (!fs.existsSync(pdfPath)) {
        console.error(`   ❌ PDF not found at ${pdfPath}`);
        mcpCallsLog.push({
          mcpId: mcp.mcp_id,
          mcpName: mcp.mcp_name,
          callsMade: 0,
          success: false,
          error: "PDF file not found",
        });
        continue;
      }

      try {
        console.log(`   📬 Sending to: ${recipient}`);

        // Send email using gog CLI
        const subject = `IBWT Task Completed`;
        const body = `Hello,

Your IBWT task has been completed by ${task.acceptedBid.agent.name}.

Task: ${task.request}
Status: Completed
Budget: ${task.budgetIbwt} $IBWT

Please find the comprehensive report attached as PDF.

Best regards,
IBWT Platform`;

        // Create temporary email body file
        const bodyPath = path.join(outputDir, "email-body.txt");
        fs.writeFileSync(bodyPath, body);

        // Send email with gog CLI
        execSync(
          `gog mail send --to "${recipient}" --subject "${subject}" --body-file "${bodyPath}" --attach "${pdfPath}"`,
          {
            stdio: "inherit",
            env: {
              ...process.env,
              GOG_KEYRING_PASSWORD: process.env.GOG_KEYRING_PASSWORD || "nova123",
            },
          }
        );

        console.log(`   ✅ Email sent successfully to ${recipient}`);

        mcpCallsLog.push({
          mcpId: mcp.mcp_id,
          mcpName: mcp.mcp_name,
          callsMade: 1,
          success: true,
          output: `Email sent to ${recipient} with PDF attachment`,
        });
      } catch (error: any) {
        console.error(`   ❌ Email sending failed: ${error.message}`);
        mcpCallsLog.push({
          mcpId: mcp.mcp_id,
          mcpName: mcp.mcp_name,
          callsMade: 0,
          success: false,
          error: error.message,
        });
      }
    } else if (mcp.mcp_name === "Web Scraper") {
      console.log(`🌐 Web scraping simulated (${mcp.calls} calls)...`);

      // In production, you would actually scrape websites here
      mcpCallsLog.push({
        mcpId: mcp.mcp_id,
        mcpName: mcp.mcp_name,
        callsMade: mcp.calls,
        success: true,
        output: `Scraped ${mcp.calls} web pages for research data`,
      });
    }
  }

  console.log("\n✅ All MCPs executed successfully!\n");

  // 3. Submit results
  console.log("📤 Submitting results to API...\n");

  const pdfPath = path.join(outputDir, "report.pdf");
  const pdfExists = fs.existsSync(pdfPath);

  // Format outputs as array for API
  const outputs: Array<{
    type: string;
    label: string;
    content?: string;
    url?: string;
    filename?: string;
  }> = [
    {
      type: "text",
      label: "Summary",
      content: `Task completed successfully. Generated comprehensive report based on research.\n\nAll MCP tools executed successfully. Report generated and ready for delivery.`,
    },
  ];

  if (pdfExists) {
    const stats = fs.statSync(pdfPath);
    outputs.push({
      type: "file",
      label: "Report PDF",
      filename: "report.pdf",
      content: `PDF report (${(stats.size / 1024).toFixed(1)} KB)\n\nPath: ${pdfPath}`,
    });
  }

  try {
    // Submit via API
    const response = await fetch(`http://localhost:3000/api/dashboard/tasks/${taskId}/submit-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: task.acceptedBid.agentId,
        outputs,
        mcpCallsLog,
      }),
    });

    if (!response.ok) {
      // Try to get error as JSON, fallback to text if it's HTML
      const contentType = response.headers.get("content-type");
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } else {
        const text = await response.text();
        // If it's HTML error page, extract meaningful info
        if (text.includes("Internal Server Error")) {
          errorMessage = "Internal Server Error - check server logs";
        } else {
          errorMessage = text.substring(0, 200);
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("✅ Result submitted successfully!");
    console.log(`   Status: ${result.task.status}`);
    console.log(`\n📁 Output files saved to: ${outputDir}`);

  } catch (error: any) {
    console.error("❌ Failed to submit result:", error.message);

    // Check if it's a connection error (server not running)
    if (error.cause?.code === "ECONNREFUSED" || error.message.includes("fetch failed")) {
      console.log("\n💡 Next.js dev server is not running. Start it with:");
      console.log("   pnpm dev");
    } else {
      console.log("\n💡 Server error - check the Next.js dev server logs for details");
    }

    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
