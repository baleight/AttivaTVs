const WebSocket = require('ws');
const http = require('http');

// Configuration
const PORT = process.env.PORT || 8080;
const TV_OFFLINE_THRESHOLD = 60000; // 60 seconds timeout
const CHECK_INTERVAL = 10000; // Check every 10 seconds

// Store connected devices: tvNumber -> { ws, lastSeen, location }
const devices = new Map();
// Store connected admins
const admins = new Set();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TV-Time WebSocket Server Running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const type = url.pathname.includes('admin') ? 'admin' : 'device';
  const token = url.searchParams.get('token');
  const tvNumber = url.searchParams.get('tvNumber');

  // --- ADMIN CONNECTION ---
  if (type === 'admin') {
    // In production, validate 'token' against your backend here
    console.log('Admin connected');
    admins.add(ws);

    // Send initial state of all currently connected devices
    const deviceList = Array.from(devices.entries()).map(([num, data]) => ({
      tvNumber: num,
      location: data.location,
      connected: true,
      last_updated: new Date(data.lastSeen).toISOString()
    }));
    
    ws.send(JSON.stringify({ type: 'initial-state', devices: deviceList }));

    ws.on('close', () => {
      console.log('Admin disconnected');
      admins.delete(ws);
    });
  } 
  
  // --- DEVICE CONNECTION ---
  else if (type === 'device' && tvNumber) {
    console.log(`Device connected: TV ${tvNumber}`);
    
    // Register device
    devices.set(tvNumber, {
      ws,
      tvNumber,
      location: url.searchParams.get('location') || 'Unknown',
      lastSeen: Date.now()
    });
    
    // Notify admins
    broadcastToAdmins({
      type: 'tv-status-update',
      tv: {
        tvNumber,
        connected: true,
        last_updated: new Date().toISOString()
      }
    });

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        if (msg.type === 'heartbeat') {
          const device = devices.get(tvNumber);
          if (device) {
            device.lastSeen = Date.now();
            // If the device reports a state change (on/off), we could forward that too
            if (msg.state) {
                 broadcastToAdmins({
                    type: 'tv-status-update',
                    tv: { tvNumber, state: msg.state, connected: true }
                 });
            }
          }
        }
      } catch (e) {
        console.error('Error processing message from', tvNumber, e);
      }
    });

    ws.on('close', () => {
      console.log(`Device disconnected: TV ${tvNumber}`);
      devices.delete(tvNumber);
      broadcastToAdmins({
        type: 'tv-status-update',
        tv: {
          tvNumber,
          connected: false,
          last_updated: new Date().toISOString()
        }
      });
    });
  }
});

// Periodic check for stale connections
setInterval(() => {
  const now = Date.now();
  devices.forEach((data, tvNumber) => {
    if (now - data.lastSeen > TV_OFFLINE_THRESHOLD) {
      console.warn(`TV ${tvNumber} timed out (no heartbeat)`);
      data.ws.terminate();
      devices.delete(tvNumber);
      
      broadcastToAdmins({
        type: 'tv-status-update',
        tv: {
          tvNumber,
          connected: false,
          last_updated: new Date().toISOString()
        }
      });
    }
  });
}, CHECK_INTERVAL);

function broadcastToAdmins(data) {
  const message = JSON.stringify(data);
  admins.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(PORT, () => {
  console.log(`WebSocket Server started on port ${PORT}`);
  console.log(`- Admin Endpoint: ws://localhost:${PORT}/ws/admin`);
  console.log(`- Device Endpoint: ws://localhost:${PORT}/ws/device`);
});