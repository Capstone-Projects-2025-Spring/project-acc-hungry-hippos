/**
 * @file Game.ts
 * @description This file defines the main Game scene for the Phaser game,
 * handling game logic, player interactions, food spawning, and score management.
 * It integrates with a shared movement store and sends player movement updates.
 */



import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AAC_DATA } from '../../Foods';
import { Hippo } from '../Hippo';
import { Edge, EdgeSlideStrategy } from '../EdgeSlideStrategy';
import { movementStore } from './MovementStore';
import { ModeSettings } from '../../config/gameModes';
/**
 * Represents the main Game scene in Phaser.
 * This scene manages game elements like players (Hippos), food items,
 * scoring, and interactions. It also handles input and communicates
 * player movements to other clients.
 */
export class Game extends Scene {
  private sessionId!: string;
  private hippo: Hippo | null = null;
  private foods: Phaser.Physics.Arcade.Group;
  private foodKeys: string[] = [];
  private lanePositions = [256, 512, 768];
  private foodSpawnTimer: Phaser.Time.TimerEvent;
  private currentTargetFoodId: string | null = null;
  private playerScores: Record<string, number> = {};
  // private scoreText: Phaser.GameObjects.Text;
  private players: Record<string, Hippo> = {};
  //private playerId: string;
  private edgeAssignments: Record<string, string> = {};
  private availableEdges = [ 'bottom','top','right', 'left' ];
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  
  /**
   * Function to send messages to other clients (e.g., via a WebSocket).
   * @private
   */
  private sendMessage!: (msg: any) => void;
  /**
   * The ID of the local player.
   * @private
   */
  private localPlayerId!: string;
  /**
   * Variable to track time left
   */
  private timerText!: Phaser.GameObjects.Text;


  private lastSentX: number | null = null;
  private lastSentY: number | null = null;
  private lastMoveSentAt: number = 0;

  /**
   * Settings for the game mode, which can be adjusted based on the game difficulty.
   * @private
   */
  private modeSettings: ModeSettings = { fruitSpeed: 500, allowPenalty: true }; // fallback default easy



  constructor() {
    super('Game');
  }


  // get the connected user data

  init(data: { 
    sendMessage: (msg: any) => void; 
    localPlayerId: string; 
    sessionId: string;
    connectedUsers?: { userId: string; role: string }[]; 
    modeSettings?: ModeSettings;
  }) {
    this.sendMessage = data.sendMessage;
    this.localPlayerId = data.localPlayerId;
    this.sessionId = data.sessionId;

    this.lastMoveSentAt = 0;
    this.lastSentX = null;
    this.lastSentY = null;


    if (data.modeSettings) {
        this.modeSettings = data.modeSettings;
        console.log('[Game] Mode settings applied in init:', this.modeSettings);
    }

  
    if (data.connectedUsers) {
      data.connectedUsers 
        .filter(u => u.role === 'Hippo Player')
        .forEach(u => this.addPlayer(u.userId));
    }
  }


  

  preload() {
    this.load.image('background', '/assets/presenterBg.png');
    AAC_DATA.categories.forEach(category => {
      category.foods.forEach(food => {
        if (food.imagePath) {
            console.log(`[PRELOAD] Loading food: ${food.id} from ${food.imagePath}`);

          this.load.image(food.id, food.imagePath);
        }
      });
    });
    this.load.spritesheet('character', '/assets/spritesheet.png', {
      frameWidth: 350,
      frameHeight: 425
    });
  }

  private getEdgePosition(edge: string) {
    const w = this.scale.width;
    const h = this.scale.height;
    const marginX = w * 0.05;
    const marginY = h * 0.05;
    switch (edge) {
      case 'top': return { x: w / 2, y: marginY };
      case 'bottom': return { x: w / 2, y: h - marginY };
      case 'left': return { x: marginX, y: h / 2 };
      case 'right': return { x: w - marginX, y: h / 2 };
      default: return { x: w / 2, y: h / 2 };
    }
  }

  public addPlayer(playerId: string) {
    if (!(playerId in this.playerScores)) this.playerScores[playerId] = 0;
    if (!(playerId in this.players)) {
      const edge = (this.availableEdges.shift() || 'bottom') as Edge;
      this.edgeAssignments[playerId] = edge;
      const { x, y } = this.getEdgePosition(edge);
      const slideDistance = edge === 'top' || edge === 'bottom' ? this.scale.width * 0.8 : this.scale.height * 0.8;
      const strategy = new EdgeSlideStrategy(edge, slideDistance);
      const playerSprite = new Hippo(this, x, y, 'character', strategy);
      playerSprite.displayWidth = 85;
      playerSprite.displayHeight = 100;
      playerSprite.setCollideWorldBounds(true);
      playerSprite.setImmovable(true);
      switch (edge) {
        case 'top': playerSprite.setAngle(180); break;
        case 'left': playerSprite.setAngle(90); break;
        case 'right': playerSprite.setAngle(-90); break;
        case 'bottom': playerSprite.setAngle(0); break;
      }
      this.physics.add.overlap(playerSprite, this.foods, (_hippo, fruit) => {
        if (fruit instanceof Phaser.Tilemaps.Tile) return;
        const fruitGO = fruit instanceof Phaser.GameObjects.GameObject ? fruit : null;
        if (fruitGO) this.handleFruitCollision(playerId, fruitGO);
      });
      playerSprite.setTargetPosition(x, y); // fix interpolation bug
      this.players[playerId] = playerSprite;
      if (playerId === this.localPlayerId) {
        this.hippo = playerSprite;
      }
    }
  }

  create() {
    const bg = this.add.image(512, 512, 'background');
    bg.setOrigin(0.5, 0.5);
    bg.setDisplaySize(this.scale.width, this.scale.height);
    
    this.foods = this.physics.add.group();
    this.cursors = this.input!.keyboard!.createCursorKeys();



    //this.addPlayer(this.localPlayerId);
    EventBus.emit('current-scene-ready', this);

    movementStore.subscribe(({ userId, x, y }) => {
      const player = this.players[userId];
      if (player && userId !== this.localPlayerId) {
        player.setTargetPosition(x, y);
      }
    });

    this.timerText = this.add.text(32, 80, 'Time: 60', {
    fontSize: '28px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 8, y: 4 }
   }).setScrollFactor(0);

    EventBus.emit('current-scene-ready', this);
    
    //this.playerScores["host"] = this.playerScores["host"] || 0; 


    // this.scoreText = this.add.text(32, 32, '', {
    //   fontSize: '24px',
    //   color: '#000',
    //   fontFamily: 'Arial',
    //   align: 'left',
    //   backgroundColor: 'rgba(255, 255, 255, 0.8)',
    //   padding: { x: 10, y: 10 }
    // });
    // this.updateScoreText();
      
    EventBus.on('external-message', (data: any) => {
      if(data.type === 'TIMER_UPDATE')
      {
        this.updateTimerUI(data.secondsLeft);
        if(data.secondsLeft === 60)
        {
          console.log('[Game.ts] Timer started, starting to spawn food.');
          this.startSpawningFood();
        }
      }
      else if(data.type == 'gameOver')
      {
        this.handleGameOver();
      }
    });

    EventBus.on('start-game', () => {
      console.log('[Game.ts] start-game event received, requesting timer start.')
      this.requestStartTimer();
    })
  }

 update() {
  if (this.hippo && this.cursors) {
    this.hippo.update(this.cursors);

    // Check if position changed
    const newX = this.hippo.x;
      const newY = this.hippo.y;

      if (this.lastSentX !== newX || this.lastSentY !== newY) {
        const now = Date.now();
        if (!this.lastMoveSentAt || now - this.lastMoveSentAt > 30) {
          this.lastSentX = newX;
          this.lastSentY = newY;
          this.lastMoveSentAt = now;

          this.sendMessage?.({
            type: 'PLAYER_MOVE',
            payload: {
              sessionId: this.sessionId,
              userId: this.localPlayerId,
              x: newX,
              y: newY
          }
        });
      }
    }
  }

  for (const [id, hippo] of Object.entries(this.players)) {
    if (id !== this.localPlayerId) {
      hippo.update(); // triggers interpolation
    }
  }
}

  private handleFruitCollision(playerId: string, fruit: Phaser.GameObjects.GameObject) {
    // Skips if the fruit has already been claimed
    if (!fruit.active || fruit.getData('eatenBy')) return;

    // Marks the fruit as eaten to prevent duplicate scoring
    fruit.setData('eatenBy', playerId);

    if (this.players[playerId] === this.hippo) {
      // HideS the fruit and remove physics but doesn't destroy immediately
      if ('disableBody' in fruit) {
        (fruit as Phaser.Physics.Arcade.Image).disableBody(true, true);
      }

      if ('texture' in fruit && fruit instanceof Phaser.GameObjects.Sprite) {
        const sprite = fruit as Phaser.GameObjects.Sprite;
        const foodId = sprite.texture.key;

        console.log(`[HANDLE COLLISION] Player ${playerId} collided with ${foodId}`);

        const isCorrect = foodId === this.currentTargetFoodId;
        console.log(`[SCORING] IsCorrect: ${isCorrect}, Target: ${this.currentTargetFoodId}`);

        // Sends the score update to the server
        if (this.sendMessage) {
          this.sendMessage({
            type: 'FRUIT_EATEN_BY_PLAYER',
            payload: {
              sessionId: this.sessionId,
              userId: playerId,
              isCorrect,
              allowPenalty: this.modeSettings.allowPenalty
            },
          });
        }

        // Let all clients know to remove the fruit visually
        EventBus.emit('fruit-eaten', { foodId, x: fruit.x, y: fruit.y });
      }
    }
  }

  public setFoodKeys(keys: string[]) {
    this.foodKeys = keys;
  }

  /**
 * Applies the specified mode settings to the game.
 *
 * @param {ModeSettings} settings - An object containing game mode configuration values.
 */
  public applyModeSettings(settings: ModeSettings) {
    console.log('[Game] Applying mode settings:', settings);
    this.modeSettings = settings;
  }

  public startSpawningFood() {

    if (!this.foodSpawnTimer) {
      this.foodSpawnTimer = this.time.addEvent({
        delay: 1500,
        callback: this.spawnFood,
        callbackScope: this,
        loop: true
      });
    }
  }
  
  spawnFood() {
    console.log("[Game Scene] spawnFood() triggered by timer.");

    if (this.foodKeys.length === 0) return;
    const randomLaneX = Phaser.Utils.Array.GetRandom(this.lanePositions);
    const randomKey = Phaser.Utils.Array.GetRandom(this.foodKeys);
    const food = this.foods.create(randomLaneX, 0, randomKey) as Phaser.Physics.Arcade.Image;
    console.log(`[SPAWN] ${randomKey} at lane X=${randomLaneX}`);

    food.setScale(0.25);
    food.setVelocityY(750);
    food.setBounce(0.2);
    food.setCollideWorldBounds(true);
  }

  public addFoodManually(foodId: string, angle: number) {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const speed = this.modeSettings.fruitSpeed;

    const food = this.foods.create(centerX, centerY, foodId) as Phaser.Physics.Arcade.Image;
    food.setScale(0.15);
    food.setBounce(0);
    food.setCollideWorldBounds(false);
    food.setDamping(false);
    food.setDrag(0);

    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    food.setVelocity(velocityX, velocityY);

    console.log(`[SYNC LAUNCH] ${foodId} @ angle ${angle.toFixed(2)}`);
  }

  public setTargetFood(foodId: string) {
    this.currentTargetFoodId = foodId;
  }

  public removeFruitAt(foodId: string, x: number, y: number) {
    const radius = 20;
    this.foods.children.each((child: any) => {
      if (child.texture.key === foodId && Phaser.Math.Distance.Between(child.x, child.y, x, y) < radius) {
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
}
