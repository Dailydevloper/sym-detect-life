# WebRTC Video Calling Setup

This application now uses **WebRTC + Socket.io** for video calling instead of Agora.

## Architecture

- **Backend**: Express + Socket.io for WebRTC signaling
- **Frontend**: React + Socket.io client + WebRTC API
- **STUN Servers**: Google's free STUN servers for NAT traversal

## Environment Variables

### Backend (.env)

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
```

## Features

✅ Peer-to-peer video calling using WebRTC
✅ Real-time signaling with Socket.io
✅ Camera and microphone controls
✅ Connection status indicators
✅ Call duration tracking
✅ Automatic NAT traversal with STUN servers

## How It Works

1. **Room Creation**: When a user joins a video call, the backend creates
   a room based on the appointment ID
2. **Socket.io Signaling**: Socket.io handles WebRTC signaling
   (offer, answer, ICE candidates)
3. **Peer Connection**: WebRTC establishes a direct peer-to-peer
   connection between users
4. **Media Streaming**: Audio and video streams are exchanged directly
   between peers

## Socket.io Events

### Client → Server

- `join-room`: Join a video call room
- `offer`: Send WebRTC offer
- `answer`: Send WebRTC answer
- `ice-candidate`: Send ICE candidate
- `leave-room`: Leave the room

### Server → Client

- `user-joined`: Another user joined the room
- `offer`: Receive WebRTC offer
- `answer`: Receive WebRTC answer
- `ice-candidate`: Receive ICE candidate
- `user-left`: Another user left the room

## API Endpoints

### POST /api/video-calls/room

Generate a room ID for a video call.

**Request:**

```json
{
  "appointmentId": "123"
}
```

**Response:**

```json
{
  "roomId": "appointment-123",
  "appointmentId": "123",
  "userId": "user-id"
}
```

### POST /api/video-calls/start

Start a video call session.

**Request:**

```json
{
  "appointmentId": "123"
}
```

### POST /api/video-calls/end/:callId

End a video call session.

## Production Considerations

### TURN Servers

For production, you should add TURN servers for users behind restrictive firewalls/NAT:

```typescript
const iceServers: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "username",
      credential: "password",
    },
  ],
};
```

**Free TURN Server Options:**

- [Twilio STUN/TURN](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)
- Self-hosted: [coturn](https://github.com/coturn/coturn)

### Security

- Implement authentication for Socket.io connections
- Add rate limiting for signaling events
- Validate room access permissions
- Use HTTPS/WSS in production

### Scalability

For high-scale deployments, consider:

- Redis adapter for Socket.io clustering
- Load balancing with sticky sessions
- Media server (e.g., Janus, Mediasoup) for multi-party calls

## Testing

1. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Open two browser windows/tabs
4. Create an appointment and start a video call
5. Join the same call from both windows

## Troubleshooting

**No video/audio:**

- Check browser permissions for camera/microphone
- Ensure HTTPS is used in production (required for getUserMedia)

**Connection fails:**

- Check if STUN servers are accessible
- Add TURN servers for restrictive networks
- Verify Socket.io connection is established

**One-way video:**

- Check firewall/NAT configuration
- Ensure both peers can receive ICE candidates
- Add TURN servers

## Browser Compatibility

- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

All major modern browsers support WebRTC.
