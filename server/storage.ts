import { type Peer, type InsertPeer, type Message, type InsertMessage, type NetworkStats, type InsertNetworkStats, peers, messages, networkStats } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getPeer(id: string): Promise<Peer | undefined> {
    const [peer] = await db.select().from(peers).where(eq(peers.id, id));
    return peer || undefined;
  }

  async getAllPeers(): Promise<Peer[]> {
    return await db.select().from(peers);
  }

  async getActivePeers(): Promise<Peer[]> {
    return await db.select().from(peers).where(eq(peers.status, 'connected'));
  }

  async createPeer(insertPeer: InsertPeer): Promise<Peer> {
    const [peer] = await db
      .insert(peers)
      .values(insertPeer)
      .returning();
    return peer;
  }

  async updatePeerStatus(id: string, status: string): Promise<void> {
    await db
      .update(peers)
      .set({ status, lastSeen: new Date() })
      .where(eq(peers.id, id));
  }

  async removePeer(id: string): Promise<void> {
    await db.delete(peers).where(eq(peers.id, id));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.timestamp));
  }

  async getMessagesByPeer(peerId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.fromPeerId, peerId))
      .orderBy(desc(messages.timestamp));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async clearMessages(): Promise<void> {
    await db.delete(messages);
  }

  async getNetworkStats(): Promise<NetworkStats | undefined> {
    const [stats] = await db
      .select()
      .from(networkStats)
      .orderBy(desc(networkStats.lastUpdated))
      .limit(1);
    return stats || undefined;
  }

  async updateNetworkStats(stats: InsertNetworkStats): Promise<NetworkStats> {
    const [networkStat] = await db
      .insert(networkStats)
      .values(stats)
      .returning();
    return networkStat;
  }
}

export const storage = new DatabaseStorage();
