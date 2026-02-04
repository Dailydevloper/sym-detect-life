# Video Calling Feature - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- PostgreSQL database running
- Two devices/browsers for testing
- Cameras and microphones enabled

### Starting the Services

#### 1. Backend Server

```bash
cd backend
npm install
npm run dev
# Server will run on http://localhost:3001
```

#### 2. Frontend Application

```bash
# In a new terminal
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

### Verify Setup

1. Open browser console (F12)
2. Backend logs should show: `🚀 Server running on http://localhost:3001`
3. Frontend logs should show: `Vite dev server is running at http://localhost:5173`
4. Check that Socket.io is connected: `Connected to signaling server`

## 📞 Making a Video Call

### Setup Test Users

#### Doctor Account

- Email: `doctor@test.com`
- Password: `password123`
- Role: Doctor

#### Patient Account

- Email: `patient@test.com`
- Password: `password123`
- Role: Patient

### Test Flow (Same Browser)

1. **Step 1: Open Two Browser Tabs**
   - Tab 1: `http://localhost:5173` (Doctor)
   - Tab 2: `http://localhost:5173` (Patient)

2. **Step 2: Login**
   - Tab 1: Login as doctor
   - Tab 2: Login as patient

3. **Step 3: Create Appointment**
   - In patient tab, create appointment with doctor
   - Note the appointment ID

4. **Step 4: Initiate Video Call**
   - Doctor tab: Go to "Appointments" → Click "Video Call" on appointment
   - Patient tab: Go to "Appointments" → Click "Video Call" on same appointment

5. **Step 6: Verify Connection**
   - Both see their own video (with camera icon overlay if off)
   - After handshake (~2-3 seconds), see remote video
   - Call duration timer starts
   - Connection status shows "Connected"

### Test Flow (Different Devices)

1. **On Device 1 (Doctor):**

   ```
   http://<your-ip>:5173
   Login as doctor
   Start video call on appointment
   ```

2. **On Device 2 (Patient):**

   ```
   http://<your-ip>:5173
   Login as patient
   Join video call on same appointment
   ```

3. **Verify both see video** (may take 5-10 seconds for connection)

## 🎮 Testing Controls

### Microphone Toggle

- Click mic icon to toggle audio
- Red mic = audio off
- Normal mic = audio on

### Camera Toggle

- Click camera icon to toggle video
- Red camera = video off
- Shows "VideoOff" icon when camera is off

### End Call

- Click red phone icon to end call
- Duration is recorded
- Both participants are notified

## 🔍 Monitoring Connection

### Browser Console (F12 → Console)

**Successful Connection Sequence:**

```
Connected to signaling server, socket id: abc123...
User joined: patient-user-id
Creating offer...
Offer sent
Received offer
Remote description set from offer
Answer sent
Received answer
Remote description set from answer
Received remote track: audio
Received remote track: video
ICE candidate added
Connection state: connecting
Connection state: connected
WebRTC Connection established!
```

**Common Issues:**

```
Failed to get local stream: Permission denied
→ Check camera/mic permissions in browser settings

Error creating offer: ...
→ Check if peer connection created successfully

Connection state: failed
→ Check network connectivity and firewall
→ Verify STUN/TURN servers are accessible
```

## 📊 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Can login as doctor
- [ ] Can login as patient
- [ ] Can create appointments
- [ ] Can navigate to video call page
- [ ] Local video appears
- [ ] Remote video appears (after connection)
- [ ] Microphone toggle works
- [ ] Camera toggle works
- [ ] Call duration timer works
- [ ] Can end call
- [ ] Call is recorded in database
- [ ] Disconnecting one side notifies the other

## 🐛 Troubleshooting

### Issue: No Local Video

**Solution:**

1. Check browser camera permissions (⚙️ → Privacy)
2. Ensure no other app is using the camera
3. Refresh the page
4. Try with different browser

### Issue: Remote Video Not Appearing

**Solution:**

1. Check console for connection errors
2. Wait 5-10 seconds for ICE gathering
3. Check network connectivity
4. Verify both on same appointment
5. Try with audio first - confirm connection works

### Issue: Audio Issues

**Solution:**

1. Check browser microphone permissions
2. Test system microphone works
3. Try with echo cancellation disabled in settings
4. Check if another app is using microphone

### Issue: Connection Times Out

**Solution:**

1. Verify internet connection
2. Check if firewall blocks WebRTC
3. Verify STUN server is accessible (test with external IP)
4. Check console for ICE candidate errors
5. Try with VPN disabled (sometimes helps with NAT)

### Issue: Error: "Failed to initialize room"

**Solution:**

1. Verify backend is running
2. Check API URL in code matches your backend URL
3. Verify appointment exists and belongs to user
4. Check authentication token is valid
5. Review backend logs for errors

## 🌐 Network Requirements

### Minimum Bandwidth

- **Audio Only:** 50-100 kbps
- **Video (SD):** 500-1000 kbps
- **Video (HD):** 2500-4000 kbps

### Recommended Network

- Upload: 2.5+ Mbps
- Download: 2.5+ Mbps
- Latency: <150ms
- Packet Loss: <3%

### Test Network

```bash
# Test upload speed
# Test download speed
# Use video with "Network Throttling" in DevTools → Throttling
```

## 📈 Performance Tips

### For Developers

1. **Monitor Console Logs:**
   - Watch for connection state changes
   - Check for ICE candidate gathering
   - Verify SDP offer/answer exchange

2. **Use Network Tab:**
   - Monitor Socket.io messages
   - Check message size and frequency
   - Watch WebRTC traffic (not visible but affects bandwidth)

3. **Use Performance Tab:**
   - Monitor CPU usage during call
   - Check memory usage for leaks
   - Verify smooth frame rates

### For End Users

1. **Optimize Environment:**
   - Close background applications
   - Use wired Ethernet if possible
   - Ensure good lighting for video
   - Use headphones to avoid echo

2. **Troubleshoot Connection:**
   - Restart browser if laggy
   - Restart WiFi router
   - Move closer to WiFi router
   - Use 5GHz band instead of 2.4GHz

## 📱 Mobile Testing

### iOS

- Safari 12.2+
- Chrome/Firefox (supported)
- Allow camera/microphone permissions
- iPad supported

### Android

- Chrome 50+
- Firefox 48+
- Samsung Internet
- Allow camera/microphone permissions

### Known Mobile Issues

- Battery drain from continuous video
- May need to reduce video resolution on older devices
- Some networks block P2P connections (try TURN server)

## 🔐 Security Notes

### During Testing

- ✅ Passwords stored in browser cache (test only)
- ✅ WebRTC uses DTLS encryption
- ✅ Socket.io uses WebSocket (upgrade to WSS in production)
- ✅ API endpoints require JWT authentication

### Before Production

- [ ] Move to HTTPS/WSS
- [ ] Use proper TURN server (not public)
- [ ] Implement call recording consent
- [ ] Add rate limiting
- [ ] Set up monitoring and alerts

## 📞 Next Steps

1. **Test in different scenarios:**
   - Same network (LAN)
   - Different networks (WAN)
   - Mobile + Desktop
   - With throttling enabled

2. **Performance testing:**
   - Measure latency
   - Check bandwidth usage
   - Monitor CPU/memory
   - Test with poor network

3. **Error handling:**
   - Test permission denials
   - Test network disconnections
   - Test browser compatibility
   - Test error recovery

## 🎓 Code References

### Key Files

- Frontend Hook: `/src/hooks/useWebRTC.tsx` (483 lines)
- Frontend Component: `/src/components/VideoCall.tsx` (253 lines)
- Frontend Page: `/src/pages/VideoCall.tsx` (143 lines)
- Backend Routes: `/backend/src/routes/video-call.routes.ts`
- Socket Handlers: `/backend/src/server.ts` (Socket.io section)

### Example Usage

```typescript
// In your component
const {
  localStream,
  remoteStream,
  isConnected,
  toggleMic,
  toggleCamera,
  endCall,
  error,
} = useWebRTC({
  roomId,
  userId,
  onRemoteStream: (stream) => {
    console.log("Remote stream received!");
  },
  onUserLeft: () => {
    console.log("User left the call");
  },
});
```

## 📞 Support

For detailed setup and troubleshooting, see `VIDEO_CALLING_SETUP.md`

### Common Error Messages

| Error                                       | Cause               | Solution                     |
| ------------------------------------------- | ------------------- | ---------------------------- |
| "NotAllowedError: Permission denied"        | Camera/mic blocked  | Check browser permissions    |
| "NotFoundError: Requested device not found" | No camera/mic       | Connect device, refresh      |
| "Failed to connect to signaling server"     | Backend down        | Start backend, check URL     |
| "Failed to initialize room"                 | Invalid appointment | Verify appointment ID        |
| "WebRTC Connection lost"                    | Network issue       | Check network, try reconnect |

---

**Status:** ✅ Video calling feature is fully implemented and ready for testing

**Last Updated:** 2024

**Version:** 1.0.0
