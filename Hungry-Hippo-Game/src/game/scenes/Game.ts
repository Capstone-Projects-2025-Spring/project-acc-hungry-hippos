/**
 * @file Game.ts
 * @description Main Phaser Scene for Hippo Game: Manages gameplay, player logic, scoring, food spawning, and sync via WebSocket.
 */

import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AAC_DATA, AacVerb } from '../../Foods';
import { Hippo } from '../Hippo';
import { Edge, EdgeSlideStrategy } from '../EdgeSlideStrategy';
import { movementStore } from './MovementStore';
import { ModeSettings } from '../../config/gameModes';
import { HIPPO_COLORS } from '../../config/hippoColors';

interface FoodState {
  instanceId: string;
  foodId: string;
  x: number;
  y: number;
  effect: AacVerb | null;
}

export class Game extends Scene {
  private sessionId!: string;
  private hippo: Hippo | null = null;
  private foods!: Phaser.Physics.Arcade.Group;
  private foodSpawnTimer?: Phaser.Time.TimerEvent;
  private currentTargetFoodId: string | null = null;
  private currentTargetFoodEffect: AacVerb | null = null;
  private playerScores: Record<string, number> = {};
  private players: Record<string, Hippo> = {};
  private edgeAssignments: Record<string, string> = {};
  private availableEdges = [ 'bottom','top','right', 'left' ];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private sendMessage!: (msg: any) => void;
  private localPlayerId!: string;
  private usePointerControl = false;
  private isKeyboardActive = false;
 
  /**
   * Variable to track time left
   */
  private timerText!: Phaser.GameObjects.Text;


  // Handlers for cleanup
    private onSyncFoodState: any;
    private onApplyPlayerEffect: any;
    private onExternalMessage: any;
    private onStartGame: any;
    private onTimerUpdate: any;
    private unsubscribeMove?: () => void;



  private role: string = 'Hippo Player';
  private lastSentX: number | null = null;
  private lastSentY: number | null = null;
  private lastMoveSentAt: number = 0;
  private modeSettings: ModeSettings = { fruitSpeed: 100, allowPenalty: true, allowEffect: true }; // fallback
  //private pendingHippoPlayers: string[] = [];

  // Variable to track if user has interacted with the game
  private hasUserInteracted = false;
  // Variable to track if swipe hint is shown
  private swipeHint?: Phaser.GameObjects.Image;


  //private hippoGroup!: Phaser.Physics.Arcade.Group;



  constructor() {
    super('Game');
  }

  /**
   * Defensive: Phaser calls init() without arguments, so allow empty/no-op.
   * Real game data is passed by your React wrapper later!
   */
  init(data: { 
    sendMessage: (msg: any) => void; 
      localPlayerId: string; 
      sessionId: string;
      role: string;
      connectedUsers?: { color: string | undefined; userId: string; role: string }[];
      modeSettings?: ModeSettings;
      localPlayerEdge?: string;
  }) {
    this.sendMessage = data.sendMessage;
    this.localPlayerId = data.localPlayerId;
    this.sessionId = data.sessionId;
    this.role = data.role;

    if (data.modeSettings) {
      this.modeSettings = data.modeSettings;
    }
    if (data.connectedUsers) {
      data.connectedUsers
      .filter(u => u.role === 'Hippo Player')
      .forEach(u => {
        const edgeForPlayer = (u.userId === this.localPlayerId) ? data.localPlayerEdge : undefined;
        console.log(`[Game.init] Adding player ${u.userId} with color ${u.color} and edge ${edgeForPlayer}`);
        this.addPlayer(u.userId, u.color, edgeForPlayer as Edge | undefined);
      });
    }
    this.role = data.role;
  }


  preload() {
    console.log('[Game] Preload called');
    this.load.image('background', '/assets/presenterBg.webp');
    this.load.image('swipeHand', '/assets/swipeHand.png');
    this.load.image('tree', '/assets/tree.webp');

    AAC_DATA.categories.forEach(category => {
      category.foods.forEach(food => {
        if (food.imagePath) {
          this.load.image(food.id, food.imagePath);
        }
      });
    });
    // this.load.spritesheet('character', '/assets/spritesheet.png', {
    //   frameWidth: 350,
    //   frameHeight: 425
    // });


    HIPPO_COLORS.forEach(h => {
      this.load.image(h.color + 'Hippo', h.imgSrc);
    });

  }


  private getEdgePosition(edge: string, sprite?: Phaser.GameObjects.Sprite) {
    const w = this.scale.width;
    const h = this.scale.height;
    // const marginX = w * 0.05;
    // const marginY = h * 0.05;

    const marginX = sprite ? sprite.displayWidth / 2 : w * 0.05;
    const marginY = sprite ? sprite.displayHeight / 2 : h * 0.05;


    switch (edge) {
      case 'top': return { x: w / 2, y: marginY };
      case 'bottom': return { x: w / 2, y: h - marginY };
      case 'left': return { x: marginX, y: h / 2 };
      case 'right': return { x: w - marginX, y: h / 2 };
      default: return { x: w / 2, y: h / 2 };
    }
  }

  public addPlayer(playerId: string, color?: string, hippoEdge?: Edge) {
    if (!(playerId in this.playerScores)) this.playerScores[playerId] = 0;
    if (!(playerId in this.players)) {
      const edge = hippoEdge || (this.availableEdges.shift() || 'bottom') as Edge;
      const { x, y } = this.getEdgePosition(edge);
      const slideDistance = (edge === 'top' || edge === 'bottom') ? this.scale.width * 0.8 : this.scale.height * 0.8;

      let spriteKey = 'character';
      const strategy = new EdgeSlideStrategy(edge, slideDistance);
      if (color) {
        spriteKey = color + 'Hippo';
      }
      //console.log(`[addPlayer] ${playerId} -> color: ${color}, spriteKey: ${spriteKey}`);

      const playerSprite = new Hippo(this, x, y, spriteKey, strategy);

      //this.hippoGroup.add(playerSprite);

      // Remove the player from available edges if it was passed
      if (hippoEdge) {
        const index = this.availableEdges.indexOf(hippoEdge);
        if (index > -1) {
          this.availableEdges.splice(index, 1);
        }
      }
      this.edgeAssignments[playerId] = edge;

      playerSprite.setScale(0.12);
     
      playerSprite.setCollideWorldBounds(true);
      playerSprite.setImmovable(true);
      switch (edge) {
        case 'top': playerSprite.setAngle(180); break;
        case 'left': playerSprite.setAngle(90); break;
        case 'right': playerSprite.setAngle(-90); break;
        case 'bottom': playerSprite.setAngle(0); break;
      }
      if (this.foods) {
        this.physics.add.overlap(playerSprite, this.foods, (_hippo, fruit) => {
          if (fruit instanceof Phaser.Tilemaps.Tile) return;
          const fruitGO = fruit instanceof Phaser.GameObjects.GameObject ? fruit : null;
          if (fruitGO) this.handleFruitCollision(playerId, fruitGO);
        });
      }
      playerSprite.setTargetPosition(x, y);
      this.players[playerId] = playerSprite;
      if (playerId === this.localPlayerId && this.role !== 'Spectator') {
        this.hippo = playerSprite;
        const camera = this.cameras.main;
        switch (edge) {
          case 'bottom':
            camera.setRotation(0);
            break;
          case 'right':
            camera.setRotation(Math.PI / 2);
            break;
          case 'top':
            camera.setRotation(Math.PI);
            break;
          case 'left':
            camera.setRotation(-Math.PI / 2);
            break;
        }
      }
    }
  }



  /**
   * Maps standard arrow key inputs (cursors) to the correct direction
   * for the player's edge of the screen, so "up" is always "toward the center."
   * 
   * @param edge   The edge ('top', 'bottom', 'right', 'left') where this player is located.
   * @param cursors Phaser's cursor key object (from createCursorKeys()).
   * @returns A virtual cursors object where isDown for left/right/up/down is remapped appropriately.
   *
   * Example Usage:
   * ```
   * const edge = this.edgeAssignments[this.localPlayerId] as Edge;
   * const mappedCursors = this.getEdgeCursors(edge, this.cursors);
   * this.hippo.update(mappedCursors);
   * ```
   */

private getEdgeCursors(edge: Edge, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
  switch (edge) {
    case 'bottom':
      return cursors;
    case 'top':
      return {
        left:  { isDown: cursors.right.isDown },
        right: { isDown: cursors.left.isDown },
        up:    { isDown: cursors.down.isDown },
        down:  { isDown: cursors.up.isDown }
      } as Phaser.Types.Input.Keyboard.CursorKeys;
    case 'right':
      // For right edge, up is right, down is left
      return {
        left:  { isDown: cursors.down.isDown },
        right: { isDown: cursors.up.isDown },
        up:    { isDown: cursors.right.isDown },
        down:  { isDown: cursors.left.isDown }
      } as Phaser.Types.Input.Keyboard.CursorKeys;
    case 'left':
      // For left edge, up is left, down is right
      return {
        left:  { isDown: cursors.up.isDown },
        right: { isDown: cursors.down.isDown },
        up:    { isDown: cursors.left.isDown },
        down:  { isDown: cursors.right.isDown }
      } as Phaser.Types.Input.Keyboard.CursorKeys;
    default:
      return cursors;
  }
}


/**
 * Handles pointer (touch or mouse) movement for the local Hippo player.
 *
 * Determines the world coordinates based on the main camera rotation,
 * clamps the movement along the allowed edge (horizontal for top/bottom, vertical for left/right),
 * updates the Hippo's facing direction, and sends the new target position.
 *
 * This method is only active for the local (non-spectator) Hippo and enables pointer control mode.
 *
 * @param {Phaser.Input.Pointer} pointer - The Phaser pointer event with screen (and derived world) coordinates.
 *
 * Usage:
 * Called in response to 'pointerdown' and 'pointermove' events for player control.
 */

  private handlePointer(pointer: Phaser.Input.Pointer) {
  // Only allow local hippo and if not spectator
  if (!this.hippo || this.role === 'Spectator') return;
  this.usePointerControl = true;

  // Determine which edge this hippo is assigned to
  const edge = this.edgeAssignments[this.localPlayerId] as Edge;
  const prevX = this.hippo.targetX;
  const prevY = this.hippo.targetY;

  const camera = this.cameras.main;
  const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);

  
  if (edge === 'top' || edge === 'bottom') {
    // Allow sliding left/right only; y stays fixed
    // Clamp to play area if needed
    const minX = this.hippo.displayWidth / 2;
    const maxX = this.scale.width - this.hippo.displayWidth / 2;

    const x = Phaser.Math.Clamp(worldPoint.x, minX, maxX);
    const y = this.hippo.y;
    this.hippo.updatePointerFlip(prevX, prevY, edge, x, y);
    this.hippo.setTargetPosition(x, y);
  } else if (edge === 'left' || edge === 'right') {
    // Allow sliding up/down only; x stays fixed
    const minY = this.hippo.displayHeight/2;
    const maxY = this.scale.height - this.hippo.displayHeight/2;
    const x = this.hippo.x;

    const y = Phaser.Math.Clamp(worldPoint.y, minY, maxY);
    this.hippo.updatePointerFlip(prevX, prevY, edge, x, y);

    this.hippo.setTargetPosition(x, y);
  }
}


/**
 * Phaser's built-in scene creation method.
 *
 * Initializes the background, input handlers (keyboard and pointer),
 * foods physics group, and swipe hint animation.
 * Also sets up all movement and game event subscriptions, camera orientation for the player,
 * and registers custom event listeners (effects, game over, timer, etc.).
 *
 * This is the main method where the scene is brought to life after assets are loaded.
 * 
 * Usage:
 * Called automatically by Phaser after preload.
 * Sets up everything for the current player/role.
 */



  create() {
    const bg = this.add.image(512, 512, 'background');
    bg.setOrigin(0.5, 0.5);
    bg.setDisplaySize(this.scale.width, this.scale.height);

    const tree = this.add.image(512, 512, 'tree');
    tree.setOrigin(0.5, 0.5);
    tree.setScale(0.35);
    tree.setDepth(3);


    if (this.role === 'Spectator'){this.physics.pause();}
        this.input.keyboard!.on('keydown', () => {
      this.isKeyboardActive = true;
      this.usePointerControl = false;
    });
    this.input.keyboard!.on('keyup', () => {
      this.isKeyboardActive = false;
    });


   // this.hippoGroup = this.physics.add.group();


    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!this.isKeyboardActive) this.usePointerControl = true;
        this.handlePointer(pointer);
      });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown && !this.isKeyboardActive) {
          this.usePointerControl = true;
          this.handlePointer(pointer);
        }
      });

  
    
    this.foods = this.physics.add.group();
    this.cursors = this.input!.keyboard!.createCursorKeys();


     this.input.once('pointerdown', () => {
      this.hasUserInteracted = true;
      this.swipeHint?.destroy();
    });

    // Check if user has interacted with the game on keyboard
    this.input.keyboard?.on('keydown', () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;
        this.swipeHint?.destroy();
      }
    });



    this.onSyncFoodState = (foodStates: FoodState[]) => this.syncFoodState(foodStates);
    this.onApplyPlayerEffect = (data: { targetUserId: string, effect: AacVerb }) => {
    if (data.targetUserId !== this.localPlayerId) {
      this.applyEffectToPlayer(data.targetUserId, data.effect);
    }
  };
  this.onExternalMessage = (data: any) => {
    if (data.type == 'gameOver') {
      this.handleGameOver();
    }
  };
  this.onStartGame = () => {
    this.requestStartTimer();
  };
  this.onTimerUpdate = (secondsLeft: number) => {
    this.updateTimerUI(secondsLeft);
  };

  // Subscribe EventBus with named handlers
  EventBus.on('sync-food-state', this.onSyncFoodState);
  EventBus.on('apply-player-effect', this.onApplyPlayerEffect);
  EventBus.on('external-message', this.onExternalMessage);
  EventBus.on('start-game', this.onStartGame);
  EventBus.on('TIMER_UPDATE', this.onTimerUpdate);
  EventBus.on('players-updated', this.handlePlayersUpdated, this);

  // movementStore subscription (and save the unsubscribe function!)
    this.unsubscribeMove = movementStore.subscribe(({ userId, x, y }) => {
    const player = this.players[userId];
    if (player && userId !== this.localPlayerId) {
      const edge = this.edgeAssignments[userId] as Edge;
      const prevX = player.targetX;
      const prevY = player.targetY;
      player.updatePointerFlip(prevX, prevY, edge, x, y);
      player.setTargetPosition(x, y);
      player.hasSynced = true;
    }
    });

    // Listen for shutdown/destroy events (Phaser scene events)
    this.events.on('shutdown', this.shutdown, this);
    this.events.on('destroy', this.destroy, this);

    
    
    
    EventBus.emit('current-scene-ready', this);
    EventBus.emit('edges-ready', this.edgeAssignments); 
    
    
    // Delay animation for swipe hand
    this.time.delayedCall(100, () => {
      if (this.role === 'Hippo Player') {
        // Play animation only for the hippo users, not on spectator
        const edge = this.edgeAssignments[this.localPlayerId] as Edge;

        let hintX = this.scale.width / 2;
        let hintY = this.scale.height - 100;
        let tweenProps: Partial<Phaser.Types.Tweens.TweenBuilderConfig> = {};
        let handAngle = 0; 

        // Determine hand position and angle based on edge
        switch (edge) {
          case 'top':
            hintY = 140;
            handAngle = 180; // Upside down
            tweenProps = {
              x: {
                from: hintX - 60,
                to: hintX + 60
              }
            };
            break;
          case 'left':
            hintX = 140;
            hintY = this.scale.height / 2;
            handAngle = -270; // Pointing right
            tweenProps = {
              y: {
                from: hintY - 60,
                to: hintY + 60
              }
            };
            break;
          case 'right':
            hintX = this.scale.width - 140;
            hintY = this.scale.height / 2;
            handAngle = 270; // Pointing left
            tweenProps = {
              y: {
                from: hintY - 60,
                to: hintY + 60
              }
            };
            break;
          case 'bottom':
          default:
            hintY = this.scale.height - 140;
            handAngle = 0; // No rotation
            tweenProps = {
              x: {
                from: hintX - 60,
                to: hintX + 60
              }
            };
            break;
        }

        this.swipeHint = this.add.image(hintX, hintY, 'swipeHand')
          .setOrigin(0.5)
          .setDepth(1000)
          .setScale(0.6)
          .setAngle(handAngle)
          .setScrollFactor(0); // Important: stays on screen even if camera moves

        this.tweens.add({
          targets: this.swipeHint,
          ...tweenProps,
          duration: 800,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    });

  }




  
    
  update() {
  

    if (this.hippo && this.role !== 'Spectator') {
      if (this.usePointerControl) {
        this.hippo.update(); // <-- no cursors, triggers lerp to target
      } else if (this.cursors) {


        /** 
         * Keyboard arrow keys, remapped to match the player's edge view.
         * This ensures that 'up' always means 'toward the center of the board' from the player's perspective.
         */
       const edge = this.edgeAssignments[this.localPlayerId] as Edge;
        this.hippo.update(this.getEdgeCursors(edge, this.cursors)); 
        
      }
      const newX = this.hippo.x;
      const newY = this.hippo.y;
      if (this.hasUserInteracted && (this.lastSentX !== newX || this.lastSentY !== newY)) {
        const now = Date.now();
        if (!this.lastMoveSentAt || now - this.lastMoveSentAt > 40) {
          this.lastSentX = newX;
          this.lastSentY = newY;
          this.lastMoveSentAt = now;
          try {
            this.sendMessage?.({
              type: 'PLAYER_MOVE',
              payload: {
                sessionId: this.sessionId,
                userId: this.localPlayerId,
                x: newX,
                y: newY
              }
            });
          } catch (e) {
            console.error('[Game.update] Failed to send player movement:', e);
          }
        }
      }
    }
    for (const [id, hippo] of Object.entries(this.players)) {
      if (id !== this.localPlayerId && hippo.hasSynced) {
        hippo.update();
      }
    }
  }

  private handlePlayersUpdated(updatedUsers: { userId: string; role: string; color?: string }[]) {
    const activeIds = updatedUsers.map(u => u.userId);
    for (const userId of Object.keys(this.players)) {
      if (!activeIds.includes(userId)) {
        const edge = this.edgeAssignments[userId];
        if (edge && !this.availableEdges.includes(edge)) {
          this.availableEdges.unshift(edge as Edge);
        }
        // Remove the Hippo sprite
        this.players[userId].destroy();
        delete this.players[userId];
        delete this.playerScores[userId];
        delete this.edgeAssignments[userId];
      }
    }

    updatedUsers
      .filter(u => u.role === 'Hippo Player')
      .forEach(u => {
        if (!this.players[u.userId]){
          this.addPlayer(u.userId, u.color);
        }
      });
  }

  private applyEffectToPlayer(targetUserId: string, effect: AacVerb) {
    const targetHippo = this.players[targetUserId];
    const edge = this.edgeAssignments[targetUserId];
    if (!targetHippo) return;
    switch(effect.id) {
      case 'freeze':
        targetHippo.freeze(2000);
        break;
      case 'burn':
        targetHippo.setTint(0xff0000);
        this.time.delayedCall(1000, () => {
          targetHippo.clearTint();
        });
        break;
      case 'grow':
        targetHippo.setTint(0x00FF00);
        targetHippo.setScale(0.3);

        // Use snapToEdge() from Hippo, or call getEdgePosition with the sprite
    if (typeof targetHippo.snapToEdge === "function") {
        targetHippo.snapToEdge(edge); // This will call getEdgePosition with itself!
    }

        this.time.delayedCall(5000, () => {
          targetHippo.clearTint();
          targetHippo.setScale(0.12);

          if (typeof targetHippo.snapToEdge === "function") {
            targetHippo.snapToEdge(edge); // Snap again after shrink
        }

        });
        break;
    }
  }


  private handleFruitCollision(playerId: string, fruit: Phaser.GameObjects.GameObject) {
    if (!fruit.active || fruit.getData('eatenBy')) return;
    if (this.role === 'Spectator') return;

    fruit.setData('eatenBy', playerId);

    if (this.players[playerId] === this.hippo) {
      if ('disableBody' in fruit) {
        (fruit as Phaser.Physics.Arcade.Image).disableBody(true, true);
      }

      if ('texture' in fruit && fruit instanceof Phaser.GameObjects.Sprite) {
        const sprite = fruit as Phaser.GameObjects.Sprite;
        const foodId = sprite.texture.key;
        const isCorrect = foodId === this.currentTargetFoodId;
        if (isCorrect && this.currentTargetFoodEffect && this.modeSettings.allowEffect) {
          this.applyEffectToPlayer(playerId, this.currentTargetFoodEffect);
          this.sendMessage({
            type: 'PLAYER_EFFECT_APPLIED',
            payload: {
              sessionId: this.sessionId,
              targetUserId: playerId,
              effect: this.currentTargetFoodEffect
            }
          });
        }

        try {
          this.sendMessage({
            type: 'FRUIT_EATEN_BY_PLAYER',
            payload: {
              sessionId: this.sessionId,
              userId: playerId,
              isCorrect,
              allowPenalty: this.modeSettings.allowPenalty,
              effect: this.modeSettings.allowEffect ? this.currentTargetFoodEffect?.id : null
            },
          });
        } catch (e) {
          console.error('[Game.handleFruitCollision] Error sending score update:', e);
        }
        if (isCorrect) {
          this.currentTargetFoodEffect = null;
        }
        const instanceId = fruit.getData('instanceId');
        if (instanceId) {
            EventBus.emit('fruit-eaten', { instanceId });
        }
      }
    }
  }

  public applyModeSettings(settings: ModeSettings) {
   // console.log('[Game] Applying mode settings:', settings);
    this.modeSettings = settings;
  }

  /**
   * Synchronizes the food state with the server.
   * @param serverFoods Array of food states from the server.
   */
  private syncFoodState(serverFoods: FoodState[]) {
    // Get existing food sprites and their IDs
    const existingFoodSprites = this.foods.getChildren() as Phaser.Physics.Arcade.Image[];
    const serverFoodIds = new Set(serverFoods.map(f => f.instanceId));

    // Update existing sprites and create new ones
    serverFoods.forEach(foodState => {
      let existingSprite = existingFoodSprites.find(sprite => sprite.getData('instanceId') === foodState.instanceId);

      // If it exists, update its position smoothly using interpolation
      if (existingSprite) {
        this.tweens.add({
          targets: existingSprite,
          x: foodState.x * this.scale.width,
          y: foodState.y * this.scale.height,
          duration: 50,
          ease: 'Linear'
        });
      } else {
        // If it doesn't exist, create it on the client side
        const spawnX = foodState.x * this.scale.width;
        const spawnY = foodState.y * this.scale.height;
        const newFood = this.foods.create(spawnX, spawnY, foodState.foodId) as Phaser.Physics.Arcade.Image;
        newFood.setDepth(2);
        newFood.setData('instanceId', foodState.instanceId);
        newFood.setScale(0.12);
        newFood.body?.setCircle(newFood.width * 0.5);
        
        // If the food has an effect, apply the tint color
        if (foodState.effect && foodState.effect.color) {
          const tintColor = parseInt(foodState.effect.color.replace('#', '0x'));
          newFood.setTint(tintColor);
        }
      }
    });

    // Remove any client-side sprites that no longer exist on the server
    existingFoodSprites.forEach(sprite => {
      if (!serverFoodIds.has(sprite.getData('instanceId'))) {
        sprite.destroy();
      }
    });
  }


  public setTargetFood(foodId: string, effect: AacVerb | null = null) {
    this.currentTargetFoodId = foodId;
    this.currentTargetFoodEffect = effect;
  }

  /**
   * Removes a food item by its instance ID.
   * @param instanceId The unique identifier of the food item to remove.
   */
  public removeFoodByInstanceId(instanceId: string) {
    this.foods.children.each((child: any) => {
      if (child.getData('instanceId') === instanceId) {
        child.destroy();
        return false;
      }
      return true;
    });
  }

  /**
   * 
   * @param secondsLeft the number of seconds left in this session
   * If a text for the timer exists, updates the text to the number of seconds left.
   */
  private updateTimerUI(secondsLeft: number)
  {
    if(!this.timerText)
    {
      return;
    }
    if(this.timerText)
    {
      this.timerText.setText(`Time: ${secondsLeft}`);
    }
  }

  /**
   * This method handles the game when the timer hits 0.
   */
  private handleGameOver()
  {
    this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.7).setDepth(10);
    this.add.text(512, 384, 'Game Over', {
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);

    this.physics.pause();

    if(this.foodSpawnTimer)
    {
      this.foodSpawnTimer.remove(false);
    }
  }

  /**
   * This method requests system for a start timer.
   */
  public requestStartTimer()
  {
    if(this.sendMessage)
    {
      this.sendMessage({ type: 'START_TIMER', payload: { sessionId: this.sessionId} });
    }
  }

  public getEdgeAssignments(): Record<string, string> {
    return this.edgeAssignments;

  }



shutdown() {
  // Remove all EventBus listeners
  EventBus.off('sync-food-state', this.onSyncFoodState);
  EventBus.off('apply-player-effect', this.onApplyPlayerEffect);
  EventBus.off('external-message', this.onExternalMessage);
  EventBus.off('start-game', this.onStartGame);
  EventBus.off('TIMER_UPDATE', this.onTimerUpdate);

  // Unsubscribe from movementStore
  if (this.unsubscribeMove) {
    this.unsubscribeMove();
    this.unsubscribeMove = undefined;
  }
}

destroy() {
  this.shutdown(); // Always clean up
  this.time?.removeAllEvents?.();
  this.tweens?.killAll?.();
   if (this.foods) {
    this.foods.clear(true, true); // <--- DESTROY ALL SPRITES!
  }
  this.input?.removeAllListeners?.();
  }
}
