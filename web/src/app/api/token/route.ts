import { createHmac } from "crypto";
import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

type TokenRequestBody = {
  roomId?: string;
  displayName?: string;
};

export async function POST(request: NextRequest) {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const e2eeSecret = process.env.LIVEKIT_E2EE_SECRET ?? apiSecret;

  if (!livekitUrl || !apiKey || !apiSecret || !e2eeSecret) {
    return withNoStore(
      NextResponse.json(
        { error: "LiveKit environment variables are not configured." },
        { status: 500 },
      ),
    );
  }

  let body: TokenRequestBody;

  try {
    body = (await request.json()) as TokenRequestBody;
  } catch {
    return withNoStore(
      NextResponse.json({ error: "Invalid token request." }, { status: 400 }),
    );
  }

  let roomId: string;

  try {
    roomId = sanitizeRoomId(body.roomId);
  } catch (error) {
    return withNoStore(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Room id is required.",
        },
        { status: 400 },
      ),
    );
  }

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

  return withNoStore(
    NextResponse.json({
      token: await token.toJwt(),
      url: livekitUrl,
      encryptionKey: deriveRoomEncryptionKey(roomId, e2eeSecret),
    }),
  );
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

function deriveRoomEncryptionKey(roomId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`room-e2ee:${roomId}`)
    .digest("base64url");
}

function withNoStore(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
