/**
 * Office palette — light.
 *
 * The office is drawn procedurally, so the whole look lives in these values.
 * In a light scene the depth cues invert: walls are the *lighter* solid, their
 * shadow does the separating, and furniture is a step darker than the floor so
 * it reads as an object sitting on it.
 */
export const PALETTE = {
  void: 0xe3e8f1,
  wallTop: 0xdae2ed,
  wallFace: 0xa9b6c9,
  wallEdge: 0xe9eef6,
  wallShadow: 0x8694ad,

  corridor: 0xf8fafc,
  corridorAlt: 0xf1f4f9,
  grid: 0xdfe5ef,

  doorway: 0xf8fafc,
  threshold: 0x2563eb,

  propShadow: 0x8e9ab0,
  deskTop: 0xc9d3e4,
  deskEdge: 0xa9b6cc,
  tableTop: 0xd3dceb,
  counterTop: 0xcdd8e9,
  shelfBody: 0xc2cde0,
  shelfLine: 0x93a2bc,
  serverBody: 0xaebacf,
  serverLed: 0x059669,
  sofaBody: 0xc7c6e0,
  chairBody: 0xb6c2d6,
  plantPot: 0xc89272,
  plantLeaf: 0x3fae7c,
  rug: 0x2563eb,
  boardBody: 0xe9eef7,
  boardInk: 0x9aa6bb,
  screenGlow: 0x60a5fa,
  monitor: 0x44506a,
  monitorGlow: 0x7fb0ff,

  player: 0x2563eb,
  playerLight: 0x93c5fd,
  shadow: 0x5b6680,

  labelInk: '#56637a',
  labelHint: '#2563eb',
  nameInk: '#0f1729',
} as const;

/**
 * Office palette — illustrated floor.
 *
 * When the painted floor (`public/img/office/floor.webp`) loads, it supplies
 * floors, walls, doorways and wall decor, and only furniture is still drawn on
 * top. That art is a warm, lamp-lit night scene, so the furniture switches to
 * wood and charcoal to sit in it rather than float above it like the light
 * scene's pale blue blocks. Keys mirror the furniture entries of `PALETTE`.
 */
export const ILLUSTRATED = {
  void: 0x1b2232,

  propShadow: 0x0b0f18,
  deskTop: 0xb98654,
  deskEdge: 0x6e4a2c,
  tableTop: 0xc4935f,
  counterTop: 0xece6da,
  shelfBody: 0x7a5434,
  shelfLine: 0xd9b27c,
  serverBody: 0x2b3446,
  serverLed: 0x34d399,
  sofaBody: 0x8d7a66,
  chairBody: 0x2d3340,
  plantPot: 0xe6e0d4,
  plantLeaf: 0x3f9a5a,
  rug: 0xf3b45c,
  boardBody: 0xf5f3ee,
  boardInk: 0x7c8aa5,
  screenGlow: 0x60a5fa,
  monitor: 0x1f2633,
  monitorGlow: 0x7fb0ff,
  wallEdge: 0xf6e7c8,

  /** Room sign plates, in the style of the concept art's hanging signs. */
  signPlate: 0x151b27,
  signEdge: 0xf2c879,
  signInk: '#f8fafc',
  signHint: '#fcd38d',
} as const;

/** Colours `drawProp` reads, satisfied by both palettes. */
export type FurnitureTones = Record<
  | 'propShadow'
  | 'deskTop'
  | 'deskEdge'
  | 'tableTop'
  | 'counterTop'
  | 'shelfBody'
  | 'shelfLine'
  | 'serverBody'
  | 'serverLed'
  | 'sofaBody'
  | 'chairBody'
  | 'plantPot'
  | 'plantLeaf'
  | 'rug'
  | 'boardBody'
  | 'boardInk'
  | 'screenGlow'
  | 'monitor'
  | 'monitorGlow'
  | 'wallEdge',
  number
>;
