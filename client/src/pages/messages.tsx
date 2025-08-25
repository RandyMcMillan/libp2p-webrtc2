import { useState } from 'react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Messages() {
  const { peers, sendMessage } = useWebRTC();
  const [messageContent, setMessageContent] = useState('');
  const [selectedPeer, setSelectedPeer] = useState<string>('broadcast');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/messages'],
    refetchInterval: 2000,
  });

  const clearMessagesMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/messages'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Messages cleared",
        description: "All messages have been removed.",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;

    const targetPeerId = selectedPeer === 'broadcast' ? undefined : selectedPeer;
    sendMessage(messageContent, targetPeerId);
    
    setMessageContent('');
    toast({
      title: "Message sent",
      description: targetPeerId 
        ? `Message sent to ${targetPeerId.slice(0, 8)}...`
        : "Message broadcast to all peers",
    });
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const connectedPeers = peers.filter(peer => peer.status === 'connected');

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Send and receive P2P messages
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => clearMessagesMutation.mutate()}
            disabled={clearMessagesMutation.isPending}
            data-testid="button-clear-all-messages"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Message Composition */}
      <div className="px-4 py-4 border-b border-border">
        <Card className="bg-secondary rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Send Message</h3>
          
          <div className="space-y-3">
            <Select value={selectedPeer} onValueChange={setSelectedPeer}>
              <SelectTrigger data-testid="select-message-target">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">Broadcast to All</SelectItem>
                {connectedPeers.map(peer => (
                  <SelectItem key={peer.id} value={peer.id}>
                    {peer.id.slice(0, 16)}... ({peer.protocol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
                data-testid="input-message-compose"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageContent.trim()}
                data-testid="button-send-composed-message"
              >
                <Send size={16} />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {selectedPeer === 'broadcast' 
                ? `Broadcasting to ${connectedPeers.length} connected peers`
                : `Sending to ${selectedPeer.slice(0, 8)}...`
              }
            </div>
          </div>
        </Card>
      </div>

      {/* Message History */}
      <div className="px-4 py-4">
        <h3 className="font-semibold text-foreground mb-3">Message History</h3>
        
        {isLoading ? (
          <Card className="bg-secondary rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">Loading messages...</p>
          </Card>
        ) : messages.length === 0 ? (
          <Card className="bg-secondary rounded-lg p-6 text-center">
            <MessageCircle className="mx-auto mb-2 text-muted-foreground" size={24} />
            <p className="text-muted-foreground text-sm">No messages yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Send a message to get started
            </p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((message: any, index: number) => (
              <Card key={message.id || index} className="bg-secondary rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary text-xs" data-testid={`text-message-from-${index}`}>
                      {message.fromPeerId?.slice(0, 8)}...
                    </span>
                    {message.toPeerId && (
                      <>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-success text-xs" data-testid={`text-message-to-${index}`}>
                          {message.toPeerId.slice(0, 8)}...
                        </span>
                      </>
                    )}
                    {!message.toPeerId && (
                      <span className="text-warning text-xs">(Broadcast)</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs" data-testid={`text-message-timestamp-${index}`}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="text-foreground text-sm" data-testid={`text-message-body-${index}`}>
                  {message.content}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Type: {message.messageType || 'chat'}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
