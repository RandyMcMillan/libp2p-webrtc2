import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface Peer {
  id: string;
  address: string;
  protocol: string;
  status: string;
  isRelay?: boolean;
}

interface PeerListProps {
  peers: Peer[];
  localPeerId: string;
  onRefresh: () => void;
  onConnectToPeer: (peerId: string) => void;
}

export function PeerList({ peers, localPeerId, onRefresh, onConnectToPeer }: PeerListProps) {
  const shortenPeerId = (peerId: string) => {
    return peerId.length > 8 ? `${peerId.slice(0, 8)}...` : peerId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-success';
      case 'connecting':
        return 'bg-warning';
      case 'disconnected':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'border-success';
      case 'connecting':
        return 'border-warning';
      default:
        return 'border-primary';
    }
  };

  const getStatusText = (status: string, isRelay?: boolean) => {
    if (isRelay) return 'Via Relay';
    switch (status) {
      case 'connected':
        return 'Direct';
      case 'connecting':
        return 'Connecting';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Connected Peers</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-primary text-sm font-medium p-0 h-auto"
          data-testid="button-refresh-peers"
        >
          <RefreshCw className="mr-1" size={16} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-2">
        {peers.length === 0 ? (
          <Card className="bg-secondary rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">No peers discovered yet</p>
            <p className="text-muted-foreground text-xs mt-1">Try refreshing to discover peers</p>
          </Card>
        ) : (
          peers.map((peer) => (
            <Card
              key={peer.id}
              className={`bg-secondary rounded-lg p-3 border-l-4 ${peer.id === localPeerId ? 'cursor-default' : 'cursor-pointer hover:bg-accent'} transition-colors ${getBorderColor(peer.status)}`}
              onClick={() => peer.id !== localPeerId && onConnectToPeer(peer.id)}
              data-testid={`card-peer-${peer.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(peer.status)}`}></div>
                    <span className="font-medium text-foreground font-mono text-sm" data-testid={`text-peer-id-${peer.id}`}>
                      {shortenPeerId(peer.id)}
                    </span>
                    {peer.id === localPeerId && (
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-peer-you-${peer.id}`}>
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1" data-testid={`text-peer-address-${peer.id}`}>
                    {peer.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground" data-testid={`text-peer-protocol-${peer.id}`}>
                    {peer.protocol}
                  </div>
                  <div className={`text-xs ${peer.status === 'connected' ? 'text-success' : peer.status === 'connecting' ? 'text-warning' : 'text-muted-foreground'}`}>
                    {getStatusText(peer.status, peer.isRelay)}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
