const WebSocket = require('ws');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

console.log('Connecting to OpenClaw Gateway at ws://localhost:18789...');

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
    console.log('\n📤 Sent:', JSON.stringify(frame, null, 2));
  });
}

ws.on('open', () => {
  console.log('✅ Connected successfully!\n');
});

ws.on('message', (data) => {
  const frame = JSON.parse(data.toString());
  console.log('📨 Received:', JSON.stringify(frame, null, 2));

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
        console.log('\n🔐 Received challenge, sending connect request...');
        request('connect', {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'test',  // Use test client for development
            displayName: 'IBWT Dashboard Chat',
            version: '1.0.0',
            platform: 'web',
            mode: 'test',
          },
          caps: [],
          auth: {
            token: 'c4a3fb721e4dd4b0c8e74054fb78a8c59f66863c2aaeccb3',
          },
        })
          .then((helloOk) => {
            console.log('\n✅ Authenticated! HelloOk:', JSON.stringify(helloOk, null, 2));

            // Send test message
            setTimeout(() => {
              console.log('\n💬 Sending test message...');
              request('agent.message', {
                content: 'Hello OpenClaw! What can you help me with?'
              })
                .then((response) => {
                  console.log('\n🤖 Response:', JSON.stringify(response, null, 2));
                })
                .catch((err) => {
                  console.error('\n❌ Message error:', err.message);
                });
            }, 1000);
          })
          .catch((err) => {
            console.error('\n❌ Connect error:', err.message);
            ws.close();
          });
        break;

      case 'agent.message':
      case 'agent.response':
        console.log('\n🤖 Agent event:', frame.payload);
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
  console.log('\n⏰ Timeout, closing...');
  ws.close();
}, 30000);
