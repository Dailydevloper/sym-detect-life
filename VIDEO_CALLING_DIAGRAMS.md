# Video Calling - Visual Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │  VideoCall Page  │────────►│  VideoCall Comp  │                  │
│  │ (Room Init)      │         │ (UI & Controls)  │                  │
│  └──────────────────┘         └────────┬─────────┘                  │
│                                        │                             │
│  ┌──────────────────────────────────────┴──────────────────────┐    │
│  │              useWebRTC Hook                                 │    │
│  │  ┌────────────────────────────────────────────────────┐    │    │
│  │  │ • initLocalStream()                                │    │    │
│  │  │ • createPeerConnection()                           │    │    │
│  │  │ • toggleMic() / toggleCamera()                     │    │    │
│  │  │ • endCall()                                        │    │    │
│  │  │ • State: localStream, remoteStream, isConnected   │    │    │
│  │  └────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────┐      ┌─────────────────────────┐     │
│  │  Socket.io Events       │      │  REST API Calls         │     │
│  │  • join-room            │      │  • POST /room           │     │
│  │  • offer/answer/ice     │      │  • POST /start          │     │
│  │  • user-joined/left     │      │  • POST /end/:callId    │     │
│  └──────────┬──────────────┘      └──────────┬──────────────┘     │
│             │                                  │                     │
└─────────────┼──────────────────────────────────┼─────────────────────┘
              │                                  │
              │ WebSocket (Socket.io)            │ HTTPS/HTTP
              │                                  │
┌─────────────┼──────────────────────────────────┼─────────────────────┐
│             │                   BACKEND                             │
│             ▼                                  ▼                     │
│  ┌──────────────────────┐      ┌──────────────────────┐             │
│  │  Socket.io Handlers  │      │  Express Routes      │             │
│  │  • join-room         │      │  • Generate Room     │             │
│  │  • offer/answer      │      │  • Start Call        │             │
│  │  • ice-candidate     │      │  • End Call          │             │
│  │  • leave-room        │      │  • History           │             │
│  └──────────────────────┘      └──────────┬───────────┘             │
│                                          │                          │
│  ┌────────────────────────────────────────┴──────────────────┐     │
│  │              Express App (server.ts)                      │     │
│  │  • CORS configured                                        │     │
│  │  • JWT middleware                                         │     │
│  │  • WebSocket server with Socket.io                       │     │
│  │  • Route handlers                                         │     │
│  └──────────────────────┬───────────────────────────────────┘     │
│                         │                                          │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          │ PostgreSQL Connection
                          │
              ┌───────────▼─────────────┐
              │   PostgreSQL Database   │
              ├─────────────────────────┤
              │ Table: video_calls      │
              │ • id (UUID)             │
              │ • appointment_id        │
              │ • initiator_id          │
              │ • status                │
              │ • started_at            │
              │ • ended_at              │
              │ • duration_seconds      │
              │ • recording_url         │
              └─────────────────────────┘
```

## WebRTC Call Establishment Flow

```
DOCTOR                          SIGNALING SERVER                    PATIENT
(Browser 1)                                                    (Browser 2)
  │                                                              │
  │                                                              │
  │  ┌─ User navigates to video call page                      │
  │  │                                                          │
  ├──┤ POST /room + appointmentId                              │
  │  │ ◄────────────────────────────────────────────►          │
  │  │ Response: roomId = "appointment-123"                    │
  │  │                                                          │
  │  ├─ socket.io connects                                      ├─ User joins call
  │  │ ◄──────────────────────────────────────────────────────►  │
  │  │                                                          │ ├─ socket.io connects
  │  │                                                          │ │
  │  ├─ emit("join-room", {roomId, userId})                   │
  │  │ ◄──────────────────────────────────────────────────────►  │
  │  │                                                          │ ├─ emit("join-room")
  │  │                                                          │
  │  │◄──── SIGNALING SERVER broadcasts ────────────────────────│
  │  │ "user-joined" to others in room                          │
  │  │
  │  ├─ Create RTCPeerConnection                                │
  │  │                                                          │
  │  ├─ Add local media tracks                                 │
  │  │ • Audio (microphone)                                    │
  │  │ • Video (camera)                                        │
  │  │                                                          │
  │  ├─ pc.createOffer()                                        │
  │  │ ◄─────────────────────────────────────────────────────►
  │  │ emit("offer", {roomId, offer: sdpOffer})              │
  │  │                                                          │
  │  │◄─ Remote receives offer                                  │
  │  │   • Create RTCPeerConnection                            │
  │  │   • Add local media tracks                              │
  │  │   • setRemoteDescription(offer)                         │
  │  │   • createAnswer()                                      │
  │  │   • emit("answer", {roomId, answer})                    │
  │  │
  │  ├─ setRemoteDescription(answer)                            │
  │  │                                                          │
  │  ├─ ICE Candidates Exchange                                 │
  │  │ ◄─────────────────────────────────────────────────────►
  │  │ Continuous: emit("ice-candidate", ...)                  │
  │  │                                                          │
  │  ├─ ✅ Connection Established!                             │
  │  │ • pc.connectionState = "connected"                      │
  │  │ • Remote stream received via pc.ontrack                 │
  │  │ • Both see video                                        │
  │  │                                                          │
  │  ├─ 🎥 Active Video Call                                   │
  │  │ • Local stream sent continuously                        │
  │  │ • Remote stream displayed                               │
  │  │ • Can toggle mic/camera                                 │
  │  │ • Duration timer running                                │
  │  │                                                          │
  │  ├─ User clicks "End Call"                                  │
  │  │ • emit("user-left", {roomId, userId})                   │
  │  │ • POST /end/:callId {duration}                          │
  │  │ • pc.close()                                            │
  │  │ • Stop all tracks                                       │
  │  │
  │  │◄─ SIGNALING SERVER broadcasts ────────────────────────────│
  │  │ "user-left" to others in room                            │
  │  │
  │  │                                                          ├─ Receives "user-left"
  │  │                                                          │ ├─ pc.close()
  │  │                                                          │ ├─ Stop tracks
  │  │                                                          │ └─ Show "call ended"
  │  │
  │  └─ Navigate back to appointments
  │
```

## Component Hierarchy

```
App
├── Router
│   ├── Routes
│   │   ├── /appointments
│   │   │   └── Appointments Page
│   │   │       └── [Appointment List]
│   │   │           └── [Video Call Button] ◄─── Initiates call
│   │   │
│   │   ├── /video-call/:appointmentId
│   │   │   └── VideoCall Page (VideoCall.tsx)
│   │   │       ├── Room initialization
│   │   │       ├── Call start trigger
│   │   │       └── VideoCall Component (VideoCall.tsx)
│   │   │           ├── Video Grid
│   │   │           │   ├── Local Video Ref
│   │   │           │   └── Remote Video Ref
│   │   │           ├── Call Controls
│   │   │           │   ├── Mic Toggle
│   │   │           │   ├── Camera Toggle
│   │   │           │   ├── End Call Button
│   │   │           │   └── Duration Timer
│   │   │           └── Connection Status
│   │   │               └── Indicator (connected/connecting)
│   │   │
│   │   └── [Other routes...]
│   │
│   └── [Nested components...]
│
├── Hooks
│   ├── useWebRTC() ◄─── Core WebRTC logic
│   │   ├── State management
│   │   ├── Media stream initialization
│   │   ├── Peer connection creation
│   │   └── Socket.io signaling
│   │
│   ├── useAuth()
│   ├── useToast()
│   └── [Other hooks...]
│
└── Providers
    └── [Auth, Toast, etc...]
```

## Data Flow: Video Call Setup

```
User Action: "Click Video Call Button"
  │
  ├─► Page loads with appointmentId
  │
  ├─► POST /api/video-calls/room
  │   └─► Server validates appointment
  │       └─► Returns roomId
  │
  ├─► VideoCall component mounts
  │   │
  │   ├─► useWebRTC hook initializes
  │   │   │
  │   │   ├─► getUserMedia()
  │   │   │   ├─► Try: HD constraints (1280x720, stereo)
  │   │   │   └─► Fallback: Basic constraints (true, true)
  │   │   │
  │   │   ├─► setLocalStream()
  │   │   │   └─► localVideoRef.srcObject = localStream
  │   │   │
  │   │   ├─► socket.io connects
  │   │   │   └─► emit("join-room", {roomId, userId})
  │   │   │
  │   │   ├─► Receive "user-joined" event
  │   │   │   └─► createPeerConnection()
  │   │   │       ├─► Add local tracks
  │   │   │       ├─► createOffer()
  │   │   │       └─► emit("offer", {...})
  │   │   │
  │   │   ├─► Receive "offer" or "answer" events
  │   │   │   └─► Add remote tracks
  │   │   │
  │   │   ├─► Exchange ICE candidates
  │   │   │   └─► pc.onicecandidate handler
  │   │   │
  │   │   └─► Connection established
  │   │       ├─► pc.onconnectionstatechange = "connected"
  │   │       ├─► pc.ontrack (receives remote stream)
  │   │       └─► setRemoteStream()
  │   │           └─► remoteVideoRef.srcObject = remoteStream
  │   │
  │   └─► Render video component
  │       ├─► Show local video
  │       ├─► Show remote video
  │       └─► Show controls
  │
  └─► Video call active
```

## State Transitions

```
Call Lifecycle: State Transitions

INITIALIZATION
│
├─► RTCPeerConnection.connectionState = "new"
│   └─► No connection yet
│       └─► Display: "Initializing..."
│
├─► RTCPeerConnection.connectionState = "connecting"
│   └─► Connection in progress
│       ├─► ICE gathering
│       ├─► Offer/Answer exchange
│       └─► Display: "Connecting..."
│
├─► RTCPeerConnection.connectionState = "connected"
│   └─► Connection established ✅
│       ├─► Media flowing both directions
│       ├─► Remote stream received
│       └─► Display: "Connected" (green indicator)
│
ACTIVE CALL (Various states possible)
│
├─► Audio enabled/disabled
│   └─► User clicks mic toggle
│       └─► track.enabled = !track.enabled
│
├─► Video enabled/disabled
│   └─► User clicks camera toggle
│       └─► track.enabled = !track.enabled
│
├─► Duration tracking
│   └─► Increment timer every 1 second
│       └─► Display: MM:SS
│
TERMINATION
│
├─► RTCPeerConnection.connectionState = "disconnected"
│   └─► Temporary connection loss
│       └─► Auto-reconnect attempt
│
├─► RTCPeerConnection.connectionState = "failed"
│   └─► Connection failed
│       └─► Display error, option to retry
│
├─► RTCPeerConnection.connectionState = "closed"
│   └─► User ended call or connection was closed
│       ├─► Stop all tracks
│       ├─► Close peer connection
│       ├─► POST /end/{callId}
│       └─► Navigate away
│
└─► Call ended
    └─► Record in database
        └─► Display summary
```

## Event Sequence Diagram

```
DOCTOR                              BACKEND                           PATIENT
(Browser)                        (Node.js)                          (Browser)
  │                                  │                                  │
  │  1. Page Load / Video Call       │                                  │
  │  └────────────────────────────────────────────────────────────────►│
  │                                  │  2. Navigate to /video-call      │
  │  3. initialize useWebRTC()       │                                  │
  │  │  ├─ getUserMedia()            │                                  │
  │  │  └─ socket.io connect         ├─ initialize useWebRTC()         │
  │  │                               │  ├─ getUserMedia()              │
  │  │  4. POST /room                │  └─ socket.io connect           │
  │  ├───────────────────────────────►                                  │
  │  │◄───────────────────────────────│                                  │
  │  │  5. Response: roomId           │                                  │
  │  │                                │  6. POST /room                  │
  │  │                                │◄──────────────────────────────  │
  │  │                                │──────────────────────────────►  │
  │  │                                │  7. Response: roomId            │
  │  │  8. emit("join-room")          │                                  │
  │  ├────────────────────────────────►                                  │
  │  │                                │  8. emit("join-room")           │
  │  │                                ├──────────────────────────────►  │
  │  │                                │                                  │
  │  │                                │◄─── 9. user-joined event ──────│
  │  │  9. Receive user-joined ◄──────┤─────                            │
  │  │                                │                                  │
  │  │  10. createPeerConnection()    │                                  │
  │  │      createOffer()             │                                  │
  │  │      emit("offer")             │                                  │
  │  ├────────────────────────────────►                                  │
  │  │                                │  10. emit("offer")              │
  │  │                                ├──────────────────────────────►  │
  │  │                                │                                  │
  │  │                                │  11. createPeerConnection()     │
  │  │                                │      setRemoteDescription()     │
  │  │                                │      createAnswer()             │
  │  │                                │      emit("answer")             │
  │  │  11. Receive answer ◄──────────┤◄─────────────────────────────  │
  │  │      setRemoteDescription()     │                                  │
  │  │                                │                                  │
  │  │ ◄─────── ICE Candidates ───────┬──────────────────────────────► │
  │  │ emit("ice-candidate")           │  emit("ice-candidate")         │
  │  ├────────────────────────────────►                                  │
  │  │ ◄───── ICE Candidates ─────────┤──────────────────────────────  │
  │  │                                │                                  │
  │  │  ✅ pc.ontrack() ◄─────────────────────┬ pc.ontrack() ✅        │
  │  │     Remote stream received              │ Remote stream received  │
  │  │     setRemoteStream()                   │ setRemoteStream()      │
  │  │     Display remote video                │ Display remote video    │
  │  │                                │                                  │
  │  │  🎥 ACTIVE VIDEO CALL          │       🎥 ACTIVE VIDEO CALL     │
  │  │ ◄─────── Audio/Video ───────────────────────────────────────────►│
  │  │ ◄─────── Audio/Video ────────────────────────────────────────────┤
  │  │                                │                                  │
  │  │  [User clicks End Call]         │      [User clicks End Call]    │
  │  │  └─ emit("user-left")          │                                  │
  │  ├────────────────────────────────►                                  │
  │  │                                │  12. emit("user-left")          │
  │  │                                ├──────────────────────────────►  │
  │  │                                │                                  │
  │  │  └─ POST /end/{callId}         │  └─ POST /end/{callId}          │
  │  ├────────────────────────────────►                                  │
  │  │                                │◄─────────────────────────────── │
  │  │◄────────────────────────────────                                  │
  │  │  13. Response: {success}        │  Response: {success}            │
  │  │                                │                                  │
  │  │  pc.close()                     │                                  │
  │  │  Stop tracks                    │      pc.close()                 │
  │  │  Navigate away                  │      Stop tracks                │
  │  │                                │      Navigate away              │
  │  │                                │                                  │
```

## Error Handling Flow

```
Media Initialization Error
│
├─► getUserMedia() with HD constraints fails
│   │   ├─► Catches NotAllowedError (permission denied)
│   │   ├─► Catches NotFoundError (no device)
│   │   ├─► Catches NotReadableError (device in use)
│   │   └─► Catches OverconstrainedError (constraints too strict)
│   │
│   └─► Fallback: Retry with basic constraints
│       └─► getUserMedia({ video: true, audio: true })
│           │
│           ├─► Success: Continue with basic quality
│           │   └─► Show message: "Using basic video quality"
│           │
│           └─► Failure: Show error
│               └─► Display: "Cannot access camera/microphone"
│                   └─► User must enable permissions and retry
│
Connection Establishment Error
│
├─► createOffer() fails
│   └─► Display error: "Failed to create offer"
│
├─► setRemoteDescription() fails
│   └─► Display error: "Failed to establish connection"
│
├─► addIceCandidate() fails
│   └─► Log warning but continue
│       └─► Other candidates may succeed
│
Network Error
│
├─► Socket.io connection fails
│   │   └─► Auto-reconnect
│   │       ├─► Attempt 1: 1s delay
│   │       ├─► Attempt 2: 2s delay
│   │       ├─► Attempt 3: 4s delay
│   │       ├─► Attempt 4: 8s delay
│   │       ├─► Attempt 5: 16s delay
│   │       └─► After 5 attempts: Display error
│   │
│   └─► Display: "Connection lost"
│
├─► ICE gathering timeout
│   └─► After 10s, proceed with available candidates
│       └─► Some calls may work, others may fail
│
├─► Call establishment timeout
│   └─► After 30s, show error
│       └─► User can retry
│
└─► Connection drops mid-call
    ├─► Attempt automatic reconnection
    └─► Display: "Connection lost (attempting to reconnect)"
        ├─► If successful: "Reconnected" ✅
        └─► If fails: Show "Connection lost" error
```

## Performance Monitoring Points

```
Call Setup Phase
├─► getUserMedia() timing
│   └─► Ideal: 1-2 seconds
│
├─► Socket.io connection
│   └─► Ideal: <1 second
│
├─► ICE gathering
│   └─► Ideal: 2-3 seconds
│
├─► Offer/Answer exchange
│   └─► Ideal: 1-2 seconds
│
├─► Connection establishment
│   └─► Ideal: Total <10 seconds
│
└─► First frame received
    └─► Ideal: 4-7 seconds from page load

Active Call Phase
├─► Video frame rate
│   └─► Ideal: 30 fps (can vary based on bandwidth)
│
├─► Audio latency
│   └─► Ideal: <150ms one-way
│
├─► Bandwidth usage
│   ├─► Audio only: 50-100 kbps
│   ├─► SD Video: 500-1000 kbps
│   └─► HD Video: 2500-4000 kbps
│
└─► CPU usage
    └─► Ideal: <30% for HD video

Call End Phase
├─► Call cleanup
│   └─► Ideal: <1 second
│
├─► Database recording
│   └─► Ideal: <500ms
│
└─► Navigation
    └─► Ideal: <1 second
```

---

This visual guide helps understand the complete architecture and flow of the video calling feature. Refer to the detailed documentation files for more information on specific components.
