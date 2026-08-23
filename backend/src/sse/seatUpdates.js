/**
 * Server-Sent Events (SSE) manager for live seat map synchronization
 */
const connections = new Map(); // showtimeId -> Set of express Response objects

/**
 * Handle new SSE client subscription for a showtime
 */
function handleSSEConnection(req, res) {
  const { id: showtimeId } = req.params;

  // Set SSE HTTP Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', showtimeId })}\n\n`);

  if (!connections.has(showtimeId)) {
    connections.set(showtimeId, new Set());
  }
  connections.get(showtimeId).add(res);

  // Heartbeat interval to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = connections.get(showtimeId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        connections.delete(showtimeId);
      }
    }
  });
}

/**
 * Broadcast real-time seat update to all connected clients viewing this showtime
 */
function broadcastSeatUpdate(showtimeId, payload) {
  const clients = connections.get(showtimeId);
  if (!clients || clients.size === 0) return;

  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }
}

function getActiveSubscribers(showtimeId) {
  const clients = connections.get(showtimeId);
  return clients ? clients.size : 0;
}

module.exports = {
  handleSSEConnection,
  broadcastSeatUpdate,
  getActiveSubscribers,
};
