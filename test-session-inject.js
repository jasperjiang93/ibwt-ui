const WebSocket = require('ws');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

console.log('Testing session creation with system prompt injection...\n');

const ws = new WebSocket('ws://localhost:18789');
const pending = new Map();
const sessionKey = `agent:main:test-session-${Date.now()}`;

console.log(`Session Key: ${sessionKey}\n`);

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
    console.log(`📤 ${method}`);
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
            id: 'test',
            displayName: 'Session Test',
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
            console.log('💉 Injecting system prompt...\n');

            return request('chat.inject', {
              sessionKey: sessionKey,
              message: 'You are a helpful assistant specialized in blockchain and AI. Always be concise.',
              label: 'System',
            });
          })
          .then(() => {
            console.log('✅ System prompt injected\n');
            console.log('💬 Sending user message...\n');

            return request('chat.send', {
              sessionKey: sessionKey,
              message: 'What is IBWT?',
              idempotencyKey: generateId(),
            });
          })
          .then(() => {
            console.log('✅ Message sent, waiting for response...\n');
          })
          .catch((err) => {
            console.error('❌ Error:', err.message);
            ws.close();
          });
        break;

      case 'chat':
        const payload = frame.payload;
        if (payload.sessionKey === sessionKey) {
          if (payload.state === 'delta' && payload.message) {
            let content = "";
            if (payload.message?.content && Array.isArray(payload.message.content)) {
              content = payload.message.content
                .filter(item => item.type === "text")
                .map(item => item.text)
                .join("");
            }
            if (content) {
              process.stdout.write('\r' + content.substring(0, 100));
            }
          } else if (payload.state === 'final') {
            console.log('\n\n✅ Response complete!');
            setTimeout(() => ws.close(), 1000);
          } else if (payload.state === 'error') {
            console.error('\n❌ Chat error:', payload.errorMessage);
            ws.close();
          }
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
