import { DungeonRoom, TileType, Position, Monster, Item } from './types';
import { 
  SKELETON_1, DEMON_1, WRAITH_1, BAT_1,
  PALETTES 
} from './sprites';

export const DUNGEON_WIDTH = 40;
export const DUNGEON_HEIGHT = 30;

export interface DungeonLevel {
  tiles: TileType[][];
  revealed: boolean[][];
  visible: boolean[][];
  rooms: DungeonRoom[];
  monsters: Monster[];
  items: { pos: Position; item: Item }[];
  chests: Position[];
  stairsPos: Position;
  playerStart: Position;
  level: number;
}

function createEmptyGrid(): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      grid[y][x] = 'wall';
    }
  }
  return grid;
}

function roomsOverlap(a: DungeonRoom, b: DungeonRoom, padding: number = 1): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

function carveRoom(tiles: TileType[][], room: DungeonRoom): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
        tiles[y][x] = 'floor';
      }
    }
  }
}

function carveCorridor(
  tiles: TileType[][],
  from: Position,
  to: Position
): void {
  let x = from.x;
  let y = from.y;

  while (x !== to.x) {
    if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
      tiles[y][x] = 'floor';
      if (y + 1 < DUNGEON_HEIGHT) tiles[y + 1][x] = 'floor';
    }
    x += x < to.x ? 1 : -1;
  }
  while (y !== to.y) {
    if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
      tiles[y][x] = 'floor';
      if (x + 1 < DUNGEON_WIDTH) tiles[y][x + 1] = 'floor';
    }
    y += y < to.y ? 1 : -1;
  }
}

function getRoomCenter(room: DungeonRoom): Position {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2),
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createMonster(level: number, pos: Position): Monster {
  const types = [
    {
      id: 'skeleton',
      name: 'Skeleton',
      sprite: SKELETON_1,
      color: '#cccccc',
      baseHp: 15,
      baseAtk: 3,
      baseDef: 1,
      baseExp: 10,
      speed: 800,
    },
    {
      id: 'bat',
      name: 'Cave Bat',
      sprite: BAT_1,
      color: '#8844aa',
      baseHp: 8,
      baseAtk: 2,
      baseDef: 0,
      baseExp: 5,
      speed: 400,
    },
    {
      id: 'demon',
      name: 'Lesser Demon',
      sprite: DEMON_1,
      color: '#cc3030',
      baseHp: 30,
      baseAtk: 6,
      baseDef: 3,
      baseExp: 25,
      speed: 1000,
    },
    {
      id: 'wraith',
      name: 'Wraith',
      sprite: WRAITH_1,
      color: '#6a6aaa',
      baseHp: 20,
      baseAtk: 5,
      baseDef: 2,
      baseExp: 20,
      speed: 600,
    },
  ];

  const typeIdx = Math.min(
    Math.floor(Math.random() * Math.min(types.length, 1 + Math.floor(level / 2))),
    types.length - 1
  );
  const type = types[typeIdx];
  const scaleFactor = 1 + (level - 1) * 0.3;

  return {
    id: type.id,
    name: type.name,
    hp: Math.floor(type.baseHp * scaleFactor),
    maxHp: Math.floor(type.baseHp * scaleFactor),
    attack: Math.floor(type.baseAtk * scaleFactor),
    defense: Math.floor(type.baseDef * scaleFactor),
    exp: Math.floor(type.baseExp * scaleFactor),
    speed: type.speed,
    sprite: type.sprite,
    color: type.color,
    pos: { ...pos },
    lastMove: 0,
    isDead: false,
    deathTimer: 0,
  };
}

function createItem(level: number): Item {
  const weapons: Item[] = [
    {
      id: 'rusty_sword', name: 'Rusty Sword', type: 'weapon', rarity: 'common',
      damage: 3, description: 'A worn blade, still sharp enough.',
      sprite: [[0,0,0,0,0,0,1,1],[0,0,0,0,0,1,1,2],[0,0,0,0,1,1,2,0],[0,0,0,1,1,2,0,0],[0,0,1,1,1,0,0,0],[0,1,1,0,0,0,0,0],[1,1,0,0,0,0,0,0],[1,0,0,0,0,0,0,0]],
    },
    {
      id: 'iron_sword', name: 'Iron Sword', type: 'weapon', rarity: 'magic',
      damage: 6, description: 'A sturdy iron blade.',
      sprite: [[0,0,0,0,0,0,1,2],[0,0,0,0,0,1,2,3],[0,0,0,0,1,2,3,0],[0,0,0,1,2,3,0,0],[0,0,1,2,1,0,0,0],[0,1,2,1,0,0,0,0],[1,2,1,0,0,0,0,0],[2,1,0,0,0,0,0,0]],
    },
    {
      id: 'flame_blade', name: 'Flame Blade', type: 'weapon', rarity: 'rare',
      damage: 10, stats: { strength: 2 }, description: 'A blade wreathed in eternal fire.',
      sprite: [[0,0,0,0,0,0,4,4],[0,0,0,0,0,4,4,3],[0,0,0,0,4,4,3,0],[0,0,0,4,4,3,0,0],[0,0,4,4,1,0,0,0],[0,4,4,1,0,0,0,0],[4,4,1,0,0,0,0,0],[4,1,0,0,0,0,0,0]],
    },
  ];

  const armors: Item[] = [
    {
      id: 'leather_armor', name: 'Leather Armor', type: 'armor', rarity: 'common',
      defense: 2, description: 'Basic leather protection.',
      sprite: [[0,1,1,1,1,1,1,0],[1,2,2,2,2,2,2,1],[1,2,3,3,3,3,2,1],[1,2,3,3,3,3,2,1],[1,2,3,3,3,3,2,1],[1,2,3,3,3,3,2,1],[0,1,2,3,3,2,1,0],[0,0,1,2,2,1,0,0]],
    },
    {
      id: 'chain_mail', name: 'Chain Mail', type: 'armor', rarity: 'magic',
      defense: 5, description: 'Interlocking metal rings.',
      sprite: [[0,1,1,1,1,1,1,0],[1,3,3,3,3,3,3,1],[1,3,4,3,4,3,3,1],[1,3,3,4,3,4,3,1],[1,3,4,3,4,3,3,1],[1,3,3,4,3,4,3,1],[0,1,3,3,3,3,1,0],[0,0,1,3,3,1,0,0]],
    },
    {
      id: 'shadow_plate', name: 'Shadow Plate', type: 'armor', rarity: 'rare',
      defense: 8, stats: { dexterity: 2 }, description: 'Armor forged in darkness.',
      sprite: [[0,1,1,1,1,1,1,0],[1,2,2,2,2,2,2,1],[1,2,1,2,1,2,2,1],[1,2,2,1,2,1,2,1],[1,2,1,2,1,2,2,1],[1,2,2,1,2,1,2,1],[0,1,2,2,2,2,1,0],[0,0,1,2,2,1,0,0]],
    },
  ];

  const potions: Item[] = [
    {
      id: 'health_potion', name: 'Health Potion', type: 'potion', rarity: 'common',
      healAmount: 20, description: 'Restores 20 HP.',
      sprite: [[0,0,1,1,1,1,0,0],[0,0,1,2,2,1,0,0],[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,3,3,3,3,1,0],[0,1,3,4,4,3,1,0],[0,1,3,4,4,3,1,0],[0,0,1,1,1,1,0,0]],
    },
    {
      id: 'mana_potion', name: 'Mana Potion', type: 'potion', rarity: 'common',
      manaAmount: 15, description: 'Restores 15 MP.',
      sprite: [[0,0,1,1,1,1,0,0],[0,0,1,2,2,1,0,0],[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,3,3,3,3,1,0],[0,1,3,4,4,3,1,0],[0,1,3,4,4,3,1,0],[0,0,1,1,1,1,0,0]],
    },
    {
      id: 'greater_health', name: 'Greater Health Potion', type: 'potion', rarity: 'magic',
      healAmount: 50, description: 'Restores 50 HP.',
      sprite: [[0,0,1,1,1,1,0,0],[0,0,1,4,4,1,0,0],[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,4,4,4,4,1,0],[0,1,4,4,4,4,1,0],[0,1,4,4,4,4,1,0],[0,0,1,1,1,1,0,0]],
    },
  ];

  const accessories: Item[] = [
    {
      id: 'iron_ring', name: 'Iron Ring', type: 'ring', rarity: 'common',
      stats: { strength: 1 }, description: '+1 Strength',
      sprite: [[0,0,1,1,1,1,0,0],[0,1,2,2,2,2,1,0],[1,2,0,0,0,0,2,1],[1,2,0,0,0,0,2,1],[1,2,0,0,0,0,2,1],[1,2,0,0,0,0,2,1],[0,1,2,2,2,2,1,0],[0,0,1,1,1,1,0,0]],
    },
    {
      id: 'ruby_ring', name: 'Ruby Ring', type: 'ring', rarity: 'rare',
      stats: { strength: 3, attack: 2 }, description: '+3 STR, +2 ATK',
      sprite: [[0,0,1,1,1,1,0,0],[0,1,4,4,4,4,1,0],[1,4,0,0,0,0,4,1],[1,4,0,0,0,0,4,1],[1,4,0,0,0,0,4,1],[1,4,0,0,0,0,4,1],[0,1,4,4,4,4,1,0],[0,0,1,1,1,1,0,0]],
    },
    {
      id: 'amulet_vitality', name: 'Amulet of Vitality', type: 'amulet', rarity: 'magic',
      stats: { vitality: 3, maxHp: 15 }, description: '+3 VIT, +15 Max HP',
      sprite: [[0,0,0,1,1,0,0,0],[0,0,1,2,2,1,0,0],[0,1,0,0,0,0,1,0],[0,0,0,1,1,0,0,0],[0,0,1,3,3,1,0,0],[0,0,1,3,4,1,0,0],[0,0,0,1,1,0,0,0],[0,0,0,0,0,0,0,0]],
    },
  ];

  const allItems = [...weapons, ...armors, ...potions, ...accessories];
  
  // Weight by rarity and level
  const rarityWeights: Record<string, number> = {
    common: 60 - level * 5,
    magic: 30,
    rare: 10 + level * 3,
    unique: 2 + level,
  };

  const weighted = allItems.filter(item => {
    const weight = rarityWeights[item.rarity] || 0;
    return Math.random() * 100 < weight;
  });

  if (weighted.length === 0) return potions[0];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function generateDungeon(level: number): DungeonLevel {
  const tiles = createEmptyGrid();
  const rooms: DungeonRoom[] = [];
  
  const numRooms = randomInt(6, 10) + Math.floor(level / 2);
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts && rooms.length < numRooms; i++) {
    const w = randomInt(4, 9);
    const h = randomInt(4, 7);
    const x = randomInt(1, DUNGEON_WIDTH - w - 1);
    const y = randomInt(1, DUNGEON_HEIGHT - h - 1);
    
    const room: DungeonRoom = { x, y, width: w, height: h, connected: false };
    
    let overlaps = false;
    for (const existing of rooms) {
      if (roomsOverlap(room, existing)) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      rooms.push(room);
      carveRoom(tiles, room);
    }
  }

  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const from = getRoomCenter(rooms[i - 1]);
    const to = getRoomCenter(rooms[i]);
    carveCorridor(tiles, from, to);
  }

  // Add some water/lava tiles
  for (let i = 0; i < 3 + level; i++) {
    const room = rooms[randomInt(1, rooms.length - 1)];
    const wx = randomInt(room.x + 1, room.x + room.width - 2);
    const wy = randomInt(room.y + 1, room.y + room.height - 2);
    if (tiles[wy][wx] === 'floor') {
      tiles[wy][wx] = level > 3 ? 'lava' : 'water';
    }
  }

  // Place stairs in last room
  const lastRoom = rooms[rooms.length - 1];
  const stairsPos = getRoomCenter(lastRoom);
  tiles[stairsPos.y][stairsPos.x] = 'stairs';

  // Place chests
  const chests: Position[] = [];
  for (let i = 0; i < 2 + Math.floor(level / 2); i++) {
    const room = rooms[randomInt(1, rooms.length - 2)];
    const cx = randomInt(room.x + 1, room.x + room.width - 2);
    const cy = randomInt(room.y + 1, room.y + room.height - 2);
    if (tiles[cy][cx] === 'floor') {
      tiles[cy][cx] = 'chest';
      chests.push({ x: cx, y: cy });
    }
  }

  // Place monsters
  const monsters: Monster[] = [];
  const numMonsters = 5 + level * 3;
  for (let i = 0; i < numMonsters; i++) {
    const room = rooms[randomInt(1, rooms.length - 1)];
    const mx = randomInt(room.x + 1, room.x + room.width - 2);
    const my = randomInt(room.y + 1, room.y + room.height - 2);
    if (tiles[my][mx] === 'floor') {
      monsters.push(createMonster(level, { x: mx, y: my }));
    }
  }

  // Place items on floor
  const items: { pos: Position; item: Item }[] = [];
  for (let i = 0; i < 3 + level; i++) {
    const room = rooms[randomInt(0, rooms.length - 1)];
    const ix = randomInt(room.x + 1, room.x + room.width - 2);
    const iy = randomInt(room.y + 1, room.y + room.height - 2);
    if (tiles[iy][ix] === 'floor') {
      items.push({ pos: { x: ix, y: iy }, item: createItem(level) });
    }
  }

  // Player start in first room
  const playerStart = getRoomCenter(rooms[0]);

  // Initialize visibility
  const revealed: boolean[][] = [];
  const visible: boolean[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    revealed[y] = new Array(DUNGEON_WIDTH).fill(false);
    visible[y] = new Array(DUNGEON_WIDTH).fill(false);
  }

  return {
    tiles,
    revealed,
    visible,
    rooms,
    monsters,
    items,
    chests,
    stairsPos,
    playerStart,
    level,
  };
}

export function computeFOV(
  tiles: TileType[][],
  revealed: boolean[][],
  visible: boolean[][],
  center: Position,
  radius: number
): void {
  // Reset visible
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      visible[y][x] = false;
    }
  }

  // Simple raycasting FOV
  const numRays = 360;
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let x = center.x + 0.5;
    let y = center.y + 0.5;

    for (let step = 0; step < radius; step++) {
      const tileX = Math.floor(x);
      const tileY = Math.floor(y);

      if (tileX < 0 || tileX >= DUNGEON_WIDTH || tileY < 0 || tileY >= DUNGEON_HEIGHT) break;

      visible[tileY][tileX] = true;
      revealed[tileY][tileX] = true;

      if (tiles[tileY][tileX] === 'wall') break;

      x += dx;
      y += dy;
    }
  }
}
