/**
 * Test script to verify OpenClaw delta message format
 * Run this to see if delta contains incremental chunks or full accumulated message
 */

const WebSocket = require('ws');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

console.log('🧪 Testing OpenClaw Delta Format...\n');

const ws = new WebSocket('ws://localhost:18789');
const pending = new Map();
let messageChunks = [];

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
  console.log('✅ Connected\n');
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
    switch (frame.event) {
      case 'connect.challenge':
        console.log('🔐 Authenticating...\n');
        request('connect', {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'delta-test',
            displayName: 'Delta Test',
            version: '1.0.0',
            platform: 'node',
            mode: 'test',
          },
          caps: [],
          auth: {
            token: 'c4a3fb721e4dd4b0c8e74054fb78a8c59f66863c2aaeccb3',
          },
        })
          .then(() => {
            console.log('✅ Authenticated\n');
            console.log('💬 Asking a question to test streaming...\n');

            return request('chat.send', {
              sessionKey: 'agent:main:delta-test',
              message: 'Write a short paragraph about cats.',
              idempotencyKey: generateId(),
            });
          })
          .then(() => {
            console.log('✅ Message sent, watching for deltas...\n');
          })
          .catch((err) => {
            console.error('❌ Error:', err.message);
            ws.close();
          });
        break;

      case 'chat':
        const payload = frame.payload;

        if (payload.state === 'delta' && payload.message) {
          let content = '';
          if (typeof payload.message === 'string') {
            content = payload.message;
          } else if (payload.message?.content) {
            if (Array.isArray(payload.message.content)) {
              content = payload.message.content
                .filter((item) => item.type === 'text')
                .map((item) => item.text)
                .join('');
            } else if (typeof payload.message.content === 'string') {
              content = payload.message.content;
            }
          }

          messageChunks.push(content);

          console.log(`\n📨 Delta #${messageChunks.length}:`);
          console.log(`   Length: ${content.length} chars`);
          console.log(`   Content: "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`);

          if (messageChunks.length > 1) {
            const prev = messageChunks[messageChunks.length - 2];
            const isIncremental = content.startsWith(prev);
            const isChunk = !content.includes(prev.substring(0, 20));

            console.log(`   🔍 Analysis:`);
            console.log(`      - Is accumulated? ${isIncremental ? 'YES ✓' : 'NO'}`);
            console.log(`      - Is chunk only? ${isChunk ? 'YES ✓' : 'NO'}`);

            if (isIncremental) {
              const newPart = content.substring(prev.length);
              console.log(`      - New part: "${newPart}"`);
            }
          }
        } else if (payload.state === 'final') {
          console.log('\n\n✅ Response complete!');
          console.log(`\n📊 Summary:`);
          console.log(`   Total deltas received: ${messageChunks.length}`);

          if (messageChunks.length > 0) {
            console.log(`\n🔬 Conclusion:`);
            if (messageChunks.length > 1) {
              const isAccumulated = messageChunks[messageChunks.length - 1].startsWith(messageChunks[0]);
              if (isAccumulated) {
                console.log('   ✅ OpenClaw sends ACCUMULATED messages (each delta contains full message so far)');
                console.log('   → Frontend should REPLACE content, not append');
              } else {
                console.log('   ✅ OpenClaw sends INCREMENTAL chunks');
                console.log('   → Frontend should APPEND content, not replace');
              }
            } else {
              console.log('   ⚠️  Only one delta received, cannot determine format');
            }
          }

          setTimeout(() => ws.close(), 1000);
        } else if (payload.state === 'error') {
          console.error('\n❌ Chat error:', payload.errorMessage);
          ws.close();
        }
        break;
    }
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('\n🔌 Connection closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('\n⏰ Timeout');
  ws.close();
}, 60000);
