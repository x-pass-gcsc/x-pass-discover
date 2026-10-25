import * as Phaser from 'phaser';
import {
  COLLEAGUES,
  GRID_HEIGHT,
  GRID_WIDTH,
  NPCS,
  PROPS,
  ROOMS,
  SPAWN,
  TILE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  buildWallGrid,
  toPixels,
  type OfficeNpc,
  type OfficeRoom,
} from './map';
import { drawPerson, drawSignIcon, shade, type Look, type SignIcon, type View } from './art';
import { PALETTE } from './theme';
import type { OfficeBridge, OfficeCommand } from './bridge';
import { ENGLISH_LABELS, type OfficeLabels } from './labels';

const PLAYER_SPEED = 215;
const NPC_INTERACT_RADIUS = 60;
const CAMERA_ZOOM = 1.25;
const PLAYER_SIZE = 22;

const PICTURE_KEY = 'office-picture';
const PICTURE_URL = '/img/office/floor.webp';

/**
 * The player's sprite sheet (scripts/build-player-sprite.py): one row per
 * direction, columns standing / step A / step B, feet 2px above the bottom.
 */
const PLAYER_SHEET_KEY = 'player-sheet';
const PLAYER_SHEET_URL = '/img/office/player.png';
const FRAME_W = 86;
const FRAME_H = 142;
const SHEET_ROWS: Record<'down' | 'right' | 'left' | 'up', number> = { down: 0, right: 1, left: 2, up: 3 };
const PLAYER_SPRITE_SCALE = 0.46;
/** Steps per second while walking. */
const STEP_RATE = 6;

/**
 * Each senior's sheet (scripts/build-npc-sprites.py): one row of standing
 * down, right, left, up, then a wave, feet 2px above the bottom. They share
 * the player's scale, so everyone stands the same height.
 */
const npcSheetKey = (npc: OfficeNpc) => `npc-sheet:${npc.key}`;
const NPC_FRAME_W = 76;
const NPC_FRAME_H = 133;
const NPC_STAND = 0;
const NPC_WAVE = 4;

/** Each zoom step multiplies or divides the zoom by this. */
const ZOOM_STEP = 1.25;
const MAX_ZOOM = 2.4;

/** People are baked at 2× and shown scaled down. */
const PERSON_RES = 2;
const PERSON_W = 48;
const PERSON_H = 70;
const PERSON_FEET = 62;
/** A little smaller than the old 2.5D office, to suit the picture's scale. */
const PERSON_SCALE = 0.8;
/** Feet sit this far below a body's centre, so a person stands *on* their tile. */
const FEET_OFFSET = 10;

const DEPTH_GLOW = 1;
const DEPTH_SIGNS = 5_000;
const DEPTH_BUBBLES = 6_000;
const DEPTH_MARKER = 6_500;
/** How high the quest marker floats above a person's feet, or a room's centre. */
const MARKER_OVER_NPC = 86;
const MARKER_OVER_ROOM = 30;

/** The colour of the painted name plates, sampled from the picture. */
const PAINTED_PLATE = 0x272a31;
/** Width of the icon end of a painted plate, which is left as painted. */
const PLATE_ICON_W = 44;

type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Where rooms without a painted plate hang a drawn one, in tiles. The lobby is
 * one open hall in the picture, so its two halves and the entrance are named
 * by plates on the floor rather than on a wall.
 */
const DRAWN_SIGNS: Record<string, { x: number; y: number }> = {
  'executive-room': { x: 16.4, y: 9.1 },
  reception: { x: 28.6, y: 16.2 },
  'notification-area': { x: 16.3, y: 24.4 },
};

/**
 * The BITE office scene.
 *
 * The office is one painted picture shown at world size. Over it lies the
 * invisible floor plan from `map.ts`: a physics body walks that grid, collides
 * with its walls and the footprints of the painted furniture, and decides
 * which room the player is in. Room names are written over the picture's
 * blank name plates in the student's language, so the picture itself carries
 * no words to translate. People are drawn by `art.ts` and stand on top.
 *
 * If the picture fails to load, the floor plan is drawn as flat rooms instead
 * so the office still works.
 *
 * It holds no business state: every meaningful interaction is emitted to React
 * through the bridge.
 */
export class OfficeScene extends Phaser.Scene {
  private bridge: OfficeBridge;
  /** The logical player: an invisible body on the tile grid. */
  private mover!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  /** The visible player, positioned from `mover` after physics runs. */
  private avatar!: Phaser.GameObjects.Container;
  private avatarBody!: Phaser.GameObjects.Image;
  private glow!: Phaser.GameObjects.Ellipse;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private currentRoomKey: string | null = null;
  private currentPrompt: string | null = null;
  private nearbyNpc: OfficeNpc | null = null;
  /** Seniors drawn from their sheets, by NPC key; they wave when you come near. */
  private npcSprites = new Map<string, Phaser.GameObjects.Image>();
  private keycap!: Phaser.GameObjects.Container;
  private speech!: Phaser.GameObjects.Container;
  private speechName!: Phaser.GameObjects.Text;
  private speechRole!: Phaser.GameObjects.Text;
  private speechBg!: Phaser.GameObjects.Graphics;
  private speechFor: string | null = null;
  private facing: Direction = 'down';
  private walkPhase = 0;
  private wasMoving = false;
  private lastReportedTile = { x: -1, y: -1 };
  /** True when the player's sprite sheet loaded; false draws the player instead. */
  private sprite = false;
  private zoom = CAMERA_ZOOM;
  private marker!: Phaser.GameObjects.Container;
  /** Whose head the marker floats over, if anyone's. */
  private markerNpc: string | null = null;

  private labels: OfficeLabels;

  constructor(bridge: OfficeBridge, labels: OfficeLabels = ENGLISH_LABELS) {
    super('office');
    this.bridge = bridge;
    this.labels = labels;
  }

  /**
   * Debug/testing handle for the avatar. The experience layer holds no business
   * state, so exposing it carries no information the player does not already
   * have on screen.
   */
  get playerRef(): Phaser.GameObjects.Container {
    return this.avatar;
  }

  preload(): void {
    // A failed load leaves no texture behind, and create() draws instead.
    this.load.image(PICTURE_KEY, PICTURE_URL);
    this.load.spritesheet(PLAYER_SHEET_KEY, PLAYER_SHEET_URL, {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    });
    for (const npc of NPCS) {
      this.load.spritesheet(npcSheetKey(npc), `/img/office/npcs/${npc.key}.png`, {
        frameWidth: NPC_FRAME_W,
        frameHeight: NPC_FRAME_H,
      });
    }
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(PALETTE.void);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.setRoundPixels(true);

    const walls = buildWallGrid();
    const painted = this.textures.exists(PICTURE_KEY);
    if (painted) {
      this.add
        .image(0, 0, PICTURE_KEY)
        .setOrigin(0, 0)
        .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
        .setDepth(0);
    } else {
      this.drawPlan(walls);
    }

    this.placeRoomSigns(painted);
    this.placeColleagues();
    this.createNpcs();

    const wallBodies = this.createWallBodies(walls);
    const propBodies = this.createPropBodies();
    this.createPlayer();
    this.createBubbles();

    this.physics.add.collider(this.mover, wallBodies);
    this.physics.add.collider(this.mover, propBodies);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.keys = keyboard.addKeys('W,A,S,D') as NonNullable<typeof this.keys>;
      keyboard.on('keydown-E', () => this.handleInteract());
      keyboard.on('keydown', (event: KeyboardEvent) => {
        if (event.key === '+' || event.key === '=') this.zoomBy(1);
        if (event.key === '-' || event.key === '_') this.zoomBy(-1);
      });
      // Arrow keys would otherwise scroll the page behind the canvas.
      keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
    }

    // Physics moves the body during the scene's update; the avatar follows it
    // once the step has settled, so the two never drift a frame apart.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncAvatar, this);
    this.syncAvatar();

    // Zoom: the mouse wheel, the +/- keys, or the buttons React draws.
    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        if (dy !== 0) this.zoomBy(dy > 0 ? -1 : 1);
      },
    );
    this.createMarker();
    const offCommand = this.bridge.onCommand((command: OfficeCommand) => {
      if (command.type === 'zoom') this.zoomBy(command.step);
      else if (command.type === 'marker') this.placeMarker(command.marker);
      else if (command.type === 'controls') this.setControls(command.enabled);
    });
    const onResize = () => this.zoomBy(0);
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offCommand();
      this.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    });

    this.cameras.main.startFollow(this.avatar, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.fadeIn(420, 29, 36, 51);

    this.bridge.emit({ type: 'ready' });
  }

  // ------------------------------------------------------------ quest marker

  /** A gold "!" that bobs over wherever React says the next piece of work is. */
  private createMarker(): void {
    const marker = this.add.container(0, 0).setDepth(DEPTH_MARKER).setVisible(false);
    const halo = this.add.circle(0, 0, 20, 0xfbbf24, 0.28);
    const disc = this.add.graphics();
    disc.fillStyle(0x0f1729, 0.25);
    disc.fillCircle(1, 3, 14);
    disc.fillStyle(0xf59e0b, 1);
    disc.fillCircle(0, 0, 14);
    disc.lineStyle(2.5, 0xffffff, 1);
    disc.strokeCircle(0, 0, 14);
    const bang = this.add
      .text(0, 0, '!', {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '19px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setResolution(2);
    const tip = this.add.triangle(0, 18, -6, 0, 6, 0, 0, 8, 0xf59e0b);
    marker.add([halo, disc, tip, bang]);
    this.tweens.add({
      targets: [disc, bang, tip],
      y: '-=7',
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: halo,
      scale: { from: 0.8, to: 1.5 },
      alpha: { from: 0.45, to: 0 },
      duration: 1300,
      repeat: -1,
      ease: 'Sine.easeOut',
    });
    this.marker = marker;
  }

  private placeMarker(marker: { x: number; y: number; npcKey: string | null } | null): void {
    if (!this.marker) return;
    this.markerNpc = marker?.npcKey ?? null;
    if (!marker) {
      this.marker.setVisible(false);
      return;
    }
    // Tiles are continuous here: a person's tile centre, or a room's middle.
    const lift = marker.npcKey ? MARKER_OVER_NPC - FEET_OFFSET : MARKER_OVER_ROOM;
    this.marker
      .setPosition(Math.round(marker.x * TILE), Math.round(marker.y * TILE - lift))
      .setVisible(true);
  }

  /** Pauses walking and the E key while a window is open over the office. */
  private setControls(enabled: boolean): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.enabled = enabled;
    // The manager is what swallows arrow keys and space; let forms have them.
    keyboard.manager.enabled = enabled;
    if (!enabled) {
      keyboard.resetKeys();
      this.mover?.body.setVelocity(0, 0);
      // Nothing moves behind a window, so stop drawing until it closes.
      this.game.loop.sleep();
    } else if (!this.game.loop.running) {
      this.game.loop.wake();
    }
  }

  // -------------------------------------------------------------------- zoom

  /** The furthest out the camera goes: the whole floor fits the view. */
  private minZoom(): number {
    const { width, height } = this.scale.gameSize;
    return Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
  }

  /** One step in (+1) or out (-1); 0 just re-clamps after a resize. */
  private zoomBy(step: 1 | -1 | 0): void {
    const next = Phaser.Math.Clamp(this.zoom * ZOOM_STEP ** step, this.minZoom(), MAX_ZOOM);
    if (next === this.zoom && step !== 0) return;
    this.zoom = next;
    this.cameras.main.zoomTo(next, 180, Phaser.Math.Easing.Sine.Out, true);
  }

  // -------------------------------------------------------------- floor plan

  /** The fallback when the picture is missing: flat rooms on a dark ground. */
  private drawPlan(walls: boolean[][]): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xe7e2d8, 1);
    for (let row = 0; row < GRID_HEIGHT; row += 1) {
      for (let col = 0; col < GRID_WIDTH; col += 1) {
        if (!walls[row][col]) g.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }
    for (const room of ROOMS) {
      g.fillStyle(room.color, 1);
      g.fillRect(room.x * TILE, room.y * TILE, room.w * TILE, room.h * TILE);
      g.lineStyle(2, shade(room.color, 0.7), 1);
      g.strokeRect(room.x * TILE + 1, room.y * TILE + 1, room.w * TILE - 2, room.h * TILE - 2);
    }
    g.fillStyle(0xb9a58c, 1);
    for (const prop of PROPS) {
      const w = (prop.w ?? 1) * TILE;
      const h = (prop.h ?? 1) * TILE;
      g.fillRoundedRect(prop.x * TILE + 3, prop.y * TILE + 3, w - 6, h - 6, 6);
    }
  }

  private createWallBodies(walls: boolean[][]): Phaser.Physics.Arcade.StaticGroup {
    // Each row's wall tiles merge into runs: a few dozen bodies, not hundreds.
    const group = this.physics.add.staticGroup();
    for (let row = 0; row < GRID_HEIGHT; row += 1) {
      let start: number | null = null;
      for (let col = 0; col <= GRID_WIDTH; col += 1) {
        const isWall = col < GRID_WIDTH && walls[row][col];
        if (isWall && start === null) start = col;
        if (!isWall && start !== null) {
          const width = (col - start) * TILE;
          const rect = this.add
            .rectangle(start * TILE + width / 2, row * TILE + TILE / 2, width, TILE)
            .setVisible(false);
          this.physics.add.existing(rect, true);
          group.add(rect);
          start = null;
        }
      }
    }
    return group;
  }

  private createPropBodies(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    for (const prop of PROPS) {
      if (!prop.solid) continue;
      const w = (prop.w ?? 1) * TILE;
      const h = (prop.h ?? 1) * TILE;
      const rect = this.add
        .rectangle(prop.x * TILE + w / 2, prop.y * TILE + h / 2, w - 4, h - 4)
        .setVisible(false);
      this.physics.add.existing(rect, true);
      group.add(rect);
    }
    return group;
  }

  // ------------------------------------------------------------------- signs

  private signIcon(room: OfficeRoom): SignIcon {
    switch (room.action.kind) {
      case 'notifications':
        return 'bell';
      default:
        return room.key === 'reception' ? 'person' : 'star';
    }
  }

  private signText(room: OfficeRoom): { name: Phaser.GameObjects.Text; hint: Phaser.GameObjects.Text | null } {
    const name = this.add
      .text(0, 0, this.labels.room(room), {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '13px',
        color: PALETTE.signInk,
        fontStyle: 'bold',
      })
      .setResolution(2);
    const hint =
      room.action.kind !== 'info'
        ? this.add
            .text(0, 0, `▸ ${this.labels.action(room)}`, {
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontSize: '10px',
              color: PALETTE.labelHint,
            })
            .setResolution(2)
        : null;
    return { name, hint };
  }

  /**
   * Writes each room's name onto its plate. A painted plate keeps its icon and
   * has its blank bar painted over and lettered; the rest get a drawn plate.
   * Signs sit above everything: wayfinding must never be hidden by a person.
   */
  private placeRoomSigns(painted: boolean): void {
    for (const room of ROOMS) {
      const { name, hint } = this.signText(room);

      if (painted && room.sign) {
        const { x, y, w, h } = room.sign;
        const left = x + PLATE_ICON_W;
        const room_w = w - PLATE_ICON_W - 8;
        const cover = this.add.graphics();
        cover.fillStyle(PAINTED_PLATE, 1);
        cover.fillRoundedRect(left - 2, y + 6, room_w + 4, h - 12, 4);

        // Long names in any language shrink to the bar rather than overflow it.
        for (const text of [name, hint]) {
          if (text && text.width > room_w) text.setScale(room_w / text.width);
        }

        const block = name.displayHeight + (hint ? hint.displayHeight + 1 : 0);
        const top = y + (h - block) / 2;
        name.setPosition(left, top);
        hint?.setPosition(left, top + name.displayHeight + 1);

        this.add.container(0, 0, [cover, name, ...(hint ? [hint] : [])]).setDepth(DEPTH_SIGNS);
        continue;
      }

      const at = DRAWN_SIGNS[room.key] ?? { x: room.x + 0.3, y: room.y + 0.2 };
      name.setPosition(30, hint ? 6 : 8);
      hint?.setPosition(30, 23);
      const width = Math.max(name.width, hint?.width ?? 0) + 40;
      const height = hint ? 40 : 30;

      const plate = this.add.graphics();
      plate.fillStyle(0x000000, 0.3);
      plate.fillRoundedRect(2, 3, width, height, 8);
      plate.fillStyle(PAINTED_PLATE, 0.96);
      plate.fillRoundedRect(0, 0, width, height, 8);
      plate.lineStyle(1, 0xffffff, 0.14);
      plate.strokeRoundedRect(0.5, 0.5, width - 1, height - 1, 8);
      const icon = this.add.graphics({ x: 9, y: (height - 14) / 2 });
      drawSignIcon(icon, this.signIcon(room));

      const left = Math.min(at.x * TILE, WORLD_WIDTH - width - 4);
      this.add
        .container(Math.round(left), Math.round(at.y * TILE), [plate, icon, name, ...(hint ? [hint] : [])])
        .setDepth(DEPTH_SIGNS);
    }
  }

  // -------------------------------------------------------------- characters

  private lookFor(npc: OfficeNpc, index: number): Look {
    return {
      shirt: 0xffffff,
      jacket: shade(npc.color, 0.7),
      tie: npc.personaKey ? shade(npc.color, 1.35) : undefined,
      pants: 0x2b2f3a,
      hair: PALETTE.hair[(index + 1) % PALETTE.hair.length],
      skin: PALETTE.skin,
      long: npc.key === 'npc-sales-manager',
    };
  }

  /**
   * A character frame, baked once at 2×: feet at (24, 62) in a 48×70 frame.
   * Walking swaps textures rather than redrawing anything.
   */
  private personTexture(
    id: string,
    look: Look,
    direction: Direction,
    frame: number,
    pose: 'stand' | 'sit' = 'stand',
  ): string {
    const key = `person:${id}:${direction}:${frame}:${pose}`;
    if (this.textures.exists(key)) return key;
    const texture = this.textures.createCanvas(key, PERSON_W * PERSON_RES, PERSON_H * PERSON_RES);
    if (!texture) return key;
    const ctx = texture.getContext();
    ctx.scale(PERSON_RES, PERSON_RES);
    ctx.translate(PERSON_W / 2, PERSON_FEET);
    if (direction === 'left') ctx.scale(-1, 1);
    const view: View = direction === 'up' ? 'back' : direction === 'down' ? 'front' : 'side';
    drawPerson(ctx, look, view, frame, pose);
    texture.refresh();
    return key;
  }

  private personImage(key: string): Phaser.GameObjects.Image {
    return this.add
      .image(0, 0, key)
      .setOrigin(0.5, PERSON_FEET / PERSON_H)
      .setScale(PERSON_SCALE / PERSON_RES);
  }

  /** Colleagues at the painted desks, so the office reads as occupied. */
  private placeColleagues(): void {
    COLLEAGUES.forEach((colleague, index) => {
      const look: Look = {
        shirt: colleague.shirt,
        pants: PALETTE.pants,
        hair: PALETTE.hair[index % PALETTE.hair.length],
        skin: PALETTE.skin,
        long: index % 3 === 1,
      };
      const direction: Direction = colleague.view === 'back' ? 'up' : 'down';
      const x = colleague.x * TILE;
      const y = colleague.y * TILE;
      this.personImage(this.personTexture(`colleague-${index}`, look, direction, 0, 'sit'))
        .setPosition(x, y)
        .setDepth(y);
    });
  }

  private createNpcs(): void {
    NPCS.forEach((npc, index) => {
      const y = toPixels(npc.y) + FEET_OFFSET;
      const container = this.add.container(toPixels(npc.x), y).setDepth(y);

      // A soft ring on the floor marks someone you can talk to.
      const ring = this.add.ellipse(0, 0, 40, 16, npc.color, 0.22);
      ring.setStrokeStyle(1.5, npc.color, 0.75);
      this.tweens.add({
        targets: ring,
        scale: { from: 0.85, to: 1.12 },
        alpha: { from: 0.95, to: 0.4 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const sheet = npcSheetKey(npc);
      const body = this.textures.exists(sheet)
        ? this.add
            .image(0, 0, sheet, NPC_STAND)
            .setOrigin(0.5, (NPC_FRAME_H - 2) / NPC_FRAME_H)
            .setScale(PLAYER_SPRITE_SCALE)
        : this.personImage(this.personTexture(npc.key, this.lookFor(npc, index), 'down', 0));
      if (this.textures.exists(sheet)) this.npcSprites.set(npc.key, body);

      const name = this.add
        .text(0, 6, npc.name, {
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '10px',
          color: PALETTE.nameInk,
          backgroundColor: '#ffffffee',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5, 0)
        .setResolution(2);

      container.add([ring, body, name]);

      // A small idle bob keeps the office from feeling like a still picture.
      const base = body.scaleX;
      this.tweens.add({
        targets: body,
        scaleY: { from: base, to: base * 1.02 },
        duration: 1400 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private createPlayer(): void {
    const mover = this.add
      .rectangle(toPixels(SPAWN.x), toPixels(SPAWN.y), PLAYER_SIZE, PLAYER_SIZE)
      .setVisible(false);
    this.physics.add.existing(mover);
    this.mover = mover as typeof this.mover;
    this.mover.body.setCollideWorldBounds(true);

    // A pool of light under the player's feet.
    this.glow = this.add.ellipse(0, 0, 38, 15, PALETTE.tileGlow, 0.25).setDepth(DEPTH_GLOW);
    this.glow.setStrokeStyle(2, PALETTE.tileGlow, 0.95);
    this.tweens.add({
      targets: this.glow,
      alpha: { from: 1, to: 0.55 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.avatar = this.add.container(0, 0);
    this.sprite = this.textures.exists(PLAYER_SHEET_KEY);
    this.avatarBody = this.sprite
      ? this.add
          .image(0, 0, PLAYER_SHEET_KEY, this.sheetFrame('down', 0))
          .setOrigin(0.5, (FRAME_H - 2) / FRAME_H)
          .setScale(PLAYER_SPRITE_SCALE)
      : this.personImage(this.personTexture('player', this.playerLook(), 'down', 0));

    const label = this.add
      .text(0, 6, this.labels.you, {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#2563eb',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setResolution(2);

    this.avatar.add([this.avatarBody, label]);
  }

  /** Frame index in the sheet: column 0 stands, 1 and 2 are the two steps. */
  private sheetFrame(direction: Direction, column: number): number {
    return SHEET_ROWS[direction] * 3 + column;
  }

  private playerLook(): Look {
    return {
      shirt: PALETTE.player,
      pants: PALETTE.pants,
      hair: PALETTE.hair[0],
      skin: PALETTE.skin,
    };
  }

  /**
   * The in-world prompts: a speech bubble naming whoever is close enough to
   * talk to, or a floating keycap over the player inside an interactive room.
   */
  private createBubbles(): void {
    const keycap = this.add.container(0, 0).setDepth(DEPTH_BUBBLES).setVisible(false);
    const cap = this.add.graphics();
    cap.fillStyle(0x0f1729, 0.3);
    cap.fillRoundedRect(-10, -9, 22, 22, 5);
    cap.fillStyle(PALETTE.signPlate, 1);
    cap.fillRoundedRect(-11, -11, 22, 22, 5);
    cap.lineStyle(1.5, PALETTE.tileGlow, 1);
    cap.strokeRoundedRect(-11, -11, 22, 22, 5);
    const letter = this.add
      .text(0, 0, 'E', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setResolution(2);
    keycap.add([cap, letter]);
    this.tweens.add({
      targets: [cap, letter],
      y: '-=3',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.keycap = keycap;

    this.speech = this.add.container(0, 0).setDepth(DEPTH_BUBBLES).setVisible(false);
    this.speechBg = this.add.graphics();
    this.speechName = this.add
      .text(10, 7, '', {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '10px',
        color: '#2563eb',
        fontStyle: 'bold',
      })
      .setResolution(2);
    this.speechRole = this.add
      .text(10, 21, '', {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '11px',
        color: PALETTE.nameInk,
      })
      .setResolution(2);
    this.speech.add([this.speechBg, this.speechName, this.speechRole]);
  }

  private showSpeech(npc: OfficeNpc): void {
    if (this.speechFor !== npc.key) {
      this.speechFor = npc.key;
      this.speechName.setText(npc.name);
      this.speechRole.setText(this.labels.role(npc));
      const width = Math.max(this.speechName.width, this.speechRole.width) + 20;
      const height = 40;
      const g = this.speechBg;
      g.clear();
      g.fillStyle(0x0f1729, 0.18);
      g.fillRoundedRect(2, 3, width, height, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, width, height, 8);
      g.fillTriangle(width / 2 - 7, height - 1, width / 2 + 7, height - 1, width / 2, height + 8);
      g.lineStyle(1, 0xd2d9e6, 1);
      g.strokeRoundedRect(0.5, 0.5, width - 1, height - 1, 8);
      this.speech.setSize(width, height);
    }
    const x = toPixels(npc.x);
    const y = toPixels(npc.y) + FEET_OFFSET;
    this.speech.setPosition(Math.round(x - this.speech.width / 2), Math.round(y - 96));
    this.speech.setVisible(true);
  }

  // ------------------------------------------------------------------ update

  update(time: number, delta: number): void {
    if (!this.mover) return;
    this.handleMovement(delta);
    this.updateProximity();
  }

  private handleMovement(delta: number): void {
    const body = this.mover.body;
    const left = this.cursors?.left.isDown || this.keys?.A.isDown;
    const right = this.cursors?.right.isDown || this.keys?.D.isDown;
    const up = this.cursors?.up.isDown || this.keys?.W.isDown;
    const down = this.cursors?.down.isDown || this.keys?.S.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const length = Math.hypot(vx, vy);
    if (length > 0) {
      // Keep diagonal movement the same speed as cardinal.
      vx /= length;
      vy /= length;
    }
    body.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);

    const facing: Direction | null =
      up && !down ? 'up' : down && !up ? 'down' : left && !right ? 'left' : right && !left ? 'right' : null;
    const moving = length > 0;
    if (moving) this.walkPhase += (delta / 1000) * (this.sprite ? STEP_RATE : 9);
    else this.walkPhase = 0;

    if ((facing && facing !== this.facing) || moving || this.wasMoving) {
      if (facing) this.facing = facing;
      if (this.sprite) {
        const column = moving ? 1 + (Math.floor(this.walkPhase) % 2) : 0;
        this.avatarBody.setFrame(this.sheetFrame(this.facing, column));
      } else {
        const frame = moving ? Math.floor(this.walkPhase) % 4 : 0;
        this.avatarBody.setTexture(this.personTexture('player', this.playerLook(), this.facing, frame));
      }
    }
    this.wasMoving = moving;
  }

  /** Places the avatar where the logical body is, and sorts it among the people. */
  private syncAvatar(): void {
    const x = this.mover.x;
    const y = this.mover.y + FEET_OFFSET;
    this.avatar.setPosition(x, y);
    this.avatar.setDepth(y + 0.5);
    this.glow.setPosition(x, y);

    if (this.keycap.visible && !this.nearbyNpc) {
      this.keycap.setPosition(x, y - (this.sprite ? 80 : 66));
    }
  }

  private updateProximity(): void {
    const { x, y } = this.mover;
    const room = this.roomAt(x, y);
    if ((room?.key ?? null) !== this.currentRoomKey) {
      this.currentRoomKey = room?.key ?? null;
      this.bridge.emit({ type: 'zone_changed', room: room ?? null });
    }

    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);
    if (tileX !== this.lastReportedTile.x || tileY !== this.lastReportedTile.y) {
      this.lastReportedTile = { x: tileX, y: tileY };
      // Throttled to tile changes — this drives the React minimap.
      this.bridge.emit({ type: 'player_moved', x: tileX, y: tileY });
    }

    let nearest: OfficeNpc | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const npc of NPCS) {
      const distance = Phaser.Math.Distance.Between(x, y, toPixels(npc.x), toPixels(npc.y));
      if (distance < NPC_INTERACT_RADIUS && distance < nearestDistance) {
        nearest = npc;
        nearestDistance = distance;
      }
    }
    if (nearest !== this.nearbyNpc) {
      if (this.nearbyNpc) this.npcSprites.get(this.nearbyNpc.key)?.setFrame(NPC_STAND);
      if (nearest) this.npcSprites.get(nearest.key)?.setFrame(NPC_WAVE);
    }
    this.nearbyNpc = nearest;

    const action = nearest
      ? this.labels.talk
      : room && room.action.kind !== 'info'
        ? this.labels.action(room)
        : null;
    const target = nearest ? nearest.name : null;
    const prompt = action
      ? target
        ? this.labels.promptTarget(action, target)
        : this.labels.promptZone(action)
      : null;

    // The name bubble takes the marker's place over the person you are next to.
    if (this.marker && this.markerNpc) this.marker.setVisible(nearest?.key !== this.markerNpc);

    if (nearest) {
      this.showSpeech(nearest);
      this.keycap.setVisible(false);
    } else {
      this.speech.setVisible(false);
      this.speechFor = null;
      this.keycap.setVisible(!!(room && room.action.kind !== 'info'));
    }

    if (prompt !== this.currentPrompt) {
      this.currentPrompt = prompt;
      this.bridge.emit({ type: 'prompt', text: prompt, action, target });
    }
  }

  private handleInteract(): void {
    if (this.nearbyNpc) {
      this.bridge.emit({ type: 'interact_npc', npc: this.nearbyNpc });
      return;
    }
    const room = this.roomAt(this.mover.x, this.mover.y);
    if (room && room.action.kind !== 'info') {
      this.bridge.emit({ type: 'interact_zone', room });
    }
  }

  private roomAt(x: number, y: number): OfficeRoom | undefined {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    return ROOMS.find(
      (room) =>
        col >= room.x &&
        col < room.x + room.w &&
        row >= room.y &&
        row < room.y + room.h,
    );
  }
}
