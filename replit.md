# Overview

This is a peer-to-peer (P2P) communication application built as a mobile-first web app. The application enables direct communication between peers using WebRTC for real-time data channels and WebSocket signaling for connection establishment. It features a modern dark-themed interface with network topology visualization, peer discovery, messaging capabilities, and connection management.

The app serves as a decentralized communication platform where users can discover nearby peers, establish direct connections, exchange messages, and monitor network performance metrics in real-time.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool and development server.

**UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design system uses a dark theme with CSS custom properties for consistent theming.

**Routing**: Wouter for client-side routing with four main pages - Home (network overview), Discovery (peer finding), Messages (communication), and Settings (configuration).

**State Management**: React Query (TanStack Query) for server state management and custom hooks for WebRTC and WebSocket connections. Local component state is managed with React hooks.

**Mobile-First Design**: Responsive layout optimized for mobile devices with a maximum width container and bottom navigation pattern.

## Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js, serving both API endpoints and static assets.

**WebSocket Integration**: WebSocket server for P2P signaling and real-time communication, handling peer discovery, connection establishment, and message relay.

**Development Setup**: Vite middleware integration for hot module replacement and development server proxy.

## Data Storage Solutions

**Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions for peers, messages, and network statistics.

**In-Memory Storage**: Fallback memory storage implementation for development and testing scenarios.

**Schema Design**: Three main entities - peers (connection info), messages (communication records), and network_stats (performance metrics).

## Real-Time Communication

**WebRTC Implementation**: Custom WebRTCManager class handling peer connections, data channels, and ICE candidate exchange for direct peer-to-peer communication.

**Signaling Server**: WebSocket-based signaling for WebRTC offer/answer exchange and peer discovery coordination.

**Connection Management**: Automatic reconnection logic, heartbeat mechanisms, and peer status tracking.

## Authentication and Authorization

**No Authentication**: Currently operates as an open P2P network without user authentication or access controls.

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL-compatible serverless database using `@neondatabase/serverless` adapter
- **Connection Pooling**: Database connection management through environment variable configuration

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible React components (`@radix-ui/*` packages)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating variant-based component APIs

## Development Tools
- **Vite**: Build tool and development server with React plugin
- **TypeScript**: Type safety and development tooling
- **PostCSS**: CSS processing with Tailwind integration
- **ESBuild**: Fast JavaScript bundling for production builds

## Real-Time Communication
- **WebSocket (ws)**: Native WebSocket implementation for signaling server
- **WebRTC**: Browser-native APIs for peer-to-peer data channels and media streaming

## Utility Libraries
- **Nanoid**: Unique ID generation for peer identification
- **Date-fns**: Date manipulation and formatting utilities
- **Zod**: Schema validation integrated with Drizzle ORM
- **React Hook Form**: Form state management with validation resolvers