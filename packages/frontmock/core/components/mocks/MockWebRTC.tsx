/**
 * MockWebRTC - Mock WebRTC API for testing
 *
 * Simulates peer-to-peer connections without actual network communication
 */

export interface MockRTCPeerConnectionInstance {
  localDescription: RTCSessionDescription | null
  remoteDescription: RTCSessionDescription | null
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  iceGatheringState: RTCIceGatheringState
  signalingState: RTCSignalingState
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null
  oniceconnectionstatechange: ((event: Event) => void) | null
  onconnectionstatechange: ((event: Event) => void) | null
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null
  ontrack: ((event: RTCTrackEvent) => void) | null
  onnegotiationneeded: ((event: Event) => void) | null
  createOffer: ReturnType<typeof vi.fn>
  createAnswer: ReturnType<typeof vi.fn>
  setLocalDescription: ReturnType<typeof vi.fn>
  setRemoteDescription: ReturnType<typeof vi.fn>
  addIceCandidate: ReturnType<typeof vi.fn>
  addTrack: ReturnType<typeof vi.fn>
  removeTrack: ReturnType<typeof vi.fn>
  createDataChannel: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

export interface MockDataChannelInstance {
  label: string
  readyState: RTCDataChannelState
  onopen: ((event: Event) => void) | null
  onclose: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: Event) => void) | null
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

export interface MockWebRTCReturn {
  peerConnections: MockRTCPeerConnectionInstance[]
  dataChannels: MockDataChannelInstance[]
  getLastPeerConnection: () => MockRTCPeerConnectionInstance | undefined
  getLastDataChannel: () => MockDataChannelInstance | undefined
  triggerIceCandidate: (candidate: RTCIceCandidateInit, instance?: MockRTCPeerConnectionInstance) => void
  triggerConnectionStateChange: (state: RTCPeerConnectionState, instance?: MockRTCPeerConnectionInstance) => void
  triggerTrack: (track: MediaStreamTrack, streams: MediaStream[], instance?: MockRTCPeerConnectionInstance) => void
  triggerDataChannelMessage: (data: any, channel?: MockDataChannelInstance) => void
  openDataChannel: (channel?: MockDataChannelInstance) => void
  cleanup: () => void
}

/**
 * Sets up mock for WebRTC API
 *
 * @example
 * ```typescript
 * import { setupMockWebRTC } from '@ux.qa/frontmock'
 *
 * const { getLastPeerConnection, triggerConnectionStateChange, cleanup } = setupMockWebRTC()
 *
 * render(<VideoCallComponent />)
 *
 * // User initiates call
 * await user.click(screen.getByRole('button', { name: /start call/i }))
 *
 * const pc = getLastPeerConnection()
 * expect(pc?.createOffer).toHaveBeenCalled()
 *
 * // Simulate connection established
 * triggerConnectionStateChange('connected')
 *
 * // Verify call is active
 * expect(screen.getByText('Connected')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockWebRTC(): MockWebRTCReturn {
  const peerConnections: MockRTCPeerConnectionInstance[] = []
  const dataChannels: MockDataChannelInstance[] = []
  let offerCounter = 0
  let answerCounter = 0

  const createMockDataChannel = (label: string): MockDataChannelInstance => {
    const channel: MockDataChannelInstance = {
      label,
      readyState: 'connecting',
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      send: vi.fn((data: any) => {
        if (channel.readyState !== 'open') {
          throw new Error('Data channel is not open')
        }
      }),
      close: vi.fn(() => {
        channel.readyState = 'closed'
        channel.onclose?.(new Event('close'))
      }),
    }
    dataChannels.push(channel)
    return channel
  }

  class MockRTCPeerConnectionClass implements Partial<RTCPeerConnection> {
    localDescription: RTCSessionDescription | null = null
    remoteDescription: RTCSessionDescription | null = null
    currentLocalDescription: RTCSessionDescription | null = null
    currentRemoteDescription: RTCSessionDescription | null = null
    pendingLocalDescription: RTCSessionDescription | null = null
    pendingRemoteDescription: RTCSessionDescription | null = null
    connectionState: RTCPeerConnectionState = 'new'
    iceConnectionState: RTCIceConnectionState = 'new'
    iceGatheringState: RTCIceGatheringState = 'new'
    signalingState: RTCSignalingState = 'stable'
    canTrickleIceCandidates: boolean | null = true
    sctp: RTCSctpTransport | null = null

    onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any) | null = null
    oniceconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null = null
    onicegatheringstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null = null
    onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null = null
    ondatachannel: ((this: RTCPeerConnection, ev: RTCDataChannelEvent) => any) | null = null
    ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null = null
    onnegotiationneeded: ((this: RTCPeerConnection, ev: Event) => any) | null = null
    onsignalingstatechange: ((this: RTCPeerConnection, ev: Event) => any) | null = null
    onicecandidateerror: ((this: RTCPeerConnection, ev: Event) => any) | null = null

    createOffer = vi.fn(async (options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> => {
      offerCounter++
      return {
        type: 'offer',
        sdp: `v=0\r\no=- ${offerCounter} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n`,
      }
    })

    createAnswer = vi.fn(async (options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> => {
      answerCounter++
      return {
        type: 'answer',
        sdp: `v=0\r\no=- ${answerCounter} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n`,
      }
    })

    setLocalDescription = vi.fn(async (description?: RTCLocalSessionDescriptionInit) => {
      if (description) {
        this.localDescription = new RTCSessionDescription(description)
      }
      this.signalingState = description?.type === 'offer' ? 'have-local-offer' : 'stable'

      // Simulate ICE gathering
      this.iceGatheringState = 'gathering'
      setTimeout(() => {
        this.iceGatheringState = 'complete'
        // Trigger null candidate to signal gathering complete
        this.onicecandidate?.({ candidate: null } as RTCPeerConnectionIceEvent)
      }, 0)
    })

    setRemoteDescription = vi.fn(async (description: RTCSessionDescriptionInit) => {
      this.remoteDescription = new RTCSessionDescription(description)
      this.signalingState = description.type === 'offer' ? 'have-remote-offer' : 'stable'
    })

    addIceCandidate = vi.fn(async (candidate?: RTCIceCandidateInit | RTCIceCandidate) => {
      // Accept the candidate
    })

    addTrack = vi.fn((track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender => {
      setTimeout(() => {
        this.onnegotiationneeded?.(new Event('negotiationneeded'))
      }, 0)
      return {
        track,
        transport: null,
        dtmf: null,
        getParameters: () => ({} as RTCRtpSendParameters),
        setParameters: async () => {},
        replaceTrack: async () => {},
        getStats: async () => new Map(),
        setStreams: () => {},
      } as RTCRtpSender
    })

    removeTrack = vi.fn((sender: RTCRtpSender) => {
      // Remove the track
    })

    createDataChannel = vi.fn((label: string, options?: RTCDataChannelInit): RTCDataChannel => {
      const channel = createMockDataChannel(label)
      return channel as unknown as RTCDataChannel
    })

    getReceivers = vi.fn((): RTCRtpReceiver[] => [])
    getSenders = vi.fn((): RTCRtpSender[] => [])
    getTransceivers = vi.fn((): RTCRtpTransceiver[] => [])
    getConfiguration = vi.fn((): RTCConfiguration => ({}))
    setConfiguration = vi.fn()
    getStats = vi.fn(async (): Promise<RTCStatsReport> => new Map())
    restartIce = vi.fn()

    close = vi.fn(() => {
      this.connectionState = 'closed'
      this.iceConnectionState = 'closed'
      this.signalingState = 'closed'
      this.onconnectionstatechange?.(new Event('connectionstatechange'))
    })

    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn(() => true)

    constructor(configuration?: RTCConfiguration) {
      peerConnections.push(this as any)
    }
  }

  const originalRTCPeerConnection = global.RTCPeerConnection
  const originalRTCSessionDescription = global.RTCSessionDescription

  // Install mocks
  global.RTCPeerConnection = MockRTCPeerConnectionClass as any

  // Mock RTCSessionDescription if not available
  if (!global.RTCSessionDescription) {
    global.RTCSessionDescription = class {
      readonly type: RTCSdpType
      readonly sdp: string
      constructor(init: RTCSessionDescriptionInit) {
        this.type = init.type!
        this.sdp = init.sdp || ''
      }
      toJSON() {
        return { type: this.type, sdp: this.sdp }
      }
    } as any
  }

  const getLastPeerConnection = () => {
    return peerConnections[peerConnections.length - 1]
  }

  const getLastDataChannel = () => {
    return dataChannels[dataChannels.length - 1]
  }

  const triggerIceCandidate = (
    candidateInit: RTCIceCandidateInit,
    instance?: MockRTCPeerConnectionInstance
  ) => {
    const pc = instance ?? getLastPeerConnection()
    if (!pc) {
      throw new Error('No RTCPeerConnection instance found')
    }

    const event = {
      candidate: {
        ...candidateInit,
        toJSON: () => candidateInit,
      },
    } as RTCPeerConnectionIceEvent

    pc.onicecandidate?.(event)
  }

  const triggerConnectionStateChange = (
    state: RTCPeerConnectionState,
    instance?: MockRTCPeerConnectionInstance
  ) => {
    const pc = instance ?? getLastPeerConnection()
    if (!pc) {
      throw new Error('No RTCPeerConnection instance found')
    }

    pc.connectionState = state

    // Also update ICE connection state
    const iceStateMap: Record<RTCPeerConnectionState, RTCIceConnectionState> = {
      new: 'new',
      connecting: 'checking',
      connected: 'connected',
      disconnected: 'disconnected',
      failed: 'failed',
      closed: 'closed',
    }
    pc.iceConnectionState = iceStateMap[state]

    pc.onconnectionstatechange?.(new Event('connectionstatechange'))
    pc.oniceconnectionstatechange?.(new Event('iceconnectionstatechange'))
  }

  const triggerTrack = (
    track: MediaStreamTrack,
    streams: MediaStream[],
    instance?: MockRTCPeerConnectionInstance
  ) => {
    const pc = instance ?? getLastPeerConnection()
    if (!pc) {
      throw new Error('No RTCPeerConnection instance found')
    }

    const event = {
      track,
      streams,
      receiver: { track },
      transceiver: { receiver: { track } },
    } as unknown as RTCTrackEvent

    pc.ontrack?.(event)
  }

  const triggerDataChannelMessage = (data: any, channel?: MockDataChannelInstance) => {
    const ch = channel ?? getLastDataChannel()
    if (!ch) {
      throw new Error('No DataChannel instance found')
    }

    const event = new MessageEvent('message', { data })
    ch.onmessage?.(event)
  }

  const openDataChannel = (channel?: MockDataChannelInstance) => {
    const ch = channel ?? getLastDataChannel()
    if (!ch) {
      throw new Error('No DataChannel instance found')
    }

    ch.readyState = 'open'
    ch.onopen?.(new Event('open'))
  }

  const cleanup = () => {
    // Close all peer connections
    peerConnections.forEach((pc) => pc.close())
    peerConnections.length = 0

    // Close all data channels
    dataChannels.forEach((ch) => ch.close())
    dataChannels.length = 0

    // Restore originals
    global.RTCPeerConnection = originalRTCPeerConnection
    if (originalRTCSessionDescription) {
      global.RTCSessionDescription = originalRTCSessionDescription
    }
  }

  return {
    peerConnections,
    dataChannels,
    getLastPeerConnection,
    getLastDataChannel,
    triggerIceCandidate,
    triggerConnectionStateChange,
    triggerTrack,
    triggerDataChannelMessage,
    openDataChannel,
    cleanup,
  }
}

/**
 * RTCPeerConnection states for convenience
 */
export const RTCConnectionState = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed',
} as const

/**
 * ICE connection states
 */
export const RTCIceState = {
  NEW: 'new',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed',
} as const

/**
 * Common STUN/TURN server configurations
 */
export const RTCServerConfig = {
  googleStun: { urls: 'stun:stun.l.google.com:19302' },
  cloudflareStun: { urls: 'stun:stun.cloudflare.com:3478' },
} as const
