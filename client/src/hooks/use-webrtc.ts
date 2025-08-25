import { useEffect, useRef, useState } from 'react';
import { WebRTCManager } from '@/lib/webrtc-manager';
import { useWebSocket } from './use-websocket';
import { nanoid } from 'nanoid';

export function useWebRTC() {
  const [localPeerId] = useState(() => nanoid());
  const [peers, setPeers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  const handleMessage = (message: any) => {
    setMessages(prev => [message, ...prev]);
  };

  const handlePeerStatusChange = (peerId: string, status: string) => {
    setPeers(prev => prev.map(peer => 
      peer.id === peerId ? { ...peer, status } : peer
    ));
  };

  const { sendMessage: sendWebSocketMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'peer-list':
          setPeers(data.peers || []);
          break;

        case 'offer':
          handleOffer(data.fromPeerId, data.offer);
          break;

        case 'answer':
          handleAnswer(data.fromPeerId, data.answer);
          break;

        case 'ice-candidate':
          handleIceCandidate(data.fromPeerId, data.candidate);
          break;

        case 'message':
          setMessages(prev => [data.message, ...prev]);
          break;

        case 'network-stats':
          setNetworkStats(data.stats);
          break;
      }
    },
    onConnect: () => {
      // Register this peer with the signaling server
      sendWebSocketMessage({
        type: 'join',
        peerId: localPeerId,
        address: 'WebRTC Client',
        protocol: 'WebRTC',
        isRelay: false
      });
    }
  });

  useEffect(() => {
    webrtcManagerRef.current = new WebRTCManager(
      localPeerId,
      handleMessage,
      handlePeerStatusChange
    );

    return () => {
      webrtcManagerRef.current?.cleanup();
    };
  }, [localPeerId]);

  const handleOffer = async (fromPeerId: string, offer: RTCSessionDescriptionInit) => {
    if (webrtcManagerRef.current) {
      try {
        const answer = await webrtcManagerRef.current.createAnswer(fromPeerId, offer);
        sendWebSocketMessage({
          type: 'answer',
          targetPeerId: fromPeerId,
          answer
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    }
  };

  const handleAnswer = async (fromPeerId: string, answer: RTCSessionDescriptionInit) => {
    if (webrtcManagerRef.current) {
      try {
        await webrtcManagerRef.current.handleAnswer(fromPeerId, answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (fromPeerId: string, candidate: RTCIceCandidateInit) => {
    if (webrtcManagerRef.current) {
      try {
        await webrtcManagerRef.current.handleIceCandidate(fromPeerId, candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  };

  const connectToPeer = async (peerId: string) => {
    if (webrtcManagerRef.current) {
      try {
        const offer = await webrtcManagerRef.current.createOffer(peerId);
        sendWebSocketMessage({
          type: 'offer',
          targetPeerId: peerId,
          offer
        });
      } catch (error) {
        console.error('Error connecting to peer:', error);
      }
    }
  };

  const sendMessage = (content: string, targetPeerId?: string) => {
    if (targetPeerId && webrtcManagerRef.current) {
      // Try to send via WebRTC first
      const sent = webrtcManagerRef.current.sendMessage(targetPeerId, {
        type: 'chat',
        content,
        timestamp: new Date().toISOString()
      });
      
      if (!sent) {
        // Fallback to WebSocket relay
        sendWebSocketMessage({
          type: 'message',
          targetPeerId,
          content
        });
      }
    } else {
      // Broadcast via WebSocket
      sendWebSocketMessage({
        type: 'message',
        content
      });
    }
  };

  const refreshPeers = () => {
    sendWebSocketMessage({ type: 'discovery' });
  };

  return {
    localPeerId,
    peers,
    messages,
    networkStats,
    isConnected,
    connectToPeer,
    sendMessage,
    refreshPeers
  };
}
