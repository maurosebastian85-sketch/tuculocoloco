import { Skill } from './types';

export const ALL_SKILLS: Skill[] = [
  {
    id: 'fireball',
    name: 'Bola de Fuego',
    description: 'Lanza una esfera de fuego que explota al impactar',
    manaCost: 5,
    damage: 15,
    type: 'fire',
    cooldown: 1000,
    lastUsed: 0,
    unlocked: false,
    level: 1,
    sprite: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,2,2,1,0,0],
      [0,1,2,3,3,2,1,0],
      [1,2,3,4,4,3,2,1],
      [1,2,3,4,4,3,2,1],
      [0,1,2,3,3,2,1,0],
      [0,0,1,2,2,1,0,0],
      [0,0,0,1,1,0,0,0],
    ]
  },
  {
    id: 'ice_shard',
    name: 'Fragmento de Hielo',
    description: 'Dispara un cristal de hielo que congela enemigos',
    manaCost: 4,
    damage: 12,
    type: 'ice',
    cooldown: 800,
    lastUsed: 0,
    unlocked: false,
    level: 1,
    sprite: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,2,2,1,0,0],
      [0,1,2,3,3,2,1,0],
      [1,2,3,4,4,3,2,1],
      [1,2,3,4,4,3,2,1],
      [0,1,2,3,3,2,1,0],
      [0,0,1,2,2,1,0,0],
      [0,0,0,1,1,0,0,0],
    ]
  },
  {
    id: 'lightning_bolt',
    name: 'Rayo',
    description: 'Invoca un rayo devastador en línea recta',
    manaCost: 8,
    damage: 25,
    type: 'lightning',
    cooldown: 2000,
    lastUsed: 0,
    unlocked: false,
    level: 1,
    sprite: [
      [0,0,0,0,0,1,1,0],
      [0,0,0,0,1,2,1,0],
      [0,0,0,1,2,1,0,0],
      [0,0,1,2,1,0,0,0],
      [0,1,2,1,0,0,0,0],
      [1,2,1,0,0,0,0,0],
      [1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
    ]
  },
  {
    id: 'heal',
    name: 'Curación',
    description: 'Restaura 30 puntos de vida',
    manaCost: 10,
    damage: -30, // Negative = healing
    type: 'heal',
    cooldown: 5000,
    lastUsed: 0,
    unlocked: false,
    level: 1,
    sprite: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,2,2,1,0,0],
      [0,1,2,3,3,2,1,0],
      [1,2,3,4,4,3,2,1],
      [1,2,3,4,4,3,2,1],
      [0,1,2,3,3,2,1,0],
      [0,0,1,2,2,1,0,0],
      [0,0,0,1,1,0,0,0],
    ]
  },
  {
    id: 'fire_wall',
    name: 'Muro de Fuego',
    description: 'Crea una pared de llamas que daña enemigos',
    manaCost: 12,
    damage: 20,
    type: 'fire',
    cooldown: 3000,
    lastUsed: 0,
    unlocked: false,
    level: 1,
    sprite: [
      [0,1,0,1,0,1,0,1],
      [1,2,1,2,1,2,1,2],
      [2,3,2,3,2,3,2,3],
      [3,4,3,4,3,4,3,4],
      [3,4,3,4,3,4,3,4],
      [2,3,2,3,2,3,2,3],
      [1,2,1,2,1,2,1,2],
      [0,1,0,1,0,1,0,1],
    ]
  },
  {
    id: 'frost_nova',
    name: 'Nova de Escarcha',
    description: 'Congela a todos los enemigos cercanos',
    manaCost: 15,
    damage: 18,
    type: 'ice',
    cooldown: 4000,
    lastUsed: 0,
    unlocked: false,
    level: 1,
    sprite: [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [1,2,3,3,3,3,2,1],
      [1,2,3,4,4,3,2,1],
      [1,2,3,4,4,3,2,1],
      [1,2,3,3,3,3,2,1],
      [0,1,2,2,2,2,1,0],
      [0,0,1,1,1,1,0,0],
    ]
  },
];

export function getRandomSkill(): Skill {
  const locked = ALL_SKILLS.filter(s => !s.unlocked);
  if (locked.length === 0) return ALL_SKILLS[0];
  return { ...locked[Math.floor(Math.random() * locked.length)] };
}

export function createSkillScroll(skill: Skill): any {
  return {
    id: `scroll_${skill.id}`,
    name: `Pergamino: ${skill.name}`,
    type: 'scroll' as const,
    rarity: 'rare' as const,
    description: skill.description,
    skill: skill,
    sprite: [
      [0,1,1,1,1,1,1,0],
      [1,2,2,2,2,2,2,1],
      [1,2,3,3,3,3,2,1],
      [1,2,3,4,4,3,2,1],
      [1,2,3,4,4,3,2,1],
      [1,2,3,3,3,3,2,1],
      [1,2,2,2,2,2,2,1],
      [0,1,1,1,1,1,1,0],
    ]
  };
}
