import { useState } from 'react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { ConnectionStatus } from '@/components/connection-status';
import { PeerList } from '@/components/peer-list';
import { NetworkTopology } from '@/components/network-topology';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Plus, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Home() {
  const {
    localPeerId,
    peers,
    messages,
    networkStats,
    isConnected,
    connectToPeer,
    sendMessage,
    refreshPeers
  } = useWebRTC();

  const { toast } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const handleConnectToPeer = (peerId: string) => {
    connectToPeer(peerId);
    toast({
      title: "Connecting to peer",
      description: `Attempting to connect to ${peerId.slice(0, 8)}...`,
    });
  };

  const handleSendTestMessage = () => {
    if (messageContent.trim()) {
      sendMessage(messageContent);
      setMessageContent('');
      setIsMessageDialogOpen(false);
      toast({
        title: "Message sent",
        description: "Your message has been broadcast to all connected peers.",
      });
    }
  };

  const activePeers = peers.filter(peer => peer.status === 'connected').length;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">libp2p Relay</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
              <span className="text-sm text-muted-foreground" data-testid="text-connection-status">
                {isConnected ? `Connected to ${activePeers} peers` : 'Disconnected'}
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-lg"
            data-testid="button-settings"
          >
            <Settings className="text-muted-foreground" size={20} />
          </Button>
        </div>
      </div>

      {/* Connection Status Cards */}
      <ConnectionStatus
        networkStats={networkStats}
        activePeers={activePeers}
        localPeerId={localPeerId}
      />

      {/* Peer List */}
      <PeerList
        peers={peers}
        localPeerId={localPeerId}
        onRefresh={refreshPeers}
        onConnectToPeer={handleConnectToPeer}
      />

      {/* Network Topology */}
      <NetworkTopology peers={peers} localPeerId={localPeerId} />

      {/* Recent Messages */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Recent Messages</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-sm font-medium p-0 h-auto"
            data-testid="button-clear-messages"
          >
            Clear
          </Button>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {messages.length === 0 ? (
            <Card className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-muted-foreground text-sm">No messages yet</p>
            </Card>
          ) : (
            messages.slice(0, 3).map((message, index) => (
              <Card key={index} className="bg-secondary rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-primary text-xs" data-testid={`text-message-peer-${index}`}>
                    {message.fromPeerId?.slice(0, 8)}...
                  </span>
                  <span className="text-muted-foreground text-xs" data-testid={`text-message-time-${index}`}>
                    {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-foreground" data-testid={`text-message-content-${index}`}>
                  {message.content}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3">
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="w-12 h-12 bg-success hover:bg-success/90 rounded-full shadow-lg"
              data-testid="button-send-message"
            >
              <Send className="text-background" size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Test Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
                data-testid="input-message-content"
              />
              <Button 
                onClick={handleSendTestMessage}
                className="w-full"
                data-testid="button-send-test-message"
              >
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          size="icon"
          className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full shadow-lg"
          onClick={refreshPeers}
          data-testid="button-discover-peers"
        >
          <Plus className="text-background" size={20} />
        </Button>
      </div>
    </div>
  );
}
