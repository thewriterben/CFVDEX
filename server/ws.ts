import { WebSocketServer, WebSocket } from 'ws';

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws) => {
    ws.on('error', () => {
      // Ignore client errors
    });
  });
}

export function broadcast(wss: WebSocketServer, event: string, data: unknown): void {
  const message = JSON.stringify({ event, data });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
