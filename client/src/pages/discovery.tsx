import { useWebRTC } from '@/hooks/use-webrtc';
import { PeerList } from '@/components/peer-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Discovery() {
  const { peers, refreshPeers, connectToPeer } = useWebRTC();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredPeers = peers.filter(peer => 
    peer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConnectToPeer = (peerId: string) => {
    connectToPeer(peerId);
    toast({
      title: "Connecting to peer",
      description: `Attempting to connect to ${peerId.slice(0, 8)}...`,
    });
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Peer Discovery</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover and connect to nearby peers
        </p>
      </div>

      {/* Search and Refresh */}
      <div className="px-4 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search peers by ID or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-peers"
          />
        </div>

        <Button
          onClick={refreshPeers}
          className="w-full"
          variant="outline"
          data-testid="button-refresh-discovery"
        >
          <RefreshCw className="mr-2" size={16} />
          Refresh Peer List
        </Button>
      </div>

      {/* Discovery Stats */}
      <div className="px-4 mb-4">
        <Card className="bg-secondary rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary" data-testid="text-total-peers">
                {peers.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Peers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success" data-testid="text-online-peers">
                {peers.filter(p => p.status === 'connected').length}
              </div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Peer List */}
      <div className="px-4">
        <h3 className="font-semibold text-foreground mb-3">
          Available Peers {searchTerm && `(${filteredPeers.length} filtered)`}
        </h3>
        
        {filteredPeers.length === 0 ? (
          <Card className="bg-secondary rounded-lg p-6 text-center">
            <Search className="mx-auto mb-2 text-muted-foreground" size={24} />
            <p className="text-muted-foreground text-sm">
              {searchTerm ? 'No peers match your search' : 'No peers discovered yet'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {searchTerm ? 'Try a different search term' : 'Click refresh to discover peers on the network'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredPeers.map((peer) => (
              <Card
                key={peer.id}
                className="bg-secondary rounded-lg p-4 border-l-4 border-primary cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleConnectToPeer(peer.id)}
                data-testid={`card-discovery-peer-${peer.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        peer.status === 'connected' ? 'bg-success' : 
                        peer.status === 'connecting' ? 'bg-warning' : 'bg-muted-foreground'
                      }`}></div>
                      <span className="font-medium text-foreground font-mono text-sm">
                        {peer.id.slice(0, 16)}...
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Address: {peer.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Protocol: {peer.protocol}
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant={peer.status === 'connected' ? 'secondary' : 'default'}
                      disabled={peer.status === 'connecting'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectToPeer(peer.id);
                      }}
                      data-testid={`button-connect-${peer.id}`}
                    >
                      {peer.status === 'connected' ? 'Connected' : 
                       peer.status === 'connecting' ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
