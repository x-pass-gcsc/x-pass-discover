/**
 * BITE office layout — pure data.
 *
 * The office is one painted picture (`public/img/office/floor.webp`). This file
 * is the invisible floor plan laid over it: which tiles of the picture are
 * floor, where each room is, where the big furniture stands, and where people
 * are. Phaser reads it for collision, zones and NPC positions, and React reads
 * the same keys to decide which overlay an interaction opens. No business
 * state lives here.
 *
 * Coordinates are tiles of 32px on the picture, which is shown at exactly
 * WORLD_WIDTH × WORLD_HEIGHT. If the picture is regenerated with a different
 * layout, this file is what has to be re-traced; `npm run verify:office`
 * checks the result is still one walkable floor.
 */

export const TILE = 32;
export const GRID_WIDTH = 45;
export const GRID_HEIGHT = 34;
export const WORLD_WIDTH = GRID_WIDTH * TILE;
export const WORLD_HEIGHT = GRID_HEIGHT * TILE;

export type ZoneAction =
  | { kind: 'info' }
  | { kind: 'resources'; label: string }
  | { kind: 'workspace'; label: string }
  | { kind: 'meeting'; label: string }
  | { kind: 'notifications'; label: string };

/** A rectangle in picture pixels. */
export type PixelRect = { x: number; y: number; w: number; h: number };

export type OfficeRoom = {
  key: string;
  name: string;
  /** Tile-space rectangle of walkable floor, inclusive of x/y, exclusive of x+w / y+h. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Minimap accent. */
  color: number;
  action: ZoneAction;
  /** Tiles carved out of the surrounding wall so the room is reachable. */
  doors: Array<{ x: number; y: number }>;
  /**
   * The name plate painted in the picture, in picture pixels. The picture's
   * plates carry only an icon and a blank bar; the room's name is written over
   * the bar in the student's language. Rooms without one get a drawn plate.
   */
  sign?: PixelRect;
};

export type OfficeCorridor = { x: number; y: number; w: number; h: number };

/**
 * Furniture.
 *
 * The furniture is painted into the picture; a prop is only its footprint.
 * `solid: true` adds a collision body over that footprint, which is why
 * `npm run verify:office` re-checks that every room and NPC is still reachable
 * after a prop moves.
 */
export type OfficePropKind = 'table' | 'desk' | 'counter' | 'sofa' | 'gate';

export type OfficeProp = {
  kind: OfficePropKind;
  x: number;
  y: number;
  w?: number;
  h?: number;
  solid?: boolean;
};

/**
 * Set dressing: a colleague sitting at one of the painted desks. Pure
 * decoration — they cannot be talked to; talkable people are `NPCS`. Tile
 * coordinates may be fractional so they sit on the painted chairs.
 */
export type OfficeColleague = {
  x: number;
  y: number;
  /** 'back' sits facing into the room, away from the viewer. */
  view: 'back' | 'front';
  shirt: number;
};

export type OfficeNpc = {
  key: string;
  /** Matches an `ai_personas` key when this NPC is talkable. */
  personaKey: string | null;
  name: string;
  role: string;
  /** Tile coordinates. */
  x: number;
  y: number;
  color: number;
  /** Step this NPC's conversation belongs to, when talkable. */
  stepKey: string | null;
  /** Verb phrase shown next to the E keycap, e.g. "Talk". */
  prompt: string;
};

/** Every room opens straight onto the lobby or the entrance hall. */
export const CORRIDORS: OfficeCorridor[] = [];

/*
 * The picture, room by room (tile columns × rows):
 *
 *   my-desk (6–14 × 4–7)   meeting-room-a (17–28)    product-zone (30–39)
 *   marketing (3–12 × 11–14)  executive-room (14–31 × 9–15)  sales (33–41 × 11–14)
 *   hr (1–12 × 17–21)         reception (14–31 × 16–21)      strategy (33–43 × 17–21)
 *   meeting-room-b (4–14 × 25–29)  notification-area (16–28 × 22–33)  data-room (30–40 × 26–30)
 *
 * The lobby is one open hall: its back half, the lounge under the world map,
 * is the executive room; its front half, with the XPASS desk, is reception.
 */
export const ROOMS: OfficeRoom[] = [
  {
    key: 'reception',
    name: 'Reception',
    x: 14, y: 16, w: 18, h: 6,
    color: 0xe4e9fb,
    action: { kind: 'info' },
    doors: [],
  },
  {
    key: 'marketing-zone',
    name: 'Marketing Zone',
    x: 3, y: 11, w: 10, h: 4,
    color: 0xfbe3f0,
    action: { kind: 'info' },
    doors: [{ x: 13, y: 13 }, { x: 13, y: 14 }],
    sign: { x: 168, y: 270, w: 141, h: 46 },
  },
  {
    key: 'sales-zone',
    name: 'Sales Zone',
    x: 33, y: 11, w: 9, h: 4,
    color: 0xdde9fd,
    action: { kind: 'info' },
    doors: [{ x: 32, y: 13 }, { x: 32, y: 14 }],
    sign: { x: 1124, y: 272, w: 143, h: 44 },
  },
  {
    key: 'product-zone',
    name: 'Product Zone',
    x: 30, y: 4, w: 10, h: 4,
    color: 0xdef3e4,
    action: { kind: 'info' },
    doors: [{ x: 31, y: 8 }],
    sign: { x: 1050, y: 52, w: 155, h: 45 },
  },
  {
    key: 'strategy-zone',
    name: 'Strategy Zone',
    x: 33, y: 17, w: 11, h: 5,
    color: 0xe9e4fb,
    action: { kind: 'info' },
    doors: [{ x: 32, y: 20 }, { x: 32, y: 21 }],
    sign: { x: 1160, y: 497, w: 149, h: 46 },
  },
  {
    key: 'hr-zone',
    name: 'HR Zone',
    x: 1, y: 17, w: 12, h: 5,
    color: 0xfceadb,
    action: { kind: 'info' },
    doors: [{ x: 13, y: 20 }, { x: 13, y: 21 }],
    sign: { x: 124, y: 497, w: 149, h: 47 },
  },
  {
    key: 'data-room',
    name: 'Data Room',
    x: 30, y: 26, w: 11, h: 5,
    color: 0xdaeefa,
    action: { kind: 'resources', label: 'Browse Files' },
    doors: [{ x: 29, y: 29 }, { x: 29, y: 30 }],
    sign: { x: 1096, y: 751, w: 141, h: 47 },
  },
  {
    key: 'meeting-room-a',
    name: 'Meeting Room A',
    x: 17, y: 4, w: 12, h: 4,
    color: 0xdcf2ea,
    action: { kind: 'meeting', label: 'Start Meeting' },
    doors: [{ x: 22, y: 8 }, { x: 23, y: 8 }],
    sign: { x: 638, y: 50, w: 161, h: 45 },
  },
  {
    key: 'meeting-room-b',
    name: 'Meeting Room B',
    x: 4, y: 25, w: 11, h: 5,
    color: 0xdcf2ea,
    action: { kind: 'info' },
    doors: [{ x: 15, y: 28 }, { x: 15, y: 29 }],
    sign: { x: 178, y: 750, w: 140, h: 48 },
  },
  {
    key: 'my-desk',
    name: 'My Desk',
    x: 6, y: 4, w: 9, h: 4,
    color: 0xdeebfb,
    action: { kind: 'workspace', label: 'Open Workspace' },
    doors: [{ x: 14, y: 8 }],
    sign: { x: 243, y: 50, w: 149, h: 46 },
  },
  {
    key: 'executive-room',
    name: 'Executive Room',
    x: 14, y: 9, w: 18, h: 7,
    color: 0xfaf0da,
    action: { kind: 'info' },
    doors: [],
  },
  {
    key: 'notification-area',
    name: 'Notification Area',
    x: 16, y: 22, w: 13, h: 12,
    color: 0xfbe2e2,
    action: { kind: 'notifications', label: 'Check Messages' },
    doors: [],
  },
];

/**
 * Footprints of the painted furniture that should stop the player: the big
 * tables, the reception desk, the lobby sofas and the entrance gates. Chairs,
 * plants and lamps are left walkable so the narrow painted rooms stay usable.
 *
 * Solid props are kept clear of door tiles, the spawn point and every NPC.
 */
export const PROPS: OfficeProp[] = [
  { kind: 'table', x: 7, y: 5, w: 7, h: 1, solid: true }, // my desk
  { kind: 'table', x: 19, y: 5, w: 8, h: 1, solid: true }, // meeting room A
  { kind: 'table', x: 33, y: 5, w: 6, h: 1, solid: true }, // product
  { kind: 'table', x: 5, y: 12, w: 6, h: 1, solid: true }, // marketing
  { kind: 'table', x: 35, y: 12, w: 6, h: 1, solid: true }, // sales
  { kind: 'table', x: 3, y: 18, w: 7, h: 1, solid: true }, // hr
  { kind: 'table', x: 36, y: 19, w: 7, h: 1, solid: true }, // strategy
  { kind: 'table', x: 32, y: 28, w: 7, h: 1, solid: true }, // data room
  { kind: 'sofa', x: 4, y: 26, w: 5, h: 2, solid: true }, // meeting room B lounge
  { kind: 'table', x: 12, y: 26, w: 3, h: 2, solid: true }, // meeting room B café
  { kind: 'sofa', x: 18, y: 13, w: 3, h: 2, solid: true }, // lobby lounge
  { kind: 'sofa', x: 23, y: 12, w: 4, h: 1, solid: true },
  { kind: 'table', x: 21, y: 14, w: 3, h: 1, solid: true },
  { kind: 'counter', x: 18, y: 17, w: 10, h: 3, solid: true }, // XPASS desk
  { kind: 'gate', x: 19, y: 27, w: 1, h: 2, solid: true },
  { kind: 'gate', x: 26, y: 27, w: 1, h: 2, solid: true },
];

export const COLLEAGUES: OfficeColleague[] = [
  { x: 8.1, y: 6.3, view: 'back', shirt: 0x2f6fb5 },
  { x: 11.6, y: 6.3, view: 'back', shirt: 0xd9a23a },
  { x: 21.2, y: 6.3, view: 'back', shirt: 0x3f9b6e },
  { x: 35.4, y: 6.3, view: 'back', shirt: 0x7b6bb8 },
  { x: 6.9, y: 13.4, view: 'back', shirt: 0xc1543f },
  { x: 37.6, y: 13.4, view: 'back', shirt: 0x2f6fb5 },
  { x: 5.6, y: 19.4, view: 'back', shirt: 0x3f9b6e },
  { x: 39.4, y: 19.9, view: 'back', shirt: 0xd9a23a },
  { x: 35.2, y: 29.5, view: 'back', shirt: 0x7b6bb8 },
];

export const NPCS: OfficeNpc[] = [
  {
    key: 'npc-sales-manager',
    personaKey: 'bite-sales-manager',
    name: 'Rin Asakura',
    role: 'Distribution Sales Manager',
    x: 34, y: 13,
    color: 0x2563eb,
    stepKey: 'onboarding',
    prompt: 'Talk',
  },
  {
    key: 'npc-quickmart-buyer',
    personaKey: 'quickmart-buyer',
    name: 'Yuki Tanaka',
    role: 'Beverage Category Buyer, QuickMart',
    x: 27, y: 6,
    color: 0x0f766e,
    stepKey: 'buyer-meeting',
    prompt: 'Talk',
  },
  {
    key: 'npc-ta-manager',
    personaKey: 'bite-ta-manager',
    name: 'Aya Nishimura',
    role: 'Talent Acquisition Manager',
    x: 10, y: 20,
    color: 0xea580c,
    stepKey: 'onboarding',
    prompt: 'Talk',
  },
  {
    key: 'npc-hiring-manager',
    personaKey: 'hiring-manager',
    name: 'Takuya Mori',
    role: 'Head of International Business',
    x: 11, y: 28,
    color: 0x0f766e,
    stepKey: 'hiring-intake',
    prompt: 'Talk',
  },
  {
    key: 'npc-coo',
    personaKey: 'bite-coo',
    name: 'Hiroshi Kudo',
    role: 'Chief Operating Officer',
    x: 28, y: 13,
    color: 0xa16207,
    stepKey: 'executive-review',
    prompt: 'Talk',
  },
  {
    key: 'npc-receptionist',
    personaKey: null,
    name: 'BITE Reception',
    role: 'Welcome desk',
    x: 17, y: 19,
    color: 0x7c8bb0,
    stepKey: null,
    prompt: 'Talk',
  },
];

/** Just inside the entrance, two tiles south of the receptionist. */
export const SPAWN = { x: 17, y: 21 };

/**
 * The architecture only: everything is wall, then rooms, corridors and doors
 * are carved out. Doing it subtractively guarantees every room is sealed except
 * where a door was explicitly placed.
 *
 * Furniture is NOT included — a desk is an obstacle, not a wall, and it must
 * not be drawn as one.
 */
export function buildWallGrid(): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => true),
  );

  const carve = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        if (row >= 0 && row < GRID_HEIGHT && col >= 0 && col < GRID_WIDTH) {
          grid[row][col] = false;
        }
      }
    }
  };

  for (const room of ROOMS) carve(room.x, room.y, room.w, room.h);
  for (const corridor of CORRIDORS) carve(corridor.x, corridor.y, corridor.w, corridor.h);
  for (const room of ROOMS) {
    for (const door of room.doors) carve(door.x, door.y, 1, 1);
  }

  return grid;
}

/**
 * Walls plus solid furniture — what the player can actually walk through.
 * Used for pathing checks; the scene builds the two sets of bodies separately
 * so furniture keeps its own look.
 */
export function buildCollisionGrid(): boolean[][] {
  const grid = buildWallGrid();

  for (const prop of PROPS) {
    if (!prop.solid) continue;
    const w = prop.w ?? 1;
    const h = prop.h ?? 1;
    for (let row = prop.y; row < prop.y + h; row += 1) {
      for (let col = prop.x; col < prop.x + w; col += 1) {
        if (row >= 0 && row < GRID_HEIGHT && col >= 0 && col < GRID_WIDTH) {
          grid[row][col] = true;
        }
      }
    }
  }

  return grid;
}

export const toPixels = (tile: number) => tile * TILE + TILE / 2;
