export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export class WebRTCManager {
  private peers: Map<string, PeerConnection> = new Map();
  private localId: string;
  private onMessage: (message: any) => void;
  private onPeerStatusChange: (peerId: string, status: string) => void;

  constructor(
    localId: string,
    onMessage: (message: any) => void,
    onPeerStatusChange: (peerId: string, status: string) => void
  ) {
    this.localId = localId;
    this.onMessage = onMessage;
    this.onPeerStatusChange = onPeerStatusChange;
  }

  private createPeerConnection(): RTCPeerConnection {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    return new RTCPeerConnection(configuration);
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.createPeerConnection();
    const dataChannel = peerConnection.createDataChannel('messages');
    
    this.setupDataChannel(dataChannel, peerId);
    this.setupPeerConnection(peerConnection, peerId, dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.peers.set(peerId, {
      id: peerId,
      connection: peerConnection,
      dataChannel,
      status: 'connecting'
    });

    return offer;
  }

  async createAnswer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.createPeerConnection();
    
    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, peerId);
    };

    this.setupPeerConnection(peerConnection, peerId);

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.peers.set(peerId, {
      id: peerId,
      connection: peerConnection,
      status: 'connecting'
    });

    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(candidate);
    }
  }

  private setupPeerConnection(
    peerConnection: RTCPeerConnection,
    peerId: string,
    dataChannel?: RTCDataChannel
  ): void {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // This should be handled by the calling code to send via WebSocket
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const peer = this.peers.get(peerId);
      if (peer) {
        const status = this.mapConnectionState(peerConnection.connectionState);
        peer.status = status;
        this.onPeerStatusChange(peerId, status);

        if (status === 'disconnected' || status === 'failed') {
          this.removePeer(peerId);
        }
      }
    };
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onMessage({ ...message, fromPeerId: peerId });
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`);
    };
  }

  sendMessage(peerId: string, message: any): boolean {
    const peer = this.peers.get(peerId);
    if (peer && peer.dataChannel && peer.dataChannel.readyState === 'open') {
      peer.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcastMessage(message: any): void {
    this.peers.forEach((peer, peerId) => {
      this.sendMessage(peerId, message);
    });
  }

  removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
      this.peers.delete(peerId);
    }
  }

  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  getConnectedPeers(): PeerConnection[] {
    return Array.from(this.peers.values()).filter(peer => peer.status === 'connected');
  }

  private mapConnectionState(state: RTCPeerConnectionState): 'connecting' | 'connected' | 'disconnected' | 'failed' {
    switch (state) {
      case 'connected':
        return 'connected';
      case 'connecting':
      case 'new':
        return 'connecting';
      case 'disconnected':
        return 'disconnected';
      case 'failed':
      case 'closed':
        return 'failed';
      default:
        return 'disconnected';
    }
  }

  cleanup(): void {
    this.peers.forEach((peer) => {
      peer.connection.close();
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
    });
    this.peers.clear();
  }
}
