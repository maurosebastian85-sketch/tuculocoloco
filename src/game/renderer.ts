import { GameEngine } from './engine';
import { TileType, Player, Monster, Position } from './types';
import { DUNGEON_WIDTH, DUNGEON_HEIGHT } from './dungeon';
import {
  PLAYER_SPRITE_DOWN,
  SKELETON_SPRITE,
  DEMON_SPRITE,
  GHOST_SPRITE,
  BAT_SPRITE,
  CHEST_SPRITE,
  STAIRS_SPRITE,
  PALETTES,
} from './sprites';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tileSize: number = 24;
  engine: GameEngine;
  fogCanvas: HTMLCanvasElement;
  fogCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, engine: GameEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    this.ctx.imageSmoothingEnabled = false;
    
    this.fogCanvas = document.createElement('canvas');
    this.fogCtx = this.fogCanvas.getContext('2d')!;
  }

  render(): void {
    const { ctx, canvas, engine, tileSize } = this;
    
    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (engine.gameState === 'menu') {
      this.renderMenu();
      return;
    }

    if (engine.gameState === 'dead') {
      this.renderDeathScreen();
      return;
    }

    // Update camera
    engine.updateCamera(canvas.width, canvas.height, tileSize);

    ctx.save();
    ctx.translate(-Math.floor(engine.cameraX), -Math.floor(engine.cameraY));

    // Render tiles
    this.renderTiles();

    // Render items on ground
    this.renderGroundItems();

    // Render monsters
    this.renderMonsters();

    // Render player
    this.renderPlayer();

    // Render projectiles
    this.renderProjectiles();

    // Render particles
    this.renderParticles();

    // Render fog of war
    this.renderFog();

    ctx.restore();

    // Render UI overlay
    this.renderUI();

    // Vignette effect
    this.renderVignette();
  }

  renderVignette(): void {
    const { ctx, canvas } = this;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.max(canvas.width, canvas.height) * 0.7;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.4, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  renderMenu(): void {
    const { ctx, canvas } = this;
    
    // Dark background with pixel pattern
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative border
    const time = Date.now() / 1000;
    ctx.strokeStyle = `hsl(${(time * 20) % 360}, 50%, 30%)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Title shadow
    ctx.fillStyle = '#220000';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('DUNGEON DEPTHS', canvas.width / 2 + 2, canvas.height / 3 + 2);
    
    // Title
    const gradient = ctx.createLinearGradient(0, canvas.height / 3 - 20, 0, canvas.height / 3 + 20);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#ffaa00');
    gradient.addColorStop(1, '#ff4444');
    ctx.fillStyle = gradient;
    ctx.font = 'bold 36px monospace';
    ctx.fillText('DUNGEON DEPTHS', canvas.width / 2, canvas.height / 3);

    // Subtitle
    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.fillText('A Pixel Art Dungeon Crawler', canvas.width / 2, canvas.height / 3 + 40);

    // Start prompt
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    ctx.font = '18px monospace';
    ctx.fillText('Press ENTER or Click to Begin', canvas.width / 2, canvas.height / 2 + 40);

    // Controls
    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.fillText('WASD/Arrows: Move  |  Space: Attack  |  F: Fireball  |  I: Inventory', canvas.width / 2, canvas.height - 80);
    ctx.fillText('ENTER: Descend Stairs  |  1-4: Use Quick Potion', canvas.width / 2, canvas.height - 60);

    // Decorative pixel art
    this.drawPixelSprite(ctx, canvas.width / 2 - 80, canvas.height / 2 - 30, PLAYER_SPRITE_DOWN, PALETTES.hero, 3);
    this.drawPixelSprite(ctx, canvas.width / 2 + 40, canvas.height / 2 - 30, SKELETON_SPRITE, PALETTES.skeleton, 3);
  }

  renderDeathScreen(): void {
    const { ctx, canvas, engine } = this;
    
    ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 40px monospace';
    ctx.fillText('YOU HAVE DIED', canvas.width / 2, canvas.height / 3);

    ctx.fillStyle = '#aa4444';
    ctx.font = '16px monospace';
    ctx.fillText(`Reached Dungeon Level ${engine.dungeonLevel}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Player Level: ${engine.player.stats.level}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Gold Collected: ${engine.player.stats.gold}`, canvas.width / 2, canvas.height / 2 + 40);

    const time = Date.now() / 1000;
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
    ctx.font = '16px monospace';
    ctx.fillText('Press ENTER to try again', canvas.width / 2, canvas.height * 0.75);
  }

  renderTiles(): void {
    const { ctx, engine, tileSize } = this;
    const dungeon = engine.dungeon;

    // Calculate visible range
    const startX = Math.max(0, Math.floor(engine.cameraX / tileSize) - 1);
    const startY = Math.max(0, Math.floor(engine.cameraY / tileSize) - 1);
    const endX = Math.min(DUNGEON_WIDTH, startX + Math.ceil(this.canvas.width / tileSize) + 2);
    const endY = Math.min(DUNGEON_HEIGHT, startY + Math.ceil(this.canvas.height / tileSize) + 2);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (!dungeon.revealed[y]?.[x]) continue;

        const tile = dungeon.tiles[y][x];
        const visible = dungeon.visible[y]?.[x];
        const px = x * tileSize;
        const py = y * tileSize;

        this.drawTile(px, py, tile, visible);
      }
    }
  }

  drawTile(px: number, py: number, tile: TileType, visible: boolean): void {
    const { ctx, tileSize } = this;
    const dim = visible ? 1.0 : 0.4;

    switch (tile) {
      case 'wall':
        // Stone wall with texture
        ctx.fillStyle = this.dimColor('#3d3d5c', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.fillStyle = this.dimColor('#2d2d44', dim);
        ctx.fillRect(px, py, tileSize, 2);
        ctx.fillRect(px, py, 2, tileSize);
        ctx.fillStyle = this.dimColor('#4a4a6a', dim);
        ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        // Brick pattern
        ctx.fillStyle = this.dimColor('#2d2d44', dim);
        ctx.fillRect(px + tileSize / 2, py, 1, tileSize / 2);
        ctx.fillRect(px, py + tileSize / 2, tileSize, 1);
        ctx.fillRect(px + tileSize / 4, py + tileSize / 2, 1, tileSize / 2);
        break;

      case 'floor':
        ctx.fillStyle = this.dimColor('#2a1f1a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        // Floor texture
        ctx.fillStyle = this.dimColor('#3d2e24', dim);
        ctx.fillRect(px + 2, py + 2, 2, 2);
        ctx.fillRect(px + tileSize - 6, py + tileSize - 6, 2, 2);
        break;

      case 'stairs':
        ctx.fillStyle = this.dimColor('#2a1f1a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        if (visible) {
          this.drawPixelSprite(ctx, px + tileSize / 2 - 12, py + tileSize / 2 - 12, STAIRS_SPRITE, PALETTES.wood, tileSize / 16);
        }
        break;

      case 'water':
        const waterTime = Date.now() / 500;
        const waterBright = 0.8 + Math.sin(waterTime + px * 0.1) * 0.2;
        ctx.fillStyle = this.dimColor(PALETTES.water[Math.floor(waterBright * 4)], dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.fillStyle = this.dimColor('#4a7ec8', dim * 0.5);
        ctx.fillRect(px + 4, py + 4, 3, 1);
        ctx.fillRect(px + tileSize - 8, py + tileSize - 6, 4, 1);
        break;

      case 'lava':
        const lavaTime = Date.now() / 300;
        const lavaBright = 0.7 + Math.sin(lavaTime + px * 0.2) * 0.3;
        ctx.fillStyle = this.dimColor(PALETTES.lava[Math.floor(lavaBright * 4)], dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.fillStyle = this.dimColor('#ff6600', dim * 0.7);
        ctx.fillRect(px + 3, py + 5, 4, 2);
        ctx.fillRect(px + tileSize - 9, py + 3, 3, 2);
        break;

      case 'chest':
        ctx.fillStyle = this.dimColor('#2a1f1a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        if (visible) {
          this.drawPixelSprite(ctx, px + tileSize / 2 - 12, py + tileSize / 2 - 12, CHEST_SPRITE, PALETTES.gold, tileSize / 16);
        }
        break;

      case 'door':
        ctx.fillStyle = this.dimColor('#4a2c17', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.fillStyle = this.dimColor('#6b3e22', dim);
        ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        break;
    }
  }

  renderGroundItems(): void {
    const { ctx, engine, tileSize } = this;
    const dungeon = engine.dungeon;

    for (const itemData of dungeon.items) {
      if (!dungeon.visible[itemData.pos.y]?.[itemData.pos.x]) continue;

      const px = itemData.pos.x * tileSize;
      const py = itemData.pos.y * tileSize;
      const scale = tileSize / 16;

      // Glow effect
      const time = Date.now() / 500;
      const glowAlpha = 0.3 + Math.sin(time) * 0.2;
      ctx.fillStyle = `rgba(255, 255, 100, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw item sprite
      if (itemData.item.sprite) {
        this.drawPixelSprite(ctx, px + 4, py + 4, itemData.item.sprite, this.getItemPalette(itemData.item), scale);
      }
    }
  }

  getItemPalette(item: any): string[] {
    switch (item.rarity) {
      case 'common': return PALETTES.stone;
      case 'magic': return ['#1a1a4a', '#2a2a6a', '#4444aa', '#6666cc', '#8888ee'];
      case 'rare': return ['#2a1a4a', '#4a2a6a', '#7744aa', '#9966cc', '#bb88ee'];
      case 'unique': return ['#4a2a0a', '#6a4a1a', '#aa7722', '#cc9944', '#eebb66'];
      default: return PALETTES.stone;
    }
  }

  renderMonsters(): void {
    const { engine, tileSize } = this;
    const dungeon = engine.dungeon;

    for (const monster of dungeon.monsters) {
      if (!dungeon.visible[monster.pos.y]?.[monster.pos.x]) continue;
      if (monster.isDead && monster.deathTimer <= 0) continue;

      const px = monster.pos.x * tileSize;
      const py = monster.pos.y * tileSize;
      const scale = tileSize / 16;

      if (monster.isDead) {
        // Death animation - fade out
        const alpha = monster.deathTimer / 500;
        this.ctx.globalAlpha = alpha;
      }

      // Get sprite based on monster type
      let sprite = SKELETON_SPRITE;
      let palette = PALETTES.skeleton;

      switch (monster.id) {
        case 'skeleton': sprite = SKELETON_SPRITE; palette = PALETTES.skeleton; break;
        case 'demon': sprite = DEMON_SPRITE; palette = PALETTES.demon; break;
        case 'wraith': sprite = GHOST_SPRITE; palette = PALETTES.ghost; break;
        case 'bat': sprite = BAT_SPRITE; palette = ['#442266', '#663388', '#8844aa', '#aa66cc', '#cc88ee']; break;
      }

      // Bobbing animation
      const bobOffset = Math.sin(Date.now() / 300 + monster.pos.x) * 2;

      this.drawPixelSprite(this.ctx, px, py + bobOffset, sprite, palette, scale);

      // Health bar
      if (!monster.isDead && monster.hp < monster.maxHp) {
        const barWidth = tileSize - 4;
        const barHeight = 3;
        const barX = px + 2;
        const barY = py - 5;
        
        this.ctx.fillStyle = '#330000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(barX, barY, barWidth * (monster.hp / monster.maxHp), barHeight);
      }

      this.ctx.globalAlpha = 1;
    }
  }

  renderPlayer(): void {
    const { ctx, engine, tileSize } = this;
    const px = engine.player.pos.x * tileSize;
    const py = engine.player.pos.y * tileSize;
    const scale = tileSize / 16;

    // Attack flash
    if (engine.player.isAttacking) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
      const atkX = px + engine.player.direction.x * tileSize;
      const atkY = py + engine.player.direction.y * tileSize;
      ctx.fillRect(atkX, atkY, tileSize, tileSize);
    }

    // Invulnerability flash
    if (engine.player.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    this.drawPixelSprite(ctx, px, py, PLAYER_SPRITE_DOWN, PALETTES.hero, scale);
    
    ctx.globalAlpha = 1;

    // Player name/level indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv${engine.player.stats.level}`, px + tileSize / 2, py - 3);
  }

  renderProjectiles(): void {
    const { ctx, engine, tileSize } = this;

    for (const proj of engine.projectiles) {
      const px = proj.pos.x * tileSize + tileSize / 2;
      const py = proj.pos.y * tileSize + tileSize / 2;
      
      // Fireball glow
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, tileSize / 2);
      gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, tileSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(px - 3, py - 3, 6, 6);
    }
  }

  renderParticles(): void {
    const { ctx, engine } = this;

    for (const p of engine.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }
    ctx.globalAlpha = 1;
  }

  renderFog(): void {
    const { ctx, engine, tileSize, canvas } = this;
    const dungeon = engine.dungeon;

    const startX = Math.max(0, Math.floor(engine.cameraX / tileSize) - 1);
    const startY = Math.max(0, Math.floor(engine.cameraY / tileSize) - 1);
    const endX = Math.min(DUNGEON_WIDTH, startX + Math.ceil(canvas.width / tileSize) + 2);
    const endY = Math.min(DUNGEON_HEIGHT, startY + Math.ceil(canvas.height / tileSize) + 2);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (!dungeon.revealed[y]?.[x]) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        } else if (!dungeon.visible[y]?.[x]) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Torchlight effect - warm glow around player
    if (engine.gameState === 'playing') {
      const playerScreenX = engine.player.pos.x * tileSize + tileSize / 2 - engine.cameraX;
      const playerScreenY = engine.player.pos.y * tileSize + tileSize / 2 - engine.cameraY;
      const flickerRadius = tileSize * 6 + Math.sin(Date.now() / 200) * tileSize * 0.5;
      
      const torchGradient = ctx.createRadialGradient(
        playerScreenX, playerScreenY, 0,
        playerScreenX, playerScreenY, flickerRadius
      );
      torchGradient.addColorStop(0, 'rgba(255, 150, 50, 0.06)');
      torchGradient.addColorStop(0.5, 'rgba(255, 100, 30, 0.03)');
      torchGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = torchGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  renderUI(): void {
    const { ctx, canvas, engine } = this;
    const player = engine.player;

    // Bottom UI panel
    const panelHeight = 80;
    const panelY = canvas.height - panelHeight;
    
    ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
    ctx.fillRect(0, panelY, canvas.width, panelHeight);
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, panelY, canvas.width, panelHeight);

    // HP Bar
    const barWidth = 150;
    const barHeight = 14;
    const barX = 10;
    const barY = panelY + 10;

    ctx.fillStyle = '#330000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(barX, barY, barWidth * (player.stats.hp / player.stats.maxHp), barHeight);
    ctx.strokeStyle = '#660000';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.stats.hp}/${player.stats.maxHp}`, barX + 4, barY + 11);

    // MP Bar
    const mpBarY = barY + barHeight + 4;
    ctx.fillStyle = '#000033';
    ctx.fillRect(barX, mpBarY, barWidth, barHeight);
    ctx.fillStyle = '#0044cc';
    ctx.fillRect(barX, mpBarY, barWidth * (player.stats.mp / player.stats.maxMp), barHeight);
    ctx.strokeStyle = '#000066';
    ctx.strokeRect(barX, mpBarY, barWidth, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`MP: ${player.stats.mp}/${player.stats.maxMp}`, barX + 4, mpBarY + 11);

    // EXP Bar
    const expBarY = mpBarY + barHeight + 4;
    ctx.fillStyle = '#1a1a00';
    ctx.fillRect(barX, expBarY, barWidth, barHeight);
    ctx.fillStyle = '#aaaa00';
    ctx.fillRect(barX, expBarY, barWidth * (player.stats.exp / player.stats.expToNext), barHeight);
    ctx.strokeStyle = '#444400';
    ctx.strokeRect(barX, expBarY, barWidth, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`EXP: ${player.stats.exp}/${player.stats.expToNext}`, barX + 4, expBarY + 11);

    // Stats
    const statsX = barX + barWidth + 20;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText(`Level: ${player.stats.level}`, statsX, panelY + 18);
    ctx.fillText(`ATK: ${engine.getPlayerAttack()}`, statsX, panelY + 32);
    ctx.fillText(`DEF: ${engine.getPlayerDefense()}`, statsX, panelY + 46);
    ctx.fillText(`Gold: ${player.stats.gold}`, statsX, panelY + 60);
    ctx.fillText(`Floor: ${engine.dungeonLevel}`, statsX, panelY + 74);

    // Messages
    const msgX = statsX + 120;
    ctx.fillStyle = '#888888';
    ctx.font = '9px monospace';
    const maxMessages = 5;
    for (let i = 0; i < Math.min(maxMessages, engine.messages.length); i++) {
      const msg = engine.messages[i];
      const age = (Date.now() - msg.time) / 1000;
      const alpha = Math.max(0.3, 1 - age / 10);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = msg.color;
      ctx.fillText(msg.text.substring(0, 50), msgX, panelY + 14 + i * 13);
    }
    ctx.globalAlpha = 1;

    // Equipment display (top-left)
    this.renderEquipmentPanel();

    // Minimap (top-right)
    this.renderMinimap();
  }

  renderEquipmentPanel(): void {
    const { ctx, engine } = this;
    const panelX = 5;
    const panelY = 5;
    const slotSize = 28;
    const gap = 4;

    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(panelX, panelY, slotSize * 4 + gap * 5 + 10, slotSize + gap * 2 + 10);
    ctx.strokeStyle = '#333355';
    ctx.strokeRect(panelX, panelY, slotSize * 4 + gap * 5 + 10, slotSize + gap * 2 + 10);

    const slots = ['weapon', 'armor', 'ring', 'amulet'] as const;
    const slotLabels = ['W', 'A', 'R', 'N'];

    for (let i = 0; i < slots.length; i++) {
      const sx = panelX + 5 + i * (slotSize + gap);
      const sy = panelY + 5;
      const item = engine.player.equipment[slots[i]];

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(sx, sy, slotSize, slotSize);
      ctx.strokeStyle = item ? this.engine.getRarityColor(item.rarity) : '#333355';
      ctx.strokeRect(sx, sy, slotSize, slotSize);

      if (item && item.sprite) {
        this.drawPixelSprite(ctx, sx + 4, sy + 4, item.sprite, this.getItemPalette(item), 2.5);
      } else {
        ctx.fillStyle = '#444444';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(slotLabels[i], sx + slotSize / 2, sy + slotSize / 2 + 4);
      }
    }
  }

  renderMinimap(): void {
    const { ctx, canvas, engine } = this;
    const mapSize = 100;
    const mapX = canvas.width - mapSize - 10;
    const mapY = 5;
    const pixelSize = mapSize / Math.max(DUNGEON_WIDTH, DUNGEON_HEIGHT);

    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize * (DUNGEON_HEIGHT / DUNGEON_WIDTH) + 4);
    ctx.strokeStyle = '#333355';
    ctx.strokeRect(mapX - 2, mapY - 2, mapSize + 4, mapSize * (DUNGEON_HEIGHT / DUNGEON_WIDTH) + 4);

    const dungeon = engine.dungeon;
    const mapHeight = mapSize * (DUNGEON_HEIGHT / DUNGEON_WIDTH);

    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (!dungeon.revealed[y]?.[x]) continue;

        const px = mapX + x * pixelSize;
        const py = mapY + y * pixelSize;

        if (dungeon.tiles[y][x] === 'wall') {
          ctx.fillStyle = '#333355';
        } else if (dungeon.tiles[y][x] === 'stairs') {
          ctx.fillStyle = '#ffff00';
        } else {
          ctx.fillStyle = dungeon.visible[y]?.[x] ? '#4a3830' : '#2a1f1a';
        }
        ctx.fillRect(px, py, Math.ceil(pixelSize), Math.ceil(pixelSize));
      }
    }

    // Player dot
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      mapX + engine.player.pos.x * pixelSize - 1,
      mapY + engine.player.pos.y * pixelSize - 1,
      3, 3
    );

    // Monster dots
    for (const m of dungeon.monsters) {
      if (m.isDead) continue;
      if (!dungeon.visible[m.pos.y]?.[m.pos.x]) continue;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        mapX + m.pos.x * pixelSize,
        mapY + m.pos.y * pixelSize,
        2, 2
      );
    }
  }

  drawPixelSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    sprite: number[][],
    palette: string[],
    scale: number
  ): void {
    for (let sy = 0; sy < sprite.length; sy++) {
      for (let sx = 0; sx < sprite[sy].length; sx++) {
        const colorIdx = sprite[sy][sx];
        if (colorIdx === 0) continue;
        const color = palette[colorIdx - 1] || palette[0];
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(x + sx * scale),
          Math.floor(y + sy * scale),
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }

  dimColor(color: string, dim: number): string {
    // Parse hex color and apply dim
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgb(${Math.floor(r * dim)}, ${Math.floor(g * dim)}, ${Math.floor(b * dim)})`;
  }
}
