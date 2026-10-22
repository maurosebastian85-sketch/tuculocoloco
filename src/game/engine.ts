import { Player, Monster, Position, Particle, GameMessage, GameState, Item, Projectile, Skill } from './types';
import { DungeonLevel, generateDungeon, computeFOV, DUNGEON_WIDTH, DUNGEON_HEIGHT } from './dungeon';
import { getNarrativeEvent } from './narrative';
import { ALL_SKILLS, getRandomSkill, createSkillScroll } from './skills';

const VISION_RADIUS = 8;

export class GameEngine {
  player: Player;
  dungeon: DungeonLevel;
  messages: GameMessage[] = [];
  particles: Particle[] = [];
  projectiles: Projectile[] = [];
  gameState: GameState = 'menu';
  dungeonLevel: number = 1;
  turn: number = 0;
  cameraX: number = 0;
  cameraY: number = 0;
  onStateChange?: () => void;
  animFrame: number = 0;
  killedOnFloor: boolean = false;
  foundItemOnFloor: boolean = false;
  narrativeShown: Set<string> = new Set();

  constructor() {
    this.player = this.createPlayer();
    this.dungeon = generateDungeon(1);
  }

  createPlayer(): Player {
    return {
      pos: { x: 0, y: 0 },
      stats: {
        hp: 50,
        maxHp: 50,
        mp: 20,
        maxMp: 20,
        strength: 5,
        dexterity: 4,
        vitality: 5,
        magic: 3,
        defense: 2,
        attack: 4,
        level: 1,
        exp: 0,
        expToNext: 30,
        gold: 0,
      },
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
        ring: null,
        amulet: null,
      },
      direction: { x: 0, y: 1 },
      isAttacking: false,
      attackTimer: 0,
      invulnerable: 0,
      gold: 0,
      skills: [],
      attackMode: 'melee',
    };
  }

  startGame(): void {
    this.player = this.createPlayer();
    this.dungeonLevel = 1;
    this.dungeon = generateDungeon(1);
    this.player.pos = { ...this.dungeon.playerStart };
    this.messages = [];
    this.particles = [];
    this.projectiles = [];
    this.gameState = 'playing';
    this.turn = 0;
    this.killedOnFloor = false;
    this.foundItemOnFloor = false;
    this.narrativeShown = new Set();
    
    // Give player the first skill (fireball) at start but not unlocked yet
    this.player.skills = [{ ...ALL_SKILLS[0], unlocked: false }];
    
    this.addMessage('...', '#666666');
    this.triggerNarrative('enter');
    this.addMessage('WASD: Mover | Espacio: Atacar | F: Habilidad | I: Inventario', '#555555');
    this.addMessage('Tab: Cambiar ataque (Cuerpo/Arco)', '#555555');
    computeFOV(this.dungeon.tiles, this.dungeon.revealed, this.dungeon.visible, this.player.pos, VISION_RADIUS);
    this.onStateChange?.();
  }

  triggerNarrative(trigger: 'enter' | 'first_kill' | 'find_item' | 'boss'): void {
    const key = `${this.dungeonLevel}_${trigger}`;
    if (this.narrativeShown.has(key)) return;
    
    const event = getNarrativeEvent(this.dungeonLevel, trigger);
    if (event) {
      this.narrativeShown.add(key);
      // Add with delay effect (multiple messages)
      setTimeout(() => {
        this.addMessage(`--- ${event.text} ---`, event.color);
        this.onStateChange?.();
      }, 500);
    }
  }

  nextLevel(): void {
    this.dungeonLevel++;
    this.dungeon = generateDungeon(this.dungeonLevel);
    this.player.pos = { ...this.dungeon.playerStart };
    this.particles = [];
    this.projectiles = [];
    this.killedOnFloor = false;
    this.foundItemOnFloor = false;
    
    this.addMessage(`Desciendes al piso ${this.dungeonLevel}...`, '#aaaaff');
    this.triggerNarrative('enter');
    
    computeFOV(this.dungeon.tiles, this.dungeon.revealed, this.dungeon.visible, this.player.pos, VISION_RADIUS);
    this.onStateChange?.();
  }

  addMessage(text: string, color: string = '#ffffff'): void {
    this.messages.unshift({ text, color, time: Date.now() });
    if (this.messages.length > 50) this.messages.pop();
  }

  getPlayerAttack(): number {
    let atk = this.player.stats.attack + Math.floor(this.player.stats.strength / 2);
    if (this.player.equipment.weapon?.damage) {
      atk += this.player.equipment.weapon.damage;
    }
    return atk;
  }

  getPlayerDefense(): number {
    let def = this.player.stats.defense;
    if (this.player.equipment.armor?.defense) {
      def += this.player.equipment.armor.defense;
    }
    return def;
  }

  toggleAttackMode(): void {
    if (this.player.attackMode === 'melee') {
      this.player.attackMode = 'ranged';
      this.addMessage('Modo: Arco y Flecha', '#88cc88');
    } else {
      this.player.attackMode = 'melee';
      this.addMessage('Modo: Espada', '#cc8888');
    }
    this.onStateChange?.();
  }

  shootArrow(): void {
    if (this.gameState !== 'playing') return;
    
    const dir = this.player.direction;
    if (dir.x === 0 && dir.y === 0) return;
    
    this.player.isAttacking = true;
    this.player.attackTimer = 300;
    
    this.projectiles.push({
      pos: { x: this.player.pos.x, y: this.player.pos.y },
      dir: { x: dir.x, y: dir.y },
      speed: 0.25,
      damage: this.getPlayerAttack() + Math.floor(this.player.stats.dexterity / 2),
      distance: 0,
      maxDistance: 10,
      fromPlayer: true,
    });

    this.addMessage('¡Disparas una flecha!', '#aacc88');
    this.processTurn();
  }

  useSkill(skillIndex: number): void {
    if (this.gameState !== 'playing') return;
    
    const skill = this.player.skills[skillIndex];
    if (!skill || !skill.unlocked) {
      this.addMessage('Habilidad no desbloqueada', '#888888');
      return;
    }

    const now = Date.now();
    if (now - skill.lastUsed < skill.cooldown) {
      const remaining = Math.ceil((skill.cooldown - (now - skill.lastUsed)) / 1000);
      this.addMessage(`${skill.name} en enfriamiento (${remaining}s)`, '#888888');
      return;
    }

    if (this.player.stats.mp < skill.manaCost) {
      this.addMessage('¡Mana insuficiente!', '#4444ff');
      return;
    }

    this.player.stats.mp -= skill.manaCost;
    skill.lastUsed = now;

    const dir = this.player.direction;

    switch (skill.type) {
      case 'fire':
        this.castFireSkill(skill, dir);
        break;
      case 'ice':
        this.castIceSkill(skill, dir);
        break;
      case 'lightning':
        this.castLightningSkill(skill, dir);
        break;
      case 'heal':
        this.castHealSkill(skill);
        break;
    }

    this.processTurn();
  }

  castFireSkill(skill: Skill, dir: Position): void {
    if (skill.id === 'fire_wall') {
      // Create multiple fire projectiles in a spread
      for (let i = -1; i <= 1; i++) {
        const perpX = -dir.y * i;
        const perpY = dir.x * i;
        this.projectiles.push({
          pos: { x: this.player.pos.x + perpX, y: this.player.pos.y + perpY },
          dir: { x: dir.x, y: dir.y },
          speed: 0.12,
          damage: skill.damage || 15,
          distance: 0,
          maxDistance: 6,
          fromPlayer: true,
        });
      }
      this.addMessage(`¡${skill.name}!`, '#ff6600');
      this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ff4400', 8);
    } else {
      // Single fireball
      this.projectiles.push({
        pos: { x: this.player.pos.x, y: this.player.pos.y },
        dir: { x: dir.x, y: dir.y },
        speed: 0.15,
        damage: skill.damage || 15,
        distance: 0,
        maxDistance: 8,
        fromPlayer: true,
      });
      this.addMessage(`¡${skill.name}!`, '#ff8800');
      this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ff8800', 5);
    }
  }

  castIceSkill(skill: Skill, dir: Position): void {
    if (skill.id === 'frost_nova') {
      // Damage all nearby enemies
      for (const monster of this.dungeon.monsters) {
        if (monster.isDead) continue;
        const dist = Math.abs(monster.pos.x - this.player.pos.x) + Math.abs(monster.pos.y - this.player.pos.y);
        if (dist <= 4) {
          const dmg = Math.max(1, (skill.damage || 18) - monster.defense);
          monster.hp -= dmg;
          this.spawnParticles(monster.pos.x, monster.pos.y, '#88ccff', 8);
          if (monster.hp <= 0) {
            monster.isDead = true;
            monster.deathTimer = 500;
            this.gainExp(monster.exp);
          }
        }
      }
      this.spawnParticles(this.player.pos.x, this.player.pos.y, '#aaddff', 20);
      this.addMessage(`¡${skill.name}!`, '#88ccff');
    } else {
      // Ice shard projectile
      this.projectiles.push({
        pos: { x: this.player.pos.x, y: this.player.pos.y },
        dir: { x: dir.x, y: dir.y },
        speed: 0.2,
        damage: skill.damage || 12,
        distance: 0,
        maxDistance: 7,
        fromPlayer: true,
      });
      this.addMessage(`¡${skill.name}!`, '#88ccff');
      this.spawnParticles(this.player.pos.x, this.player.pos.y, '#88ccff', 5);
    }
  }

  castLightningSkill(skill: Skill, dir: Position): void {
    // Lightning pierces through enemies in a line
    for (let i = 1; i <= 8; i++) {
      const tx = this.player.pos.x + dir.x * i;
      const ty = this.player.pos.y + dir.y * i;
      
      if (tx < 0 || tx >= DUNGEON_WIDTH || ty < 0 || ty >= DUNGEON_HEIGHT) break;
      if (this.dungeon.tiles[ty][tx] === 'wall') break;
      
      this.spawnParticles(tx, ty, '#ffff44', 3);
      
      for (const monster of this.dungeon.monsters) {
        if (monster.isDead) continue;
        if (monster.pos.x === tx && monster.pos.y === ty) {
          const dmg = Math.max(1, (skill.damage || 25) - monster.defense);
          monster.hp -= dmg;
          this.addMessage(`¡Rayo impacta a ${monster.name} por ${dmg}!`, '#ffff44');
          if (monster.hp <= 0) {
            monster.isDead = true;
            monster.deathTimer = 500;
            this.gainExp(monster.exp);
          }
        }
      }
    }
    this.addMessage(`¡${skill.name}!`, '#ffff44');
  }

  castHealSkill(skill: Skill): void {
    const healAmount = Math.abs(skill.damage || 30);
    this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + healAmount);
    this.spawnParticles(this.player.pos.x, this.player.pos.y, '#44ff44', 15);
    this.addMessage(`¡${skill.name}! +${healAmount} HP`, '#44ff44');
  }

  learnSkill(skill: Skill): void {
    // Check if already learned
    const existing = this.player.skills.find(s => s.id === skill.id);
    if (existing) {
      existing.unlocked = true;
      this.addMessage(`¡Habilidad renovada: ${skill.name}!`, '#ffdd44');
    } else {
      this.player.skills.push({ ...skill, unlocked: true, lastUsed: 0 });
      this.addMessage(`¡Nueva habilidad: ${skill.name}!`, '#ffdd44');
      this.addMessage(`  "${skill.description}"`, '#aaaaaa');
    }
    this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ffdd44', 20);
  }

  updateProjectiles(): void {
    for (const proj of this.projectiles) {
      proj.pos.x += proj.dir.x * proj.speed;
      proj.pos.y += proj.dir.y * proj.speed;
      proj.distance += proj.speed;

      const tileX = Math.floor(proj.pos.x);
      const tileY = Math.floor(proj.pos.y);
      
      // Check wall collision
      if (
        tileX < 0 || tileX >= DUNGEON_WIDTH ||
        tileY < 0 || tileY >= DUNGEON_HEIGHT ||
        this.dungeon.tiles[tileY]?.[tileX] === 'wall'
      ) {
        this.spawnParticles(tileX, tileY, '#ff4400', 10);
        proj.distance = proj.maxDistance;
        continue;
      }

      // Check monster collision
      for (const monster of this.dungeon.monsters) {
        if (monster.isDead) continue;
        if (Math.floor(monster.pos.x) === tileX && Math.floor(monster.pos.y) === tileY) {
          const dmg = Math.max(1, proj.damage - monster.defense);
          monster.hp -= dmg;
          this.addMessage(`Impacto por ${dmg} daño!`, '#ff8888');
          this.spawnParticles(monster.pos.x, monster.pos.y, '#ff4400', 12);
          
          if (monster.hp <= 0) {
            monster.isDead = true;
            monster.deathTimer = 500;
            this.addMessage(`¡${monster.name} destruido!`, '#44ff44');
            this.gainExp(monster.exp);
            this.spawnParticles(monster.pos.x, monster.pos.y, monster.color, 15);
            
            // Trigger narrative on first kill
            if (!this.killedOnFloor) {
              this.killedOnFloor = true;
              this.triggerNarrative('first_kill');
            }
          }
          proj.distance = proj.maxDistance;
          break;
        }
      }

      // Trail particles
      this.spawnParticles(tileX, tileY, '#ff6600', 1);
    }

    this.projectiles = this.projectiles.filter(p => p.distance < p.maxDistance);
  }

  movePlayer(dx: number, dy: number): void {
    if (this.gameState !== 'playing') return;

    const newX = this.player.pos.x + dx;
    const newY = this.player.pos.y + dy;
    this.player.direction = { x: dx, y: dy };

    if (newX < 0 || newX >= DUNGEON_WIDTH || newY < 0 || newY >= DUNGEON_HEIGHT) return;

    // Check for monster at target
    const monster = this.dungeon.monsters.find(
      m => !m.isDead && m.pos.x === newX && m.pos.y === newY
    );
    if (monster) {
      this.attackMonster(monster);
      this.processTurn();
      return;
    }

    // Check tile
    const tile = this.dungeon.tiles[newY][newX];
    if (tile === 'wall') return;

    // Move player
    this.player.pos.x = newX;
    this.player.pos.y = newY;

    // Check for items
    this.pickupItems();

    // Check for stairs
    if (tile === 'stairs') {
      this.addMessage('Presiona ENTER para descender...', '#ffdd44');
    }

    // Check for hazards
    if (tile === 'lava') {
      const dmg = 5 + this.dungeonLevel * 2;
      this.player.stats.hp -= dmg;
      this.addMessage(`¡La lava te quema por ${dmg} daño!`, '#ff4400');
      this.spawnParticles(newX, newY, '#ff4400', 5);
      if (this.player.stats.hp <= 0) {
        this.playerDeath();
        return;
      }
    }

    this.processTurn();
  }

  attackMonster(monster: Monster): void {
    if (this.player.attackMode === 'ranged') {
      // Ranged attack shoots arrow
      this.shootArrow();
      return;
    }

    // Melee attack
    const atk = this.getPlayerAttack();
    const dmg = Math.max(1, atk - monster.defense + Math.floor(Math.random() * 3));
    const crit = Math.random() < (this.player.stats.dexterity / 50);
    const finalDmg = crit ? dmg * 2 : dmg;

    monster.hp -= finalDmg;
    this.player.isAttacking = true;
    this.player.attackTimer = 200;

    this.spawnParticles(monster.pos.x, monster.pos.y, '#ff4444', 8);

    if (crit) {
      this.addMessage(`¡CRÍTICO! Golpeas a ${monster.name} por ${finalDmg} daño!`, '#ffff00');
    } else {
      this.addMessage(`Golpeas a ${monster.name} por ${finalDmg} daño.`, '#ff8888');
    }

    if (monster.hp <= 0) {
      monster.isDead = true;
      monster.deathTimer = 500;
      this.addMessage(`¡${monster.name} destruido!`, '#44ff44');
      this.gainExp(monster.exp);
      this.spawnParticles(monster.pos.x, monster.pos.y, monster.color, 15);
      
      // Chance to drop gold
      if (Math.random() < 0.5) {
        const gold = Math.floor(Math.random() * 10 * this.dungeonLevel) + 1;
        this.player.stats.gold += gold;
        this.addMessage(`¡Encuentras ${gold} oro!`, '#ffdd00');
      }

      // Trigger narrative on first kill
      if (!this.killedOnFloor) {
        this.killedOnFloor = true;
        this.triggerNarrative('first_kill');
      }
    }
  }

  gainExp(amount: number): void {
    this.player.stats.exp += amount;
    while (this.player.stats.exp >= this.player.stats.expToNext) {
      this.player.stats.exp -= this.player.stats.expToNext;
      this.player.stats.level++;
      this.player.stats.expToNext = Math.floor(this.player.stats.expToNext * 1.5);
      this.player.stats.maxHp += 5 + this.player.stats.vitality;
      this.player.stats.hp = this.player.stats.maxHp;
      this.player.stats.maxMp += 3;
      this.player.stats.mp = this.player.stats.maxMp;
      this.player.stats.strength += 1;
      this.player.stats.attack += 1;
      this.addMessage(`¡SUBIDA DE NIVEL! Ahora eres nivel ${this.player.stats.level}!`, '#ffff00');
      this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ffff00', 20);
    }
  }

  pickupItems(): void {
    const itemsHere = this.dungeon.items.filter(
      i => i.pos.x === this.player.pos.x && i.pos.y === this.player.pos.y
    );

    for (const itemData of itemsHere) {
      if (this.player.inventory.length < 20) {
        this.player.inventory.push(itemData.item);
        this.addMessage(`Recogido: ${itemData.item.name}`, this.getRarityColor(itemData.item.rarity));
        this.dungeon.items = this.dungeon.items.filter(i => i !== itemData);
        
        // Handle skill scrolls
        if (itemData.item.type === 'scroll' && (itemData.item as any).skill) {
          this.learnSkill((itemData.item as any).skill);
          this.player.inventory.pop(); // Remove scroll after learning
        }

        // Trigger narrative on first item
        if (!this.foundItemOnFloor) {
          this.foundItemOnFloor = true;
          this.triggerNarrative('find_item');
        }
      } else {
        this.addMessage('¡Inventario lleno!', '#ff4444');
      }
    }

    // Open chests
    if (this.dungeon.tiles[this.player.pos.y][this.player.pos.x] === 'chest') {
      this.dungeon.tiles[this.player.pos.y][this.player.pos.x] = 'floor';
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numItems; i++) {
        if (this.player.inventory.length < 20) {
          // Higher chance of skill scroll from chests
          if (Math.random() < 0.3) {
            const skill = getRandomSkill();
            const scroll = createSkillScroll(skill);
            this.player.inventory.push(scroll);
            this.addMessage(`¡Encontraste: ${scroll.name}!`, '#ffdd44');
            this.learnSkill(skill);
            this.player.inventory.pop();
          } else {
            const item = this.generateChestItem();
            this.player.inventory.push(item);
            this.addMessage(`Encontraste: ${item.name}`, this.getRarityColor(item.rarity));
          }
        }
      }
      const gold = Math.floor(Math.random() * 20 * this.dungeonLevel) + 5;
      this.player.stats.gold += gold;
      this.addMessage(`¡${gold} oro en el cofre!`, '#ffdd00');
      this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ffdd00', 10);
      
      // Trigger narrative
      if (!this.foundItemOnFloor) {
        this.foundItemOnFloor = true;
        this.triggerNarrative('find_item');
      }
    }
  }

  generateChestItem(): Item {
    const items: Item[] = [
      {
        id: 'health_potion', name: 'Poción de Vida', type: 'potion', rarity: 'common',
        healAmount: 20, description: 'Restaura 20 HP.',
        sprite: [[0,0,1,1,1,1,0,0],[0,0,1,2,2,1,0,0],[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,3,3,3,3,1,0],[0,1,3,4,4,3,1,0],[0,1,3,4,4,3,1,0],[0,0,1,1,1,1,0,0]],
      },
      {
        id: 'iron_sword', name: 'Espada de Acero', type: 'weapon', rarity: 'magic',
        damage: 7, description: 'Una hoja bien forjada.',
        sprite: [[0,0,0,0,0,0,1,2],[0,0,0,0,0,1,2,3],[0,0,0,0,1,2,3,0],[0,0,0,1,2,3,0,0],[0,0,1,2,1,0,0,0],[0,1,2,1,0,0,0,0],[1,2,1,0,0,0,0,0],[2,1,0,0,0,0,0,0]],
      },
      {
        id: 'gold_ring', name: 'Anillo de Oro', type: 'ring', rarity: 'rare',
        stats: { strength: 2, dexterity: 1 }, description: '+2 FUE, +1 DES',
        sprite: [[0,0,1,1,1,1,0,0],[0,1,4,4,4,4,1,0],[1,4,0,0,0,0,4,1],[1,4,0,0,0,0,4,1],[1,4,0,0,0,0,4,1],[1,4,0,0,0,0,4,1],[0,1,4,4,4,4,1,0],[0,0,1,1,1,1,0,0]],
      },
    ];
    return items[Math.floor(Math.random() * items.length)];
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#ffffff';
      case 'magic': return '#4488ff';
      case 'rare': return '#aa44ff';
      case 'unique': return '#ff8800';
      default: return '#ffffff';
    }
  }

  useItem(item: Item, index: number): void {
    if (item.type === 'potion') {
      if (item.healAmount) {
        this.player.stats.hp = Math.min(
          this.player.stats.maxHp,
          this.player.stats.hp + item.healAmount
        );
        this.addMessage(`Usaste ${item.name}. +${item.healAmount} HP.`, '#44ff44');
      }
      if (item.manaAmount) {
        this.player.stats.mp = Math.min(
          this.player.stats.maxMp,
          this.player.stats.mp + item.manaAmount
        );
        this.addMessage(`Usaste ${item.name}. +${item.manaAmount} MP.`, '#4444ff');
      }
      this.player.inventory.splice(index, 1);
    } else if (item.type === 'scroll' && (item as any).skill) {
      // Learn skill from scroll
      this.learnSkill((item as any).skill);
      this.player.inventory.splice(index, 1);
    } else if (item.type === 'weapon') {
      if (this.player.equipment.weapon) {
        this.player.inventory.push(this.player.equipment.weapon);
      }
      this.player.equipment.weapon = item;
      this.player.inventory.splice(index, 1);
      this.addMessage(`Equipaste ${item.name}.`, '#ffdd44');
    } else if (item.type === 'armor') {
      if (this.player.equipment.armor) {
        this.player.inventory.push(this.player.equipment.armor);
      }
      this.player.equipment.armor = item;
      this.player.inventory.splice(index, 1);
      this.addMessage(`Equipaste ${item.name}.`, '#ffdd44');
    } else if (item.type === 'ring') {
      if (this.player.equipment.ring) {
        this.player.inventory.push(this.player.equipment.ring);
      }
      this.player.equipment.ring = item;
      this.player.inventory.splice(index, 1);
      this.addMessage(`Equipaste ${item.name}.`, '#ffdd44');
      if (item.stats) {
        if (item.stats.strength) this.player.stats.strength += item.stats.strength;
        if (item.stats.dexterity) this.player.stats.dexterity += item.stats.dexterity;
      }
    } else if (item.type === 'amulet') {
      if (this.player.equipment.amulet) {
        this.player.inventory.push(this.player.equipment.amulet);
      }
      this.player.equipment.amulet = item;
      this.player.inventory.splice(index, 1);
      this.addMessage(`Equipaste ${item.name}.`, '#ffdd44');
      if (item.stats) {
        if (item.stats.vitality) this.player.stats.vitality += item.stats.vitality;
        if (item.stats.maxHp) this.player.stats.maxHp += item.stats.maxHp;
      }
    }
    this.onStateChange?.();
  }

  dropItem(index: number): void {
    const item = this.player.inventory[index];
    this.addMessage(`Soltaste ${item.name}.`, '#888888');
    this.player.inventory.splice(index, 1);
    this.onStateChange?.();
  }

  processTurn(): void {
    this.turn++;
    
    // Update FOV
    computeFOV(this.dungeon.tiles, this.dungeon.revealed, this.dungeon.visible, this.player.pos, VISION_RADIUS);

    // Move monsters
    this.moveMonsters();

    // Natural regen
    if (this.turn % 10 === 0) {
      if (this.player.stats.hp < this.player.stats.maxHp) {
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 1);
      }
      if (this.player.stats.mp < this.player.stats.maxMp) {
        this.player.stats.mp = Math.min(this.player.stats.maxMp, this.player.stats.mp + 1);
      }
    }

    // Decrease invulnerability
    if (this.player.invulnerable > 0) this.player.invulnerable--;

    this.onStateChange?.();
  }

  moveMonsters(): void {
    const now = Date.now();
    
    for (const monster of this.dungeon.monsters) {
      if (monster.isDead) {
        monster.deathTimer -= 16;
        continue;
      }

      if (now - monster.lastMove < monster.speed) continue;
      monster.lastMove = now;

      const dx = this.player.pos.x - monster.pos.x;
      const dy = this.player.pos.y - monster.pos.y;
      const dist = Math.abs(dx) + Math.abs(dy);

      if (dist > 12) continue;
      if (!this.dungeon.visible[monster.pos.y]?.[monster.pos.x] && dist > 6) continue;

      // Attack if adjacent
      if (dist === 1) {
        this.monsterAttackPlayer(monster);
        continue;
      }

      // Move toward player
      let moveX = 0;
      let moveY = 0;

      if (Math.abs(dx) > Math.abs(dy)) {
        moveX = dx > 0 ? 1 : -1;
      } else {
        moveY = dy > 0 ? 1 : -1;
      }

      const newX = monster.pos.x + moveX;
      const newY = monster.pos.y + moveY;

      if (
        newX >= 0 && newX < DUNGEON_WIDTH &&
        newY >= 0 && newY < DUNGEON_HEIGHT &&
        this.dungeon.tiles[newY][newX] !== 'wall' &&
        !(newX === this.player.pos.x && newY === this.player.pos.y) &&
        !this.dungeon.monsters.some(m => !m.isDead && m !== monster && m.pos.x === newX && m.pos.y === newY)
      ) {
        monster.pos.x = newX;
        monster.pos.y = newY;
      }
    }

    this.dungeon.monsters = this.dungeon.monsters.filter(m => !m.isDead || m.deathTimer > 0);
  }

  monsterAttackPlayer(monster: Monster): void {
    if (this.player.invulnerable > 0) return;

    const dmg = Math.max(1, monster.attack - this.getPlayerDefense() + Math.floor(Math.random() * 2));
    this.player.stats.hp -= dmg;
    this.player.invulnerable = 2;
    
    this.addMessage(`¡${monster.name} te golpea por ${dmg} daño!`, '#ff4444');
    this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ff0000', 5);

    if (this.player.stats.hp <= 0) {
      this.playerDeath();
    }
  }

  playerDeath(): void {
    this.gameState = 'dead';
    this.addMessage('Has muerto...', '#ff0000');
    this.spawnParticles(this.player.pos.x, this.player.pos.y, '#ff0000', 30);
    this.onStateChange?.();
  }

  spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x * 16 + 8,
        y: y * 16 + 8,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  updateParticles(): void {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  updateCamera(canvasWidth: number, canvasHeight: number, tileSize: number): void {
    const targetX = this.player.pos.x * tileSize - canvasWidth / 2 + tileSize / 2;
    const targetY = this.player.pos.y * tileSize - canvasHeight / 2 + tileSize / 2;
    
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraY += (targetY - this.cameraY) * 0.1;
  }
}
