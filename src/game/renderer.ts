import { GameEngine } from './engine';
import { TileType, Player, Monster, Position } from './types';
import { DUNGEON_WIDTH, DUNGEON_HEIGHT } from './dungeon';
import {
  PLAYER_DOWN_1, PLAYER_DOWN_2,
  PLAYER_UP_1, PLAYER_UP_2,
  PLAYER_LEFT_1, PLAYER_LEFT_2,
  PLAYER_RIGHT_1, PLAYER_RIGHT_2,
  PLAYER_ATTACK,
  SKELETON_1, SKELETON_2,
  DEMON_1, DEMON_2,
  WRAITH_1, WRAITH_2,
  BAT_1, BAT_2,
  CHEST_SPRITE,
  STAIRS_SPRITE,
  PALETTES,
} from './sprites';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tileSize: number = 32;
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
    
    // Vignette effect
    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.4, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle scanline effect for retro feel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
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
    ctx.fillText('Un Dungeon Crawler en Pixel Art', canvas.width / 2, canvas.height / 3 + 40);
    
    // Narrative intro
    ctx.fillStyle = '#666688';
    ctx.font = '11px monospace';
    ctx.fillText('Despiertas en la oscuridad sin recuerdos...', canvas.width / 2, canvas.height / 3 + 70);
    ctx.fillText('¿Quién eres? ¿Qué haces aquí?', canvas.width / 2, canvas.height / 3 + 88);

    // Start prompt
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    ctx.font = '18px monospace';
    ctx.fillText('Press ENTER or Click to Begin', canvas.width / 2, canvas.height / 2 + 40);

    // Controls
    ctx.fillStyle = '#666666';
    ctx.font = '11px monospace';
    ctx.fillText('WASD/Flechas: Mover | Espacio: Atacar | Tab: Cambiar Modo', canvas.width / 2, canvas.height - 80);
    ctx.fillText('F/Q/E/R: Habilidades | I: Inventario | Enter: Bajar Escaleras', canvas.width / 2, canvas.height - 60);

    // Decorative pixel art - animated characters on menu
    const menuFrame = Math.floor(time * 2) % 2;
    const charY = canvas.height / 2 - 20;
    
    // Draw character lineup with labels
    const characters = [
      { sprite1: PLAYER_DOWN_1, sprite2: PLAYER_DOWN_2, palette: PALETTES.heroArmor, label: 'HERO', x: -140 },
      { sprite1: SKELETON_1, sprite2: SKELETON_2, palette: PALETTES.skeleton, label: 'UNDEAD', x: -50 },
      { sprite1: DEMON_1, sprite2: DEMON_2, palette: PALETTES.demon, label: 'DEMON', x: 40 },
      { sprite1: WRAITH_1, sprite2: WRAITH_2, palette: PALETTES.ghost, label: 'WRAITH', x: 130 },
    ];

    for (const char of characters) {
      const cx = canvas.width / 2 + char.x;
      const sprite = menuFrame === 0 ? char.sprite1 : char.sprite2;
      
      // Character shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx + 24, charY + 50, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      this.drawPixelSprite(ctx, cx, charY, sprite, char.palette, 3);
      
      // Label
      ctx.fillStyle = '#666688';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(char.label, cx + 24, charY + 60);
    }
  }

  renderDeathScreen(): void {
    const { ctx, canvas, engine } = this;
    const time = Date.now() / 1000;
    
    // Dark red background with vignette
    ctx.fillStyle = 'rgba(15, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Blood drip effect at top
    for (let i = 0; i < 20; i++) {
      const dripX = (i / 20) * canvas.width + Math.sin(i * 3.7) * 30;
      const dripLen = 30 + Math.sin(i * 2.3 + time) * 20;
      ctx.fillStyle = `rgba(100, 0, 0, ${0.3 + Math.sin(i + time) * 0.2})`;
      ctx.fillRect(dripX, 0, 3, dripLen);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Death text with shadow
    ctx.fillStyle = '#330000';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('YOU HAVE DIED', canvas.width / 2 + 3, canvas.height / 3 + 3);
    
    // Main death text with pulsing red
    const deathAlpha = 0.7 + Math.sin(time * 2) * 0.3;
    ctx.fillStyle = `rgba(200, 0, 0, ${deathAlpha})`;
    ctx.font = 'bold 44px monospace';
    ctx.fillText('YOU HAVE DIED', canvas.width / 2, canvas.height / 3);

    // Stats with decorative border
    const statsY = canvas.height / 2 - 40;
    ctx.fillStyle = 'rgba(30, 0, 0, 0.8)';
    ctx.fillRect(canvas.width / 2 - 150, statsY - 20, 300, 100);
    ctx.strokeStyle = '#550000';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 150, statsY - 20, 300, 100);

    ctx.fillStyle = '#cc4444';
    ctx.font = '14px monospace';
    ctx.fillText(`⚔ Dungeon Level: ${engine.dungeonLevel}`, canvas.width / 2, statsY);
    ctx.fillText(`★ Player Level: ${engine.player.stats.level}`, canvas.width / 2, statsY + 25);
    ctx.fillText(`● Gold Collected: ${engine.player.stats.gold}`, canvas.width / 2, statsY + 50);

    // Retry prompt
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
    ctx.font = '18px monospace';
    ctx.fillText('Press ENTER to try again', canvas.width / 2, canvas.height * 0.78);

    // Skull decoration
    ctx.fillStyle = '#440000';
    ctx.font = '24px monospace';
    ctx.fillText('☠', canvas.width / 2 - 180, canvas.height / 3);
    ctx.fillText('☠', canvas.width / 2 + 180, canvas.height / 3);
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
    const time = Date.now();
    // Use position as seed for consistent random patterns
    const seedX = Math.floor(px / tileSize);
    const seedY = Math.floor(py / tileSize);

    switch (tile) {
      case 'wall':
        // Detailed stone wall with brick pattern and highlights
        // Base color
        ctx.fillStyle = this.dimColor('#2d2d44', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        
        // Main brick face
        ctx.fillStyle = this.dimColor('#3d3d5c', dim);
        ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        
        // Top highlight
        ctx.fillStyle = this.dimColor('#4a4a6a', dim);
        ctx.fillRect(px + 1, py + 1, tileSize - 2, 2);
        ctx.fillRect(px + 1, py + 1, 2, tileSize - 2);
        
        // Bottom shadow
        ctx.fillStyle = this.dimColor('#1a1a2e', dim);
        ctx.fillRect(px + 1, py + tileSize - 3, tileSize - 2, 2);
        ctx.fillRect(px + tileSize - 3, py + 1, 2, tileSize - 2);
        
        // Brick mortar lines (horizontal)
        ctx.fillStyle = this.dimColor('#1a1a2e', dim);
        ctx.fillRect(px, py + Math.floor(tileSize / 3), tileSize, 1);
        ctx.fillRect(px, py + Math.floor(tileSize * 2 / 3), tileSize, 1);
        
        // Brick mortar lines (vertical, staggered)
        ctx.fillRect(px + Math.floor(tileSize / 2), py, 1, Math.floor(tileSize / 3));
        ctx.fillRect(px + Math.floor(tileSize / 4), py + Math.floor(tileSize / 3), 1, Math.floor(tileSize / 3));
        ctx.fillRect(px + Math.floor(tileSize * 3 / 4), py + Math.floor(tileSize / 3), 1, Math.floor(tileSize / 3));
        ctx.fillRect(px + Math.floor(tileSize / 2), py + Math.floor(tileSize * 2 / 3), 1, Math.floor(tileSize / 3));
        
        // Subtle texture noise
        if ((seedX + seedY) % 3 === 0) {
          ctx.fillStyle = this.dimColor('#4a4a6a', dim * 0.5);
          ctx.fillRect(px + 4, py + 4, 2, 2);
        }
        if ((seedX * seedY) % 5 === 0) {
          ctx.fillStyle = this.dimColor('#4a4a6a', dim * 0.3);
          ctx.fillRect(px + tileSize - 8, py + 6, 1, 1);
        }
        break;

      case 'floor':
        // Detailed stone floor with cracks and texture
        ctx.fillStyle = this.dimColor('#2a1f1a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        
        // Floor tile pattern
        ctx.fillStyle = this.dimColor('#3d2e24', dim);
        ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        
        // Subtle grid lines
        ctx.fillStyle = this.dimColor('#1a1510', dim * 0.5);
        ctx.fillRect(px, py, tileSize, 1);
        ctx.fillRect(px, py, 1, tileSize);
        
        // Random stone texture details
        const hash = (seedX * 7 + seedY * 13) % 17;
        if (hash < 4) {
          ctx.fillStyle = this.dimColor('#4a3830', dim * 0.6);
          ctx.fillRect(px + 3, py + 5, 2, 1);
          ctx.fillRect(px + tileSize - 7, py + tileSize - 8, 1, 2);
        }
        if (hash > 10) {
          // Small crack
          ctx.fillStyle = this.dimColor('#1a1510', dim * 0.4);
          ctx.fillRect(px + 8, py + 4, 1, 3);
          ctx.fillRect(px + 9, py + 7, 1, 2);
        }
        if (hash === 5) {
          // Pebble
          ctx.fillStyle = this.dimColor('#5c4a3e', dim * 0.5);
          ctx.fillRect(px + 12, py + 12, 2, 2);
        }
        break;

      case 'stairs':
        ctx.fillStyle = this.dimColor('#2a1f1a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        if (visible) {
          const stairScale = tileSize / 16;
          this.drawPixelSprite(ctx, px, py, STAIRS_SPRITE, PALETTES.wood, stairScale);
          
          // Glowing effect around stairs
          const glowAlpha = 0.15 + Math.sin(time / 500) * 0.1;
          ctx.fillStyle = `rgba(255, 220, 100, ${glowAlpha})`;
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'water':
        // Animated water with ripples
        const waterTime = time / 400;
        const waterPhase = Math.sin(waterTime + seedX * 0.5 + seedY * 0.3);
        
        // Base water color
        const waterIdx = Math.floor((waterPhase + 1) / 2 * 4);
        ctx.fillStyle = this.dimColor(PALETTES.water[Math.min(4, waterIdx)], dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        
        // Ripple highlights
        ctx.fillStyle = this.dimColor('#4a7ec8', dim * 0.6);
        const rippleOffset = Math.sin(waterTime * 2 + seedX) * 3;
        ctx.fillRect(px + 4 + rippleOffset, py + 6, 4, 1);
        ctx.fillRect(px + tileSize - 10 - rippleOffset, py + tileSize - 8, 5, 1);
        
        // Darker depth areas
        ctx.fillStyle = this.dimColor('#0a1628', dim * 0.3);
        ctx.fillRect(px + 2, py + tileSize - 4, 3, 2);
        break;

      case 'lava':
        // Animated lava with bubbles
        const lavaTime = time / 250;
        const lavaPhase = Math.sin(lavaTime + seedX * 0.7 + seedY * 0.5);
        
        // Base lava color
        const lavaIdx = Math.floor((lavaPhase + 1) / 2 * 4);
        ctx.fillStyle = this.dimColor(PALETTES.lava[Math.min(4, lavaIdx)], dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        
        // Bright hot spots
        ctx.fillStyle = this.dimColor('#ff6600', dim * 0.8);
        const bubble1 = Math.sin(lavaTime * 1.5 + seedX * 2) > 0.7;
        const bubble2 = Math.sin(lavaTime * 1.3 + seedY * 2) > 0.6;
        if (bubble1) {
          ctx.fillRect(px + 6, py + 8, 3, 3);
        }
        if (bubble2) {
          ctx.fillStyle = this.dimColor('#ffaa00', dim * 0.9);
          ctx.fillRect(px + tileSize - 10, py + 5, 2, 2);
        }
        
        // Dark crust edges
        ctx.fillStyle = this.dimColor('#4a1a00', dim * 0.5);
        ctx.fillRect(px, py, tileSize, 2);
        ctx.fillRect(px, py + tileSize - 2, tileSize, 2);
        
        // Glow effect
        if (visible) {
          const glowAlpha = 0.08 + Math.sin(lavaTime) * 0.04;
          ctx.fillStyle = `rgba(255, 80, 0, ${glowAlpha})`;
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'chest':
        ctx.fillStyle = this.dimColor('#2a1f1a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        if (visible) {
          const chestScale = tileSize / 16;
          this.drawPixelSprite(ctx, px, py, CHEST_SPRITE, PALETTES.gold, chestScale);
          
          // Sparkle effect
          const sparkle = Math.sin(time / 300 + seedX * 3) > 0.5;
          if (sparkle) {
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.fillRect(px + tileSize / 2 - 1, py + 4, 2, 2);
          }
        }
        break;

      case 'door':
        // Detailed wooden door
        ctx.fillStyle = this.dimColor('#3a1c0a', dim);
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.fillStyle = this.dimColor('#5a3018', dim);
        ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        
        // Wood grain
        ctx.fillStyle = this.dimColor('#6b3e22', dim);
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(px + 4, py + 4 + i * 8, tileSize - 8, 1);
        }
        
        // Door frame highlight
        ctx.fillStyle = this.dimColor('#7a5030', dim);
        ctx.fillRect(px + 2, py + 2, tileSize - 4, 2);
        ctx.fillRect(px + 2, py + 2, 2, tileSize - 4);
        
        // Metal bands
        ctx.fillStyle = this.dimColor('#4a4a4a', dim);
        ctx.fillRect(px + 3, py + Math.floor(tileSize / 3), tileSize - 6, 2);
        ctx.fillRect(px + 3, py + Math.floor(tileSize * 2 / 3), tileSize - 6, 2);
        
        // Handle
        ctx.fillStyle = this.dimColor('#8a8a4a', dim);
        ctx.fillRect(px + tileSize - 8, py + tileSize / 2 - 1, 3, 3);
        break;
    }
  }

  renderGroundItems(): void {
    const { ctx, engine, tileSize } = this;
    const dungeon = engine.dungeon;
    const time = Date.now();

    for (const itemData of dungeon.items) {
      if (!dungeon.visible[itemData.pos.y]?.[itemData.pos.x]) continue;

      const px = itemData.pos.x * tileSize;
      const py = itemData.pos.y * tileSize;
      const scale = tileSize / 16;

      // Floating animation
      const floatOffset = Math.sin(time / 400 + itemData.pos.x * 2) * 2;

      // Glow effect based on rarity and type
      let glowColor = 'rgba(255, 255, 100, ';
      if (itemData.item.type === 'scroll') {
        glowColor = 'rgba(255, 220, 100, ';
      } else {
        switch (itemData.item.rarity) {
          case 'magic': glowColor = 'rgba(100, 150, 255, '; break;
          case 'rare': glowColor = 'rgba(180, 100, 255, '; break;
          case 'unique': glowColor = 'rgba(255, 150, 50, '; break;
        }
      }
      
      const glowAlpha = 0.2 + Math.sin(time / 500 + itemData.pos.x) * 0.15;
      ctx.fillStyle = `${glowColor}${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(px + tileSize / 2, py + tileSize / 2 + floatOffset, tileSize / 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw item sprite centered
      if (itemData.item.sprite) {
        const spriteOffset = (tileSize - itemData.item.sprite[0].length * scale) / 2;
        this.drawPixelSprite(
          ctx, 
          px + spriteOffset, 
          py + spriteOffset + floatOffset, 
          itemData.item.sprite, 
          this.getItemPalette(itemData.item), 
          scale
        );
      }
    }
  }

  getItemPalette(item: any): string[] {
    switch (item.type) {
      case 'scroll':
        // Skill scrolls - golden/mystical
        return ['#4a3a0a', '#6a5a1a', '#9a8a2a', '#bbaa3a', '#ddcc4a'];
      case 'potion':
        if (item.healAmount) {
          // Health potion - red
          return ['#3a0a0a', '#6a1a1a', '#aa2020', '#dd3030', '#ff5050'];
        } else {
          // Mana potion - blue
          return ['#0a0a3a', '#1a1a6a', '#2020aa', '#3030dd', '#5050ff'];
        }
      case 'weapon':
        switch (item.rarity) {
          case 'common': return ['#3a3a3a', '#5a5a5a', '#8a8a8a', '#aaaaaa', '#cccccc'];
          case 'magic': return ['#1a2a4a', '#2a4a6a', '#4a6a9a', '#6a8abb', '#8aaadd'];
          case 'rare': return ['#4a1a4a', '#6a2a6a', '#9a4a9a', '#bb6abb', '#dd8add'];
          default: return ['#3a3a3a', '#5a5a5a', '#8a8a8a', '#aaaaaa', '#cccccc'];
        }
      case 'armor':
        switch (item.rarity) {
          case 'common': return ['#2a2a1a', '#4a4a2a', '#6a6a3a', '#8a8a4a', '#aaaa5a'];
          case 'magic': return ['#1a2a3a', '#2a4a5a', '#3a6a7a', '#4a8a9a', '#5aaabb'];
          case 'rare': return ['#2a1a3a', '#4a2a5a', '#6a3a7a', '#8a4a9a', '#aa5abb'];
          default: return ['#2a2a1a', '#4a4a2a', '#6a6a3a', '#8a8a4a', '#aaaa5a'];
        }
      case 'ring':
      case 'amulet':
        switch (item.rarity) {
          case 'common': return ['#3a3a1a', '#5a5a2a', '#8a8a3a', '#aaaa4a', '#cccc5a'];
          case 'magic': return ['#1a3a3a', '#2a5a5a', '#3a8a8a', '#4aaaaa', '#5acccc'];
          case 'rare': return ['#4a2a0a', '#6a4a1a', '#9a6a2a', '#bb8a3a', '#ddaa4a'];
          default: return ['#3a3a1a', '#5a5a2a', '#8a8a3a', '#aaaa4a', '#cccc5a'];
        }
      default:
        switch (item.rarity) {
          case 'common': return PALETTES.stone;
          case 'magic': return ['#1a1a4a', '#2a2a6a', '#4444aa', '#6666cc', '#8888ee'];
          case 'rare': return ['#2a1a4a', '#4a2a6a', '#7744aa', '#9966cc', '#bb88ee'];
          case 'unique': return ['#4a2a0a', '#6a4a1a', '#aa7722', '#cc9944', '#eebb66'];
          default: return PALETTES.stone;
        }
    }
  }

  renderMonsters(): void {
    const { engine, tileSize } = this;
    const dungeon = engine.dungeon;
    const time = Date.now();
    const animFrame = Math.floor(time / 400) % 2; // Animation frame toggle

    for (const monster of dungeon.monsters) {
      if (!dungeon.visible[monster.pos.y]?.[monster.pos.x]) continue;
      if (monster.isDead && monster.deathTimer <= 0) continue;

      const px = monster.pos.x * tileSize;
      const py = monster.pos.y * tileSize;
      const scale = tileSize / 16;

      if (monster.isDead) {
        // Death animation - fade out with red tint
        const alpha = monster.deathTimer / 500;
        this.ctx.globalAlpha = alpha;
      }

      // Get sprite and palette based on monster type with animation
      let sprite: number[][];
      let palette: string[];

      switch (monster.id) {
        case 'skeleton':
          sprite = animFrame === 0 ? SKELETON_1 : SKELETON_2;
          palette = PALETTES.skeleton;
          break;
        case 'demon':
          sprite = animFrame === 0 ? DEMON_1 : DEMON_2;
          palette = PALETTES.demon;
          break;
        case 'wraith':
          sprite = animFrame === 0 ? WRAITH_1 : WRAITH_2;
          palette = PALETTES.ghost;
          break;
        case 'bat':
          sprite = animFrame === 0 ? BAT_1 : BAT_2;
          palette = PALETTES.bat;
          break;
        default:
          sprite = SKELETON_1;
          palette = PALETTES.skeleton;
      }

      // Bobbing animation (more pronounced for flying monsters)
      let bobOffset = 0;
      if (monster.id === 'bat') {
        bobOffset = Math.sin(time / 150 + monster.pos.x * 2) * 4;
      } else if (monster.id === 'wraith') {
        bobOffset = Math.sin(time / 500 + monster.pos.x) * 3;
      } else {
        bobOffset = Math.sin(time / 400 + monster.pos.x) * 1;
      }

      // Draw shadow for grounded monsters
      if (monster.id !== 'bat' && monster.id !== 'wraith') {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(px + tileSize / 2, py + tileSize - 2, tileSize / 3, tileSize / 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Wraith transparency effect
      if (monster.id === 'wraith') {
        this.ctx.globalAlpha = (this.ctx.globalAlpha || 1) * (0.7 + Math.sin(time / 300) * 0.2);
      }

      this.drawPixelSprite(this.ctx, px, py + bobOffset, sprite, palette, scale);

      // Health bar (only when damaged)
      if (!monster.isDead && monster.hp < monster.maxHp) {
        const barWidth = tileSize - 4;
        const barHeight = 3;
        const barX = px + 2;
        const barY = py - 6 + bobOffset;
        
        // Background
        this.ctx.fillStyle = '#1a0000';
        this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        this.ctx.fillStyle = '#330000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill with color based on HP percentage
        const hpPercent = monster.hp / monster.maxHp;
        let barColor = '#ff0000';
        if (hpPercent > 0.6) barColor = '#00cc00';
        else if (hpPercent > 0.3) barColor = '#cccc00';
        
        this.ctx.fillStyle = barColor;
        this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
      }

      this.ctx.globalAlpha = 1;
    }
  }

  renderPlayer(): void {
    const { ctx, engine, tileSize } = this;
    const px = engine.player.pos.x * tileSize;
    const py = engine.player.pos.y * tileSize;
    const scale = tileSize / 16;
    const time = Date.now();
    const walkFrame = Math.floor(time / 250) % 2;

    // Attack flash effect
    if (engine.player.isAttacking) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
      const atkX = px + engine.player.direction.x * tileSize;
      const atkY = py + engine.player.direction.y * tileSize;
      ctx.fillRect(atkX, atkY, tileSize, tileSize);
      
      // Slash effect
      ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const slashAngle = Math.atan2(engine.player.direction.y, engine.player.direction.x);
      ctx.moveTo(
        px + tileSize / 2 + Math.cos(slashAngle - 0.5) * tileSize * 0.6,
        py + tileSize / 2 + Math.sin(slashAngle - 0.5) * tileSize * 0.6
      );
      ctx.lineTo(
        px + tileSize / 2 + Math.cos(slashAngle + 0.5) * tileSize * 0.6,
        py + tileSize / 2 + Math.sin(slashAngle + 0.5) * tileSize * 0.6
      );
      ctx.stroke();
    }

    // Invulnerability flash
    if (engine.player.invulnerable > 0 && Math.floor(time / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Select sprite based on direction and animation frame
    let sprite: number[][];
    const dir = engine.player.direction;
    
    if (engine.player.isAttacking) {
      sprite = PLAYER_ATTACK;
    } else if (dir.y < 0) {
      // Facing up
      sprite = walkFrame === 0 ? PLAYER_UP_1 : PLAYER_UP_2;
    } else if (dir.y > 0) {
      // Facing down
      sprite = walkFrame === 0 ? PLAYER_DOWN_1 : PLAYER_DOWN_2;
    } else if (dir.x > 0) {
      // Facing right
      sprite = walkFrame === 0 ? PLAYER_RIGHT_1 : PLAYER_RIGHT_2;
    } else {
      // Facing left
      sprite = walkFrame === 0 ? PLAYER_LEFT_1 : PLAYER_LEFT_2;
    }

    // Draw player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px + tileSize / 2, py + tileSize - 1, tileSize / 3, tileSize / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw player with armor palette
    this.drawPixelSprite(ctx, px, py, sprite, PALETTES.heroArmor, scale);
    
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
      
      // Determine projectile type by damage and speed
      const isArrow = proj.speed >= 0.25;
      
      if (isArrow) {
        // Arrow - simple line with tip
        const angle = Math.atan2(proj.dir.y, proj.dir.x);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        
        // Arrow shaft
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-8, -1, 16, 2);
        
        // Arrow head
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(4, -3);
        ctx.lineTo(4, 3);
        ctx.closePath();
        ctx.fill();
        
        // Arrow fletching
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-8, -2, 3, 1);
        ctx.fillRect(-8, 1, 3, 1);
        
        ctx.restore();
      } else {
        // Magic projectile - fireball/ice/lightning
        // Glow effect
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, tileSize / 2);
        
        // Color based on damage (rough indicator of type)
        if (proj.damage > 20) {
          // Lightning - yellow
          gradient.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(200, 200, 0, 0)');
        } else if (proj.damage > 12) {
          // Ice - blue
          gradient.addColorStop(0, 'rgba(100, 200, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.5)');
          gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        } else {
          // Fire - orange/red
          gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, tileSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = proj.damage > 20 ? '#ffff44' : proj.damage > 12 ? '#88ccff' : '#ffff88';
        ctx.fillRect(px - 3, py - 3, 6, 6);
      }
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
    const time = Date.now();

    // Bottom UI panel with gradient
    const panelHeight = 85;
    const panelY = canvas.height - panelHeight;
    
    // Panel background
    const panelGrad = ctx.createLinearGradient(0, panelY, 0, canvas.height);
    panelGrad.addColorStop(0, 'rgba(15, 15, 30, 0.95)');
    panelGrad.addColorStop(1, 'rgba(5, 5, 15, 0.98)');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(0, panelY, canvas.width, panelHeight);
    
    // Top border with glow
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, panelY);
    ctx.lineTo(canvas.width, panelY);
    ctx.stroke();
    ctx.strokeStyle = '#222244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, panelY + 2);
    ctx.lineTo(canvas.width, panelY + 2);
    ctx.stroke();

    // HP Bar with gradient fill
    const barWidth = 160;
    const barHeight = 16;
    const barX = 12;
    const barY = panelY + 10;
    const hpPercent = player.stats.hp / player.stats.maxHp;

    // Bar background
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#330000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // HP fill with gradient
    const hpGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    if (hpPercent > 0.5) {
      hpGrad.addColorStop(0, '#ff2222');
      hpGrad.addColorStop(1, '#aa0000');
    } else if (hpPercent > 0.25) {
      hpGrad.addColorStop(0, '#ff6600');
      hpGrad.addColorStop(1, '#aa3300');
    } else {
      hpGrad.addColorStop(0, '#ff0000');
      hpGrad.addColorStop(1, '#660000');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    // HP bar shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight / 3);
    
    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`♥ HP: ${player.stats.hp}/${player.stats.maxHp}`, barX + 4, barY + 12);

    // MP Bar
    const mpBarY = barY + barHeight + 5;
    const mpPercent = player.stats.mp / player.stats.maxMp;
    
    ctx.fillStyle = '#00001a';
    ctx.fillRect(barX - 1, mpBarY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#000033';
    ctx.fillRect(barX, mpBarY, barWidth, barHeight);
    
    const mpGrad = ctx.createLinearGradient(barX, mpBarY, barX, mpBarY + barHeight);
    mpGrad.addColorStop(0, '#4488ff');
    mpGrad.addColorStop(1, '#1144aa');
    ctx.fillStyle = mpGrad;
    ctx.fillRect(barX, mpBarY, barWidth * mpPercent, barHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, mpBarY, barWidth * mpPercent, barHeight / 3);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`◆ MP: ${player.stats.mp}/${player.stats.maxMp}`, barX + 4, mpBarY + 12);

    // EXP Bar
    const expBarY = mpBarY + barHeight + 5;
    const expPercent = player.stats.exp / player.stats.expToNext;
    
    ctx.fillStyle = '#1a1a00';
    ctx.fillRect(barX - 1, expBarY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#1a1a00';
    ctx.fillRect(barX, expBarY, barWidth, barHeight);
    
    const expGrad = ctx.createLinearGradient(barX, expBarY, barX, expBarY + barHeight);
    expGrad.addColorStop(0, '#dddd00');
    expGrad.addColorStop(1, '#888800');
    ctx.fillStyle = expGrad;
    ctx.fillRect(barX, expBarY, barWidth * expPercent, barHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, expBarY, barWidth * expPercent, barHeight / 3);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`★ EXP: ${player.stats.exp}/${player.stats.expToNext}`, barX + 4, expBarY + 12);

    // Stats panel
    const statsX = barX + barWidth + 25;
    ctx.fillStyle = '#888899';
    ctx.font = '11px monospace';
    ctx.fillText(`⚔ Lv.${player.stats.level}`, statsX, panelY + 18);
    ctx.fillStyle = '#cc6666';
    ctx.fillText(`ATK: ${engine.getPlayerAttack()}`, statsX, panelY + 34);
    ctx.fillStyle = '#6666cc';
    ctx.fillText(`DEF: ${engine.getPlayerDefense()}`, statsX, panelY + 50);
    ctx.fillStyle = '#ddcc44';
    ctx.fillText(`Gold: ${player.stats.gold}`, statsX + 90, panelY + 18);
    ctx.fillStyle = '#88aacc';
    ctx.fillText(`Floor: ${engine.dungeonLevel}`, statsX + 90, panelY + 34);
    
    // Stats (STR/DEX/VIT/MAG)
    ctx.fillStyle = '#777788';
    ctx.font = '9px monospace';
    ctx.fillText(`STR:${player.stats.strength} DEX:${player.stats.dexterity} VIT:${player.stats.vitality} MAG:${player.stats.magic}`, statsX, panelY + 68);

    // Attack mode indicator
    const modeX = statsX + 90;
    ctx.fillStyle = player.attackMode === 'melee' ? '#cc6666' : '#66cc66';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`[${player.attackMode === 'melee' ? '⚔ ESPADA' : '🏹 ARCO'}]`, modeX, panelY + 50);
    ctx.fillStyle = '#555566';
    ctx.font = '8px monospace';
    ctx.fillText('Tab: cambiar', modeX, panelY + 62);

    // Skills bar (bottom right of HUD)
    const skillBarX = canvas.width - 200;
    const skillBarY = panelY + 8;
    ctx.fillStyle = '#888899';
    ctx.font = '8px monospace';
    ctx.fillText('HABILIDADES', skillBarX, skillBarY);
    
    const skillKeys = ['F', 'Q', 'E', 'R'];
    const now = Date.now();
    for (let i = 0; i < Math.min(4, player.skills.length); i++) {
      const skill = player.skills[i];
      const sx = skillBarX + i * 45;
      const sy = skillBarY + 8;
      const boxSize = 36;
      
      // Skill box background
      if (skill.unlocked) {
        const onCooldown = (now - skill.lastUsed < skill.cooldown);
        ctx.fillStyle = onCooldown ? '#1a1a2a' : '#0a0a1a';
        ctx.fillRect(sx, sy, boxSize, boxSize);
        ctx.strokeStyle = onCooldown ? '#333344' : '#444466';
        ctx.lineWidth = onCooldown ? 1 : 2;
        ctx.strokeRect(sx, sy, boxSize, boxSize);
        
        // Skill icon (colored square based on type)
        let iconColor = '#888888';
        switch (skill.type) {
          case 'fire': iconColor = '#ff4400'; break;
          case 'ice': iconColor = '#4488ff'; break;
          case 'lightning': iconColor = '#ffff00'; break;
          case 'heal': iconColor = '#44ff44'; break;
        }
        ctx.fillStyle = iconColor;
        ctx.fillRect(sx + 8, sy + 8, 20, 20);
        
        // Cooldown overlay
        if (onCooldown) {
          const cdPercent = (skill.cooldown - (now - skill.lastUsed)) / skill.cooldown;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(sx, sy, boxSize, boxSize * cdPercent);
        }
        
        // Key label
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(skillKeys[i], sx + 2, sy + 10);
        
        // Mana cost
        ctx.fillStyle = '#4488ff';
        ctx.font = '7px monospace';
        ctx.fillText(`${skill.manaCost}`, sx + 2, sy + boxSize - 2);
      } else {
        // Locked skill
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(sx, sy, boxSize, boxSize);
        ctx.strokeStyle = '#222233';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, boxSize, boxSize);
        ctx.fillStyle = '#333344';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', sx + boxSize / 2, sy + boxSize / 2 + 5);
      }
    }
    ctx.textAlign = 'left';

    // Messages log
    const msgX = statsX + 220;
    ctx.font = '9px monospace';
    const maxMessages = 5;
    for (let i = 0; i < Math.min(maxMessages, engine.messages.length); i++) {
      const msg = engine.messages[i];
      const age = (time - msg.time) / 1000;
      const alpha = Math.max(0.3, 1 - age / 10);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = msg.color;
      ctx.fillText(msg.text.substring(0, 55), msgX, panelY + 14 + i * 14);
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
    const slotSize = 32;
    const gap = 4;

    // Panel background with border
    ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
    ctx.fillRect(panelX, panelY, slotSize * 4 + gap * 5 + 10, slotSize + gap * 2 + 14);
    
    // Decorative border
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, slotSize * 4 + gap * 5 + 10, slotSize + gap * 2 + 14);
    ctx.strokeStyle = '#222244';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 2, panelY + 2, slotSize * 4 + gap * 5 + 6, slotSize + gap * 2 + 10);

    // Label
    ctx.fillStyle = '#666688';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('EQUIPMENT', panelX + 5, panelY + slotSize + 18);

    const slots = ['weapon', 'armor', 'ring', 'amulet'] as const;
    const slotLabels = ['⚔', '🛡', '💍', '📿'];
    const slotNames = ['WPN', 'ARM', 'RNG', 'AMU'];

    for (let i = 0; i < slots.length; i++) {
      const sx = panelX + 5 + i * (slotSize + gap);
      const sy = panelY + 5;
      const item = engine.player.equipment[slots[i]];

      // Slot background
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(sx, sy, slotSize, slotSize);
      
      // Slot border with rarity color
      const borderColor = item ? this.engine.getRarityColor(item.rarity) : '#333355';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = item ? 2 : 1;
      ctx.strokeRect(sx, sy, slotSize, slotSize);

      if (item && item.sprite) {
        // Draw item sprite with proper scaling
        const spriteScale = (slotSize - 8) / Math.max(item.sprite.length, item.sprite[0].length);
        const spriteX = sx + (slotSize - item.sprite[0].length * spriteScale) / 2;
        const spriteY = sy + (slotSize - item.sprite.length * spriteScale) / 2;
        this.drawPixelSprite(ctx, spriteX, spriteY, item.sprite, this.getItemPalette(item), spriteScale);
      } else {
        // Empty slot indicator
        ctx.fillStyle = '#333355';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(slotNames[i], sx + slotSize / 2, sy + slotSize / 2 + 4);
      }
    }
  }

  renderMinimap(): void {
    const { ctx, canvas, engine } = this;
    const mapSize = 120;
    const mapX = canvas.width - mapSize - 10;
    const mapY = 5;
    const mapHeight = mapSize * (DUNGEON_HEIGHT / DUNGEON_WIDTH);
    const pixelSize = mapSize / DUNGEON_WIDTH;

    // Map background with decorative border
    ctx.fillStyle = 'rgba(5, 5, 15, 0.92)';
    ctx.fillRect(mapX - 4, mapY - 4, mapSize + 8, mapHeight + 22);
    
    // Double border
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX - 4, mapY - 4, mapSize + 8, mapHeight + 22);
    ctx.strokeStyle = '#222244';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX - 2, mapY - 2, mapSize + 4, mapHeight + 18);

    // Label
    ctx.fillStyle = '#666688';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FLOOR ${engine.dungeonLevel}`, mapX, mapY + mapHeight + 14);

    const dungeon = engine.dungeon;

    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (!dungeon.revealed[y]?.[x]) continue;

        const px = mapX + x * pixelSize;
        const py = mapY + y * pixelSize;

        if (dungeon.tiles[y][x] === 'wall') {
          ctx.fillStyle = dungeon.visible[y]?.[x] ? '#3a3a5a' : '#252540';
        } else if (dungeon.tiles[y][x] === 'stairs') {
          ctx.fillStyle = '#ffdd00';
        } else if (dungeon.tiles[y][x] === 'chest') {
          ctx.fillStyle = '#aa8800';
        } else if (dungeon.tiles[y][x] === 'water') {
          ctx.fillStyle = '#1a3050';
        } else if (dungeon.tiles[y][x] === 'lava') {
          ctx.fillStyle = '#5a1a00';
        } else {
          ctx.fillStyle = dungeon.visible[y]?.[x] ? '#4a3830' : '#2a1f1a';
        }
        ctx.fillRect(px, py, Math.ceil(pixelSize), Math.ceil(pixelSize));
      }
    }

    // Monster dots (blinking)
    const blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
    for (const m of dungeon.monsters) {
      if (m.isDead) continue;
      if (!dungeon.visible[m.pos.y]?.[m.pos.x]) continue;
      ctx.fillStyle = blinkOn ? '#ff3333' : '#cc0000';
      ctx.fillRect(
        mapX + m.pos.x * pixelSize,
        mapY + m.pos.y * pixelSize,
        Math.ceil(pixelSize * 1.5),
        Math.ceil(pixelSize * 1.5)
      );
    }

    // Player dot (pulsing)
    const playerPulse = 2 + Math.sin(Date.now() / 300) * 1;
    ctx.fillStyle = '#00ff44';
    ctx.fillRect(
      mapX + engine.player.pos.x * pixelSize - playerPulse / 2,
      mapY + engine.player.pos.y * pixelSize - playerPulse / 2,
      Math.ceil(pixelSize * 2 + playerPulse),
      Math.ceil(pixelSize * 2 + playerPulse)
    );
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      mapX + engine.player.pos.x * pixelSize,
      mapY + engine.player.pos.y * pixelSize,
      Math.ceil(pixelSize),
      Math.ceil(pixelSize)
    );
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
