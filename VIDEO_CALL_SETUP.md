# Video Calling Feature Setup

This feature adds real-time video calling using Agora SDK for
doctor-patient consultations.

## Prerequisites

You'll need an Agora account and credentials:

1. Go to https://console.agora.io
2. Sign up or log in
3. Create a project
4. Get your `App ID` and `App Certificate`

## Configuration

### Backend Setup

Add these environment variables to `backend/.env`:

```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

### Frontend Setup

Add this environment variable to `.env.local` (create if it doesn't exist):

```env
REACT_APP_AGORA_APP_ID=your_agora_app_id
```

## Database Setup

The video call tables are automatically created when you run:

```bash
npm run db:migrate
```

This creates:

- `video_calls` table - stores call records
- Indexes for performance

## Features

- **Video & Audio**: Full HD video and crystal-clear audio
- **Call Controls**: Mute/unmute mic and toggle camera
- **Call History**: Track all video calls and their duration
- **Appointment Integration**: Start calls directly from scheduled appointments

## How to Use

1. **Book an Appointment**: Schedule a consultation with a doctor
2. **Start Video Call**: Click "Start Video Call" button on a scheduled appointment
3. **Join Call**: Video call interface will open automatically
4. **During Call**:
   - Toggle microphone (Mic button)
   - Toggle camera (Video button)
   - End call when finished (Phone button)

## API Endpoints

### Generate Token

**POST** `/api/video-calls/token`

- Generates Agora token for video call
- Required: `channelName`, `uid`

### Start Call

**POST** `/api/video-calls/start`

- Initiates a video call for an appointment
- Required: `appointmentId`

### End Call

**POST** `/api/video-calls/end/:callId`

- Ends a video call and logs duration
- Param: `callId`

### Get Call History

**GET** `/api/video-calls/history`

- Retrieves all video calls for the user
- Returns: array of call records with details

## Troubleshooting

### Token Generation Fails

- Verify Agora credentials in backend `.env`
- Check that `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set

### Camera/Mic Not Working

- Allow browser permissions for camera and microphone
- Check device is not in use by another application
- Try disabling and re-enabling in call controls

### No Remote User Visible

- Ensure both participants are in the same channel
- Check network connection
- Verify Agora credentials match on both sides

## Architecture

```
Frontend (React)
    ↓
VideoCall Component (src/components/VideoCall.tsx)
    ↓
VideoCallPage (src/pages/VideoCall.tsx)
    ↓
Backend API (backend/src/routes/video-call.routes.ts)
    ↓
Agora SDK
```

## Security Notes

- Tokens expire after 24 hours
- Only authenticated users can generate tokens
- Call records are stored for audit purposes
- Users can only join calls for their own appointments
