import { Card } from '@/components/ui/card';
import { Smartphone, Laptop, Monitor, Server } from 'lucide-react';

interface Peer {
  id: string;
  status: string;
  isRelay?: boolean;
}

interface NetworkTopologyProps {
  peers: Peer[];
  localPeerId: string;
}

export function NetworkTopology({ peers, localPeerId }: NetworkTopologyProps) {
  const connectedPeers = peers.filter(peer => peer.status === 'connected');
  const relayPeers = peers.filter(peer => peer.isRelay);

  return (
    <div className="px-4 py-4">
      <h3 className="font-semibold text-foreground mb-3">Network Topology</h3>
      <Card className="bg-secondary rounded-xl p-4 h-48 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Central Node (This Device) */}
          <div className="absolute w-12 h-12 bg-primary rounded-full flex items-center justify-center z-10">
            <Smartphone className="text-background" size={24} />
          </div>
          
          {/* Connected Peers - Position them around the center */}
          {connectedPeers.slice(0, 6).map((peer, index) => {
            const angle = (index * 60) * (Math.PI / 180); // 60 degrees apart
            const radius = 60;
            const x = 50 + (radius * Math.cos(angle)) / 100 * 50; // Convert to percentage
            const y = 50 + (radius * Math.sin(angle)) / 100 * 50;
            
            const getIcon = () => {
              if (peer.isRelay) return Server;
              return index % 3 === 0 ? Laptop : index % 3 === 1 ? Monitor : Server;
            };
            
            const Icon = getIcon();
            const isRelay = peer.isRelay;
            
            return (
              <div
                key={peer.id}
                className={`absolute w-8 h-8 ${isRelay ? 'bg-warning' : 'bg-success'} rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`
                }}
                data-testid={`node-peer-${peer.id}`}
              >
                <Icon className="text-background" size={16} />
              </div>
            );
          })}
          
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full">
            {connectedPeers.slice(0, 6).map((peer, index) => {
              const angle = (index * 60) * (Math.PI / 180);
              const radius = 60;
              const x = 50 + (radius * Math.cos(angle)) / 100 * 50;
              const y = 50 + (radius * Math.sin(angle)) / 100 * 50;
              
              return (
                <line
                  key={peer.id}
                  x1="50%"
                  y1="50%"
                  x2={`${x}%`}
                  y2={`${y}%`}
                  stroke={peer.isRelay ? "hsl(48, 96%, 53%)" : "hsl(142, 76%, 36%)"}
                  strokeWidth="2"
                  strokeDasharray={peer.isRelay ? "5,5" : "none"}
                  opacity="0.7"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          Live topology view
        </div>
        
        {/* Legend */}
        <div className="absolute top-2 left-2 space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-xs text-muted-foreground">Direct</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning"></div>
            <span className="text-xs text-muted-foreground">Relay</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
