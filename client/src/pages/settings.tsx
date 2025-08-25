import { useState } from 'react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, Upload, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { localPeerId, isConnected } = useWebRTC();
  const [autoConnect, setAutoConnect] = useState(true);
  const [relayMode, setRelayMode] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const { toast } = useToast();

  const copyPeerId = () => {
    navigator.clipboard.writeText(localPeerId);
    toast({
      title: "Peer ID copied",
      description: "Your peer ID has been copied to clipboard.",
    });
  };

  const exportConfig = () => {
    const config = {
      peerId: localPeerId,
      autoConnect,
      relayMode,
      customAddress
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'libp2p-config.json';
    a.click();
    
    toast({
      title: "Configuration exported",
      description: "Your configuration has been downloaded.",
    });
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your P2P connection settings
        </p>
      </div>

      {/* Peer Information */}
      <div className="px-4 py-4">
        <Card className="bg-secondary rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Peer Information</h3>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Your Peer ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={localPeerId}
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-peer-id"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyPeerId}
                  data-testid="button-copy-peer-id"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Connection Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`}></div>
                <span className="text-sm text-foreground" data-testid="text-settings-connection-status">
                  {isConnected ? 'Connected to network' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Connection Settings */}
      <div className="px-4 pb-4">
        <Card className="bg-secondary rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Connection Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-foreground">Auto-connect to peers</Label>
                <p className="text-xs text-muted-foreground">Automatically connect to discovered peers</p>
              </div>
              <Switch
                checked={autoConnect}
                onCheckedChange={setAutoConnect}
                data-testid="switch-auto-connect"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-foreground">Enable relay mode</Label>
                <p className="text-xs text-muted-foreground">Act as a relay for other peers</p>
              </div>
              <Switch
                checked={relayMode}
                onCheckedChange={setRelayMode}
                data-testid="switch-relay-mode"
              />
            </div>

            <Separator />

            <div>
              <Label className="text-sm text-foreground">Custom relay address</Label>
              <Input
                placeholder="wss://relay.example.com/ws"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="mt-1"
                data-testid="input-custom-address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional custom relay server address
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration Management */}
      <div className="px-4 pb-4">
        <Card className="bg-secondary rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Configuration</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={exportConfig}
              data-testid="button-export-config"
            >
              <Download className="mr-2" size={16} />
              Export Configuration
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              data-testid="button-import-config"
            >
              <Upload className="mr-2" size={16} />
              Import Configuration
            </Button>
          </div>
        </Card>
      </div>

      {/* Advanced Settings */}
      <div className="px-4 pb-4">
        <Card className="bg-secondary rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Advanced</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-error border-error hover:bg-error hover:text-background"
              data-testid="button-reset-settings"
            >
              <Trash2 className="mr-2" size={16} />
              Reset All Settings
            </Button>
          </div>
        </Card>
      </div>

      {/* Info */}
      <div className="px-4 pb-4">
        <Card className="bg-secondary rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="text-primary mt-0.5" size={16} />
            <div>
              <h4 className="font-medium text-foreground text-sm">About libp2p Relay</h4>
              <p className="text-xs text-muted-foreground mt-1">
                This application demonstrates peer-to-peer networking capabilities using WebRTC 
                and relay functionality for connecting peers through intermediate nodes.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
