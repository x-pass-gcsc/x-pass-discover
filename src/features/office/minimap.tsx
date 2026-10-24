'use client';

import { GRID_HEIGHT, GRID_WIDTH, NPCS, ROOMS } from '@/game/office/map';
import { useT } from '@/i18n/client';

const SCALE = 4;
const PICTURE_URL = '/img/office/floor.webp';

const hex = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

/**
 * Minimap.
 *
 * Drawn in React from the same map definition Phaser uses, rather than as a
 * second Phaser camera: UI belongs on the React side of the bridge, it stays
 * crisp at any DPI, and it costs the game loop nothing. Phaser only reports the
 * player's tile.
 *
 * The office picture sits underneath as a thumbnail, with the current room
 * outlined over it; if the picture is missing the room outlines still read.
 */
export function Minimap({
  player,
  activeRoomKey,
}: {
  player: { x: number; y: number } | null;
  activeRoomKey: string | null;
}) {
  const t = useT();
  const width = GRID_WIDTH * SCALE;
  const height = GRID_HEIGHT * SCALE;
  const at = (tile: number) => (tile + 0.5) * SCALE;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={t('office.minimap')}
    >
      <defs>
        <clipPath id="minimap-clip">
          <rect width={width} height={height} rx={6} />
        </clipPath>
      </defs>

      <g clipPath="url(#minimap-clip)">
        <rect width={width} height={height} fill="#2a3242" />
        <image href={PICTURE_URL} width={width} height={height} preserveAspectRatio="none" />
        <rect width={width} height={height} fill="#0f1729" fillOpacity={0.25} />
      </g>

      {ROOMS.map((room) => {
        const isActive = room.key === activeRoomKey;
        return (
          <g key={room.key}>
            <rect
              x={room.x * SCALE}
              y={room.y * SCALE}
              width={room.w * SCALE}
              height={room.h * SCALE}
              rx={2}
              fill={isActive ? hex(room.color) : 'none'}
              fillOpacity={0.35}
              stroke={isActive ? '#60a5fa' : '#ffffff'}
              strokeOpacity={isActive ? 1 : 0.2}
              strokeWidth={isActive ? 1.6 : 0.6}
            />
            {room.action.kind !== 'info' ? (
              <circle
                cx={(room.x + room.w / 2) * SCALE}
                cy={(room.y + room.h / 2) * SCALE}
                r={2}
                fill="#60a5fa"
              />
            ) : null}
          </g>
        );
      })}

      {NPCS.filter((npc) => npc.personaKey).map((npc) => (
        <circle
          key={npc.key}
          cx={at(npc.x)}
          cy={at(npc.y)}
          r={2.4}
          fill={hex(npc.color)}
          stroke="#ffffff"
          strokeWidth={0.8}
        />
      ))}

      {player ? (
        <g>
          <circle cx={at(player.x)} cy={at(player.y)} r={5} fill="#3b82f6" fillOpacity={0.3}>
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle
            cx={at(player.x)}
            cy={at(player.y)}
            r={2.8}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={1.4}
          />
        </g>
      ) : null}
    </svg>
  );
}
