# Video Call App Plan

## 1. Product Goal

Build a lightweight video call app for friends that feels fast, playful, and easy to use.

The app should make it simple to:

- start a call in a few seconds
- invite friends with a link
- join from phone or desktop
- see who is in the room
- chat, mute, turn camera on/off, and leave without confusion

## 2. Default Product Direction

Recommended first version:

- private 1:1 video calling
- join via shareable invite link
- optional nickname entry before joining
- no account required for MVP

Why this direction:

- fastest path to something usable
- best fit for casual calls with friends
- removes friction from signup and login
- gives us a clear base to expand later

## 3. Product Personality

The app should feel:

- warm and social, not corporate
- simple and low-pressure
- modern, colorful, and mobile-friendly

Recommended visual style:

- soft dark gradient background or dusk-inspired palette
- rounded video tiles and large friendly controls
- clear status states like muted, connecting, camera off
- minimal text on screen during calls

## 4. Core Screens

### Home / Landing

Purpose:

- explain the app in one line
- let someone start a room immediately
- let someone join with an invite code or link

Main elements:

- app name and short tagline
- "Start a Call" primary action
- "Join a Call" secondary action
- small preview illustration or mock room graphic

### Pre-Join Screen

Purpose:

- confirm camera, mic, and display name before entering

Main elements:

- camera preview
- microphone toggle
- camera toggle
- name input
- device selection
- join button

### In-Call Room

Purpose:

- make the call experience the main event

Main elements:

- responsive 1:1 call layout
- top room label or room code
- bottom control bar
- participant list button

Primary controls:

- mute / unmute
- camera on / off
- share invite link
- leave call

### Side Panels / Modals

Needed for:

- participant list
- invite/share modal
- connection or permission errors

## 5. Primary User Flows

### Flow A: Start a New Call

1. User lands on home screen
2. Taps "Start a Call"
3. App creates a room
4. User enters pre-join screen
5. User confirms name, camera, and mic
6. User joins room
7. User copies invite link and sends it to friends

### Flow B: Join a Friend's Call

1. User opens shared invite link
2. App checks room validity
3. User sees pre-join screen
4. User enters nickname and confirms mic/camera
5. User joins room
6. User appears in the 1:1 call layout

### Flow C: During the Call

1. User toggles mic or camera as needed
2. User opens participant list if needed
3. User shares link if needed
4. User leaves call when done

### Flow D: Error / Recovery

1. Browser asks for mic/camera permission
2. If denied, app shows a clear recovery message
3. User can retry permissions or join audio/video off
4. If connection is weak, app shows a non-blocking status banner

## 6. MVP Feature Set

Must have:

- create room
- join room by link
- nickname before joining
- webcam + microphone support
- mute / unmute
- camera on / off
- responsive 1:1 video layout
- participant presence
- invite link sharing
- leave room
- permission and connection error states

Nice to have after MVP:

- basic text chat
- screen sharing
- reactions / emoji bursts
- background blur
- friend list
- user accounts
- room history
- scheduled hangouts
- recording

## 7. Suggested UX Rules

- someone should be able to enter a call in under 15 seconds
- every important action should be visible in one tap
- camera and microphone state must always be obvious
- mobile join flow should be as smooth as desktop
- permission failures should never feel like dead ends

## 8. Recommended Information Architecture

Routes:

- `/` home
- `/join` optional manual join screen
- `/room/:roomId` room entry point
- `/room/:roomId/setup` pre-join setup

Key UI sections inside room:

- video area
- control bar
- lightweight participant sheet or status area

## 9. Recommended Technical Direction

Recommended stack for speed and reliability:

- frontend: Next.js + React
- styling: Tailwind CSS
- realtime video/audio: LiveKit or Daily
- backend: Next.js API routes / server actions for room creation
- deployment: Vercel

Why this is a strong starting point:

- fast to prototype
- good developer experience
- strong support for realtime apps
- avoids building raw WebRTC infrastructure from scratch

Alternative path:

- raw WebRTC + Socket.io

Tradeoff:

- more control
- much more complexity for signaling, TURN/STUN, scaling, and device edge cases

Recommendation:

- use a managed realtime provider for version one

## 10. Data Model (Simple MVP)

Room:

- id
- createdAt
- createdBy optional
- status

Participant:

- id
- roomId
- displayName
- joinedAt
- audioEnabled
- videoEnabled

ChatMessage:

- id
- roomId
- senderName
- text
- createdAt

## 11. Delivery Roadmap

### Phase 1: Clickable MVP

- landing page
- room creation
- join by link
- pre-join screen
- working video/audio call
- core in-call controls

### Phase 2: Call Polish

- chat
- participant list
- responsive mobile refinements
- error handling polish
- loading and connection states

### Phase 3: Social Features

- reactions
- screen sharing
- profiles or accounts
- recurring hangout rooms

## 12. Open Decisions To Confirm

Confirmed product decisions:

1. No accounts for MVP
2. Clean minimal look
3. Chat after MVP
4. 1:1 first
5. Desktop and mobile equally

## 13. Recommended Decision Set

If you want the fastest path to a lovable first version, I recommend:

- no accounts for MVP
- invite-link rooms
- prioritize 1:1 calling first
- keep chat for post-MVP
- prioritize both desktop and mobile web
- use a managed video platform like LiveKit

## 14. Platform Decision

Confirmed platform direction:

- build the first version as a web app
- optimize for desktop and mobile browsers
- deploy over HTTPS
- keep the architecture friendly to a future native client if needed

Why this is the right call now:

- easiest deployment path
- simplest sharing model for invite links
- fastest iteration speed
- enough stability for a focused 1:1 MVP if we design around browser constraints

## 15. Build-First Success Criteria

We should start implementation once this feels right:

- the core screens are approved
- the start/join flow feels simple enough
- the MVP feature list is agreed
- the visual direction is clear enough to design confidently
- the technical direction is accepted
