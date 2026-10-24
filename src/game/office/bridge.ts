import type { OfficeNpc, OfficeRoom } from './map';

/**
 * Phaser ↔ React bridge.
 *
 * The office is the experience layer. It reports *what the player did* and
 * nothing else — no task state, no answers, no progress. React decides what an
 * interaction means. In the other direction React may only steer the view
 * (zoom), never the game state.
 */

export type OfficeEvent =
  | { type: 'ready' }
  /**
   * `text` is the full sentence (used for assistive tech); `action` and
   * `target` let the HUD render a keycap without repeating "Press E".
   */
  | {
      type: 'prompt';
      text: string | null;
      action: string | null;
      target: string | null;
    }
  /** Tile coordinates, emitted only when the player crosses a tile boundary. */
  | { type: 'player_moved'; x: number; y: number }
  | { type: 'zone_changed'; room: OfficeRoom | null }
  | { type: 'interact_npc'; npc: OfficeNpc }
  | { type: 'interact_zone'; room: OfficeRoom };

/** React → Phaser: view controls only. `step` is +1 to zoom in, -1 to zoom out. */
export type OfficeCommand = { type: 'zoom'; step: 1 | -1 };

type Listener = (event: OfficeEvent) => void;
type CommandListener = (command: OfficeCommand) => void;

export class OfficeBridge {
  private listeners = new Set<Listener>();
  private commandListeners = new Set<CommandListener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: OfficeEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  onCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  command(command: OfficeCommand): void {
    for (const listener of this.commandListeners) listener(command);
  }
}
