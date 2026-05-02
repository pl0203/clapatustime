import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit environment variables are not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    roomId?: string;
    displayName?: string;
  };
  const roomId = sanitizeRoomId(body.roomId);
  const displayName = sanitizeDisplayName(body.displayName);
  const identity = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${crypto.randomUUID()}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName,
    ttl: "2h",
  });

  token.addGrant({
    room: roomId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    url: livekitUrl,
  });
}

function sanitizeRoomId(roomId: string | undefined) {
  const cleanRoomId = roomId
    ?.toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleanRoomId) {
    throw new Error("Room id is required.");
  }

  return cleanRoomId;
}

function sanitizeDisplayName(displayName: string | undefined) {
  const cleanName = displayName?.trim().slice(0, 48);
  return cleanName || "Guest";
}
