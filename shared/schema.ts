import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const peers = pgTable("peers", {
  id: varchar("id").primaryKey(),
  address: text("address").notNull(),
  protocol: text("protocol").notNull(),
  status: text("status").notNull(), // 'connected', 'disconnected', 'relay'
  lastSeen: timestamp("last_seen").defaultNow(),
  isRelay: boolean("is_relay").default(false),
  metadata: jsonb("metadata")
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromPeerId: text("from_peer_id").notNull(),
  toPeerId: text("to_peer_id"),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  messageType: text("message_type").notNull().default('chat') // 'chat', 'system', 'discovery'
});

export const networkStats = pgTable("network_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activePeers: text("active_peers").notNull().default('0'),
  relayedConnections: text("relayed_connections").notNull().default('0'),
  latency: text("latency").notNull().default('0ms'),
  bandwidth: text("bandwidth").notNull().default('0MB/s'),
  uptime: text("uptime").notNull().default('0%'),
  lastUpdated: timestamp("last_updated").defaultNow()
});

export const insertPeerSchema = createInsertSchema(peers).omit({
  lastSeen: true,
  metadata: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});

export const insertNetworkStatsSchema = createInsertSchema(networkStats).omit({
  id: true,
  lastUpdated: true
});

export type Peer = typeof peers.$inferSelect;
export type InsertPeer = z.infer<typeof insertPeerSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type NetworkStats = typeof networkStats.$inferSelect;
export type InsertNetworkStats = z.infer<typeof insertNetworkStatsSchema>;
