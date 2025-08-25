import { Card } from '@/components/ui/card';

interface ConnectionStatusProps {
  networkStats: any;
  activePeers: number;
  localPeerId: string;
}

export function ConnectionStatus({ networkStats, activePeers, localPeerId }: ConnectionStatusProps) {
  const shortenPeerId = (peerId: string) => {
    return peerId.length > 8 ? `${peerId.slice(0, 8)}...` : peerId;
  };

  return (
    <div className="px-4 py-4 space-y-3">
      <Card className="bg-secondary rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Network Status</h3>
          <span className="text-xs text-muted-foreground font-mono" data-testid="text-network-id">
            {shortenPeerId(localPeerId)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-active-peers">
              {activePeers}
            </div>
            <div className="text-xs text-muted-foreground">Active Peers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success" data-testid="text-relayed-connections">
              {networkStats?.relayedConnections || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Relayed</div>
          </div>
        </div>
      </Card>

      <Card className="bg-secondary rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Relay Performance</h3>
          <div className="w-2 h-2 rounded-full bg-success"></div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-semibold text-foreground" data-testid="text-latency">
              {networkStats?.latency || '0ms'}
            </div>
            <div className="text-xs text-muted-foreground">Latency</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground" data-testid="text-bandwidth">
              {networkStats?.bandwidth || '0MB/s'}
            </div>
            <div className="text-xs text-muted-foreground">Bandwidth</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground" data-testid="text-uptime">
              {networkStats?.uptime || '0%'}
            </div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
