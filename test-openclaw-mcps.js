/**
 * Test script to discover available MCP tools in OpenClaw
 */

const WebSocket = require('ws');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

console.log('🔍 Checking available MCP tools in OpenClaw...\n');

const ws = new WebSocket('ws://localhost:18789');
const pending = new Map();

function request(method, params) {
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

ws.on('open', () => {
  console.log('✅ Connected to OpenClaw Gateway\n');
});

ws.on('message', (data) => {
  const frame = JSON.parse(data.toString());

  if (frame.type === 'res') {
    const { resolve, reject } = pending.get(frame.id) || {};
    if (resolve && reject) {
      pending.delete(frame.id);
      if (frame.ok) {
        resolve(frame.payload);
      } else {
        reject(new Error(frame.error?.message || 'Request failed'));
      }
    }
  } else if (frame.type === 'event') {
    if (frame.event === 'connect.challenge') {
      console.log('🔐 Authenticating...\n');
      request('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'test',
          displayName: 'MCP Discovery Tool',
          version: '1.0.0',
          platform: 'node',
          mode: 'test',
        },
        caps: [],
        auth: {
          token: process.env.OPENCLAW_TOKEN || 'c4a3fb721e4dd4b0c8e74054fb78a8c59f66863c2aaeccb3',
        },
      })
        .then((helloOk) => {
          console.log('✅ Authenticated\n');
          console.log('📦 Available MCP Servers:');
          console.log(JSON.stringify(helloOk.mcp?.servers || {}, null, 2));
          console.log('\n');

          // List all available tools
          console.log('🛠️  Available Tools:\n');
          const servers = helloOk.mcp?.servers || {};

          let toolCount = 0;
          Object.entries(servers).forEach(([serverName, serverInfo]) => {
            if (serverInfo.tools && serverInfo.tools.length > 0) {
              console.log(`\n📌 ${serverName}:`);
              serverInfo.tools.forEach(tool => {
                toolCount++;
                console.log(`   ${toolCount}. ${tool.name}`);
                if (tool.description) {
                  console.log(`      → ${tool.description}`);
                }
                if (tool.inputSchema?.properties) {
                  const params = Object.keys(tool.inputSchema.properties);
                  console.log(`      Parameters: ${params.join(', ')}`);
                }
              });
            }
          });

          if (toolCount === 0) {
            console.log('⚠️  No MCP tools found. Make sure MCP servers are configured in your OpenClaw gateway.');
          } else {
            console.log(`\n\n✅ Total: ${toolCount} tools available`);
            console.log('\n💡 Example usage in IBWT:');
            console.log('   1. Update seed.ts with real MCP names');
            console.log('   2. Agents will use these MCPs to execute tasks');
            console.log('   3. OpenClaw will call the real tools and return results');
          }

          setTimeout(() => ws.close(), 1000);
        })
        .catch((err) => {
          console.error('❌ Error:', err.message);
          ws.close();
        });
    }
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.log('\n💡 Make sure OpenClaw gateway is running:');
  console.log('   openclaw gateway');
});

ws.on('close', () => {
  console.log('\n🔌 Connection closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('\n⏰ Timeout');
  ws.close();
}, 60000);
