export function createRoomId() {
  const adjectives = ["quiet", "late", "silver", "soft", "north", "slow"];
  const nouns = ["lantern", "harbor", "window", "garden", "signal", "orbit"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective}-${noun}`;
}

export function normalizeRoomInput(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a room link or room code.");
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    const [, roomSegment, roomId] = url.pathname.split("/");

    if (roomSegment === "room" && roomId) {
      return sanitizeRoomId(roomId);
    }
  }

  return sanitizeRoomId(trimmed.split("/").filter(Boolean).pop() ?? trimmed);
}

export function formatRoomLabel(roomId: string) {
  return roomId.replace(/-/g, " ");
}

function sanitizeRoomId(value: string) {
  const roomId = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!roomId) {
    throw new Error("That room code is not valid.");
  }

  return roomId;
}
