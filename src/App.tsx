import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { Renderer } from './game/renderer';
import { GameState, Item } from './game/types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showInventory, setShowInventory] = useState(false);
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate(n => n + 1);
    setGameState(engineRef.current?.gameState || 'menu');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize engine and renderer
    const engine = new GameEngine();
    engine.onStateChange = triggerUpdate;
    engineRef.current = engine;

    const renderer = new Renderer(canvas, engine);
    rendererRef.current = renderer;

    // Game loop
    const gameLoop = () => {
      engine.updateParticles();
      engine.updateProjectiles();
      
      // Update attack timer
      if (engine.player.isAttacking) {
        engine.player.attackTimer -= 16;
        if (engine.player.attackTimer <= 0) {
          engine.player.isAttacking = false;
        }
      }

      renderer.render();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };
    animFrameRef.current = requestAnimationFrame(gameLoop);

    // Keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (engine.gameState === 'menu') {
        if (e.key === 'Enter' || e.key === ' ') {
          engine.startGame();
          triggerUpdate();
        }
        return;
      }

      if (engine.gameState === 'dead') {
        if (e.key === 'Enter') {
          engine.startGame();
          triggerUpdate();
        }
        return;
      }

      if (showInventory) {
        if (e.key === 'i' || e.key === 'I' || e.key === 'Escape') {
          setShowInventory(false);
          triggerUpdate();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          engine.movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          engine.movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          engine.movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engine.movePlayer(1, 0);
          break;
        case ' ':
          e.preventDefault();
          // Attack in facing direction
          engine.movePlayer(engine.player.direction.x, engine.player.direction.y);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          engine.castSpell();
          triggerUpdate();
          break;
        case 'i':
        case 'I':
          setShowInventory(prev => !prev);
          triggerUpdate();
          break;
        case 'Enter':
          // Descend stairs
          if (engine.dungeon.tiles[engine.player.pos.y]?.[engine.player.pos.x] === 'stairs') {
            engine.nextLevel();
            triggerUpdate();
          }
          break;
        case '1':
          useQuickPotion(0);
          break;
        case '2':
          useQuickPotion(1);
          break;
        case '3':
          useQuickPotion(2);
          break;
        case '4':
          useQuickPotion(3);
          break;
      }
    };

    const useQuickPotion = (slot: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      const potions = engine.player.inventory.filter(i => i.type === 'potion');
      if (potions[slot]) {
        const idx = engine.player.inventory.indexOf(potions[slot]);
        engine.useItem(potions[slot], idx);
        triggerUpdate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [triggerUpdate, showInventory]);

  const handleCanvasClick = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.gameState === 'menu') {
      engine.startGame();
      triggerUpdate();
    } else if (engine.gameState === 'dead') {
      engine.startGame();
      triggerUpdate();
    }
  };

  const handleInventoryClick = (item: Item, index: number, action: 'use' | 'drop') => {
    const engine = engineRef.current;
    if (!engine) return;
    if (action === 'use') {
      engine.useItem(item, index);
    } else {
      engine.dropItem(index);
    }
    triggerUpdate();
  };

  const engine = engineRef.current;
  const player = engine?.player;

  return (
    <div className="w-full h-screen overflow-hidden bg-black relative select-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onClick={handleCanvasClick}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Inventory Overlay */}
      {showInventory && engine && gameState === 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="bg-[#0a0a1a] border-2 border-[#333355] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#ffdd44] font-mono">INVENTORY</h2>
              <button
                onClick={() => { setShowInventory(false); triggerUpdate(); }}
                className="text-[#ff4444] hover:text-[#ff6666] font-mono text-lg"
              >
                [X] Close
              </button>
            </div>

            {/* Equipment */}
            <div className="mb-4 p-3 bg-[#111122] rounded border border-[#222244]">
              <h3 className="text-sm font-bold text-[#aaaaaa] font-mono mb-2">EQUIPMENT</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-[#888888]">
                  Weapon: <span className={player?.equipment.weapon ? 'text-[#ffdd44]' : 'text-[#444444]'}>
                    {player?.equipment.weapon?.name || 'Empty'}
                  </span>
                </div>
                <div className="text-[#888888]">
                  Armor: <span className={player?.equipment.armor ? 'text-[#ffdd44]' : 'text-[#444444]'}>
                    {player?.equipment.armor?.name || 'Empty'}
                  </span>
                </div>
                <div className="text-[#888888]">
                  Ring: <span className={player?.equipment.ring ? 'text-[#ffdd44]' : 'text-[#444444]'}>
                    {player?.equipment.ring?.name || 'Empty'}
                  </span>
                </div>
                <div className="text-[#888888]">
                  Amulet: <span className={player?.equipment.amulet ? 'text-[#ffdd44]' : 'text-[#444444]'}>
                    {player?.equipment.amulet?.name || 'Empty'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 p-3 bg-[#111122] rounded border border-[#222244]">
              <h3 className="text-sm font-bold text-[#aaaaaa] font-mono mb-2">STATS</h3>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono text-[#cccccc]">
                <div>STR: {player?.stats.strength}</div>
                <div>DEX: {player?.stats.dexterity}</div>
                <div>VIT: {player?.stats.vitality}</div>
                <div>MAG: {player?.stats.magic}</div>
                <div>ATK: {engine.getPlayerAttack()}</div>
                <div>DEF: {engine.getPlayerDefense()}</div>
                <div>HP: {player?.stats.hp}/{player?.stats.maxHp}</div>
                <div>MP: {player?.stats.mp}/{player?.stats.maxMp}</div>
              </div>
            </div>

            {/* Items */}
            <div className="p-3 bg-[#111122] rounded border border-[#222244]">
              <h3 className="text-sm font-bold text-[#aaaaaa] font-mono mb-2">
                ITEMS ({player?.inventory.length}/20)
              </h3>
              {player?.inventory.length === 0 ? (
                <p className="text-[#444444] text-xs font-mono">No items in inventory.</p>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {player?.inventory.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between p-2 bg-[#0a0a15] rounded border border-[#1a1a2e] hover:border-[#333355]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: engine.getRarityColor(item.rarity) }}
                        >
                          [{item.rarity.toUpperCase()}]
                        </span>
                        <span className="text-xs font-mono text-[#cccccc]">{item.name}</span>
                        <span className="text-xs font-mono text-[#666666]">- {item.description}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleInventoryClick(item, index, 'use')}
                          className="px-2 py-1 text-xs font-mono bg-[#224422] text-[#44ff44] hover:bg-[#336633] rounded"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleInventoryClick(item, index, 'drop')}
                          className="px-2 py-1 text-xs font-mono bg-[#442222] text-[#ff4444] hover:bg-[#663333] rounded"
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {gameState === 'playing' && (
        <div className="absolute bottom-24 left-4 md:hidden z-10">
          <div className="grid grid-cols-3 gap-1 w-32">
            <div></div>
            <button
              onTouchStart={() => engineRef.current?.movePlayer(0, -1)}
              className="w-10 h-10 bg-[#222244] border border-[#444466] rounded flex items-center justify-center text-white text-lg active:bg-[#333366]"
            >
              ↑
            </button>
            <div></div>
            <button
              onTouchStart={() => engineRef.current?.movePlayer(-1, 0)}
              className="w-10 h-10 bg-[#222244] border border-[#444466] rounded flex items-center justify-center text-white text-lg active:bg-[#333366]"
            >
              ←
            </button>
            <button
              onTouchStart={() => engineRef.current?.movePlayer(0, 1)}
              className="w-10 h-10 bg-[#222244] border border-[#444466] rounded flex items-center justify-center text-white text-lg active:bg-[#333366]"
            >
              ↓
            </button>
            <button
              onTouchStart={() => engineRef.current?.movePlayer(1, 0)}
              className="w-10 h-10 bg-[#222244] border border-[#444466] rounded flex items-center justify-center text-white text-lg active:bg-[#333366]"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Stairs indicator */}
      {gameState === 'playing' && engine && engine.dungeon.tiles[engine.player.pos.y]?.[engine.player.pos.x] === 'stairs' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-16 z-10 pointer-events-none">
          <div className="bg-[#0a0a1a]/90 border border-[#ffdd44] rounded px-4 py-2 text-center animate-pulse">
            <p className="text-[#ffdd44] text-sm font-mono">⬇ Stairs Down ⬇</p>
            <p className="text-[#888888] text-xs font-mono">Press ENTER to descend</p>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute bottom-24 right-4 md:hidden z-10 flex flex-col gap-2">
          <button
            onTouchStart={() => {
              if (engineRef.current) {
                engineRef.current.castSpell();
                triggerUpdate();
              }
            }}
            className="w-12 h-12 bg-[#442200] border border-[#664400] rounded flex items-center justify-center text-[#ff8800] text-xs font-mono active:bg-[#664400]"
          >
            🔥
          </button>
          <button
            onTouchStart={() => {
              if (engineRef.current) {
                engineRef.current.movePlayer(
                  engineRef.current.player.direction.x,
                  engineRef.current.player.direction.y
                );
              }
            }}
            className="w-12 h-12 bg-[#442222] border border-[#664444] rounded flex items-center justify-center text-white text-xs font-mono active:bg-[#663333]"
          >
            ATK
          </button>
          <button
            onTouchStart={() => { setShowInventory(true); triggerUpdate(); }}
            className="w-12 h-12 bg-[#222244] border border-[#444466] rounded flex items-center justify-center text-white text-xs font-mono active:bg-[#333366]"
          >
            INV
          </button>
          {engine && engine.dungeon.tiles[engine.player.pos.y]?.[engine.player.pos.x] === 'stairs' && (
            <button
              onTouchStart={() => {
                if (engineRef.current) {
                  engineRef.current.nextLevel();
                  triggerUpdate();
                }
              }}
              className="w-12 h-12 bg-[#444400] border border-[#666600] rounded flex items-center justify-center text-[#ffdd44] text-xs font-mono active:bg-[#666600] animate-pulse"
            >
              ⬇
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
