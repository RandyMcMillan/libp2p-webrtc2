import { type Peer, type InsertPeer, type Message, type InsertMessage, type NetworkStats, type InsertNetworkStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Peer management
  getPeer(id: string): Promise<Peer | undefined>;
  getAllPeers(): Promise<Peer[]>;
  getActivePeers(): Promise<Peer[]>;
  createPeer(peer: InsertPeer): Promise<Peer>;
  updatePeerStatus(id: string, status: string): Promise<void>;
  removePeer(id: string): Promise<void>;

  // Message management
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(): Promise<Message[]>;
  getMessagesByPeer(peerId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;

  // Network stats
  getNetworkStats(): Promise<NetworkStats | undefined>;
  updateNetworkStats(stats: InsertNetworkStats): Promise<NetworkStats>;
}

export class MemStorage implements IStorage {
  private peers: Map<string, Peer>;
  private messages: Map<string, Message>;
  private networkStats: NetworkStats | undefined;

  constructor() {
    this.peers = new Map();
    this.messages = new Map();
    this.networkStats = undefined;
  }

  async getPeer(id: string): Promise<Peer | undefined> {
    return this.peers.get(id);
  }

  async getAllPeers(): Promise<Peer[]> {
    return Array.from(this.peers.values());
  }

  async getActivePeers(): Promise<Peer[]> {
    return Array.from(this.peers.values()).filter(peer => peer.status === 'connected');
  }

  async createPeer(insertPeer: InsertPeer): Promise<Peer> {
    const peer: Peer = {
      ...insertPeer,
      lastSeen: new Date(),
      metadata: null
    };
    this.peers.set(peer.id, peer);
    return peer;
  }

  async updatePeerStatus(id: string, status: string): Promise<void> {
    const peer = this.peers.get(id);
    if (peer) {
      peer.status = status;
      peer.lastSeen = new Date();
      this.peers.set(id, peer);
    }
  }

  async removePeer(id: string): Promise<void> {
    this.peers.delete(id);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
  }

  async getMessagesByPeer(peerId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.fromPeerId === peerId || msg.toPeerId === peerId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async clearMessages(): Promise<void> {
    this.messages.clear();
  }

  async getNetworkStats(): Promise<NetworkStats | undefined> {
    return this.networkStats;
  }

  async updateNetworkStats(stats: InsertNetworkStats): Promise<NetworkStats> {
    const networkStats: NetworkStats = {
      ...stats,
      id: randomUUID(),
      lastUpdated: new Date()
    };
    this.networkStats = networkStats;
    return networkStats;
  }
}

export const storage = new MemStorage();
