import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPeerSchema, insertMessageSchema, insertNetworkStatsSchema } from "@shared/schema";
import { z } from "zod";

interface WebSocketWithPeerId extends WebSocket {
  peerId?: string;
  isAlive?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for P2P signaling and relay
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Map<string, WebSocketWithPeerId>();

  // Heartbeat mechanism
  function heartbeat(this: WebSocketWithPeerId) {
    this.isAlive = true;
  }

  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketWithPeerId) => {
      if (ws.isAlive === false) {
        if (ws.peerId) {
          connectedClients.delete(ws.peerId);
          storage.updatePeerStatus(ws.peerId, 'disconnected');
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (ws: WebSocketWithPeerId) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            ws.peerId = message.peerId;
            connectedClients.set(message.peerId, ws);
            
            await storage.createPeer({
              id: message.peerId,
              address: message.address || 'unknown',
              protocol: message.protocol || 'WebRTC',
              status: 'connected',
              isRelay: message.isRelay || false
            });

            // Broadcast peer list to all clients
            broadcastPeerList();
            updateNetworkStats();
            break;

          case 'leave':
            if (ws.peerId) {
              connectedClients.delete(ws.peerId);
              await storage.updatePeerStatus(ws.peerId, 'disconnected');
              broadcastPeerList();
              updateNetworkStats();
            }
            break;

          case 'offer':
          case 'answer':
          case 'ice-candidate':
            // Relay WebRTC signaling messages
            const targetPeer = connectedClients.get(message.targetPeerId);
            if (targetPeer && targetPeer.readyState === WebSocket.OPEN) {
              targetPeer.send(JSON.stringify({
                ...message,
                fromPeerId: ws.peerId
              }));
            }
            break;

          case 'message':
            // Store and relay chat messages
            const chatMessage = await storage.createMessage({
              fromPeerId: ws.peerId!,
              toPeerId: message.targetPeerId,
              content: message.content,
              messageType: 'chat'
            });

            // Broadcast to target peer if specified, otherwise broadcast to all
            if (message.targetPeerId) {
              const target = connectedClients.get(message.targetPeerId);
              if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                  type: 'message',
                  message: chatMessage
                }));
              }
            } else {
              broadcastToAll({
                type: 'message',
                message: chatMessage
              });
            }
            break;

          case 'discovery':
            // Send current peer list to requesting client
            const peers = await storage.getActivePeers();
            ws.send(JSON.stringify({
              type: 'peer-list',
              peers: peers.filter(p => p.id !== ws.peerId)
            }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.peerId) {
        connectedClients.delete(ws.peerId);
        await storage.updatePeerStatus(ws.peerId, 'disconnected');
        broadcastPeerList();
        updateNetworkStats();
      }
    });
  });

  wss.on('close', () => {
    clearInterval(interval);
  });

  function broadcastToAll(message: any) {
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async function broadcastPeerList() {
    const peers = await storage.getActivePeers();
    broadcastToAll({
      type: 'peer-list',
      peers
    });
  }

  async function updateNetworkStats() {
    const activePeers = await storage.getActivePeers();
    const relayPeers = activePeers.filter(p => p.isRelay);
    
    await storage.updateNetworkStats({
      activePeers: activePeers.length.toString(),
      relayedConnections: (relayPeers.length * 2).toString(),
      latency: Math.floor(Math.random() * 100 + 20) + 'ms',
      bandwidth: (Math.random() * 5 + 0.5).toFixed(1) + 'MB/s',
      uptime: (Math.random() * 5 + 95).toFixed(1) + '%'
    });

    const stats = await storage.getNetworkStats();
    broadcastToAll({
      type: 'network-stats',
      stats
    });
  }

  // REST API endpoints
  app.get('/api/peers', async (req, res) => {
    try {
      const peers = await storage.getAllPeers();
      res.json(peers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch peers' });
    }
  });

  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.delete('/api/messages', async (req, res) => {
    try {
      await storage.clearMessages();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear messages' });
    }
  });

  app.get('/api/network-stats', async (req, res) => {
    try {
      const stats = await storage.getNetworkStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch network stats' });
    }
  });

  return httpServer;
}
