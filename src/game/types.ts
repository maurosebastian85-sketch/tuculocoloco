export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  strength: number;
  dexterity: number;
  vitality: number;
  magic: number;
  defense: number;
  attack: number;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'ring' | 'amulet';
  rarity: 'common' | 'magic' | 'rare' | 'unique';
  stats?: Partial<Stats>;
  damage?: number;
  defense?: number;
  healAmount?: number;
  manaAmount?: number;
  description: string;
  sprite: number[][];
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  speed: number;
  sprite: number[][];
  color: string;
  pos: Position;
  lastMove: number;
  isDead: boolean;
  deathTimer: number;
}

export interface Projectile {
  pos: Position;
  dir: Position;
  speed: number;
  damage: number;
  distance: number;
  maxDistance: number;
  fromPlayer: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface DungeonRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  connected: boolean;
}

export type TileType = 'floor' | 'wall' | 'door' | 'stairs' | 'water' | 'lava' | 'chest';

export interface GameMessage {
  text: string;
  color: string;
  time: number;
}

export type GameState = 'menu' | 'playing' | 'inventory' | 'dead' | 'levelup';

export interface Player {
  pos: Position;
  stats: Stats;
  inventory: Item[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    ring: Item | null;
    amulet: Item | null;
  };
  direction: Position;
  isAttacking: boolean;
  attackTimer: number;
  invulnerable: number;
  gold: number;
}
