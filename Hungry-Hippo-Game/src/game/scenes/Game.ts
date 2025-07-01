/**
 * Game.ts
 * 
 * This Phaser scene controls the core gameplay. It handles food spawning, physics, 
 * hippo player interactions, and collision handling.
 * 
 * The scene listens for external configuration (food types) and responds by spawning 
 * sprites that interact with the hippo character.
*/
import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { AAC_DATA } from '../../Foods';
import { WalkStrategy } from '../moveStrategy/WalkStrategy';
import { Hippo } from '../Hippo';
import { Scoreboard } from './Scoreboard';

/**
 * The Game class defines a Phaser scene that initializes the hippo player,
 * handles spawning of food items, and manages collision detection.
*/

export class Game extends Scene {
    /**
     * The hippo sprite used for collisions and animations.
    */
    private hippo: Phaser.Physics.Arcade.Sprite;

     /**
     * Group of active food items currently in the game.
    */
    private foods: Phaser.Physics.Arcade.Group;

    /**
     * Array of allowed food keys that can be spawned.
    */
    private foodKeys: string[] = [];

    /**
     * Fixed horizontal positions for randomly spawning food.
    */
    private lanePositions = [256, 512, 768];

    /**
     * Constructor for the Game scene. Sets the scene key.
    */
    private foodSpawnTimer: Phaser.Time.TimerEvent;  // store timer reference

    private players: Record<string, Phaser.Physics.Arcade.Sprite> = {};

    private playerScoreLabels: Record<string, Phaser.GameObjects.Text> = {};

    private playerScores: Record<string, number> = {};

    private currentTargetFoodId: string | null = null;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    private scoreboardContainer: Phaser.GameObjects.Container;

    private scoreboardTexts: Phaser.GameObjects.Text[] = [];
    
    private scoreboard: Scoreboard;

    private sendMessageToServer?: (message: object) => void;

    /**
     * Constructor for the Game scene. Sets the scene key. 
    */

    constructor() 
    {
        super('Game');
    }

    preload() 
    {
        this.load.image('background', '/assets/Underwater.png');

        // Dynamically load food images from AAC data
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
            frameHeight: 425,
        });
    }

    /**
     * Initializes game objects, such as the hippo, background, and food group.
     * Also sets up the physics collider between hippo and food.
    */
    create() {
        this.add.image(512, 384, 'background');

        this.hippo = new Hippo(this, 350, 425, 'character', new WalkStrategy());
        this.hippo.setScale(0.3);

        this.cursors = this.input!.keyboard!.createCursorKeys();
        
        EventBus.emit('current-scene-ready', this);

        this.foods = this.physics.add.group();

        this.scoreboard = new Scoreboard(this);
        this.scoreboard.addPlayer('host');
        this.playerScores["host"] = 0;

        this.physics.add.overlap(this.hippo, this.foods, this.handleFoodCollision, undefined);

        const padding = 20;
        this.scoreboardContainer = this.add.container(this.scale.width - padding, padding);
        this.scoreboardContainer.setScrollFactor(0);
        this.updateScoreboard();

        EventBus.on('external-score-update', (scores: Record<string, number>) => {
            for(const [playerId, score] of Object.entries(scores)) {
                this.scoreboard.setScore(playerId, score);
            }
        });
    }

    private handleFoodCollision = (
        hippoObj: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
        foodObj: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
    ) => {
        const food = foodObj as Phaser.GameObjects.Sprite;
        if (food && food.texture) {
            food.destroy();
            this.handleFruitCollision('host', food);
        }
    };

    public setFoodKeys(keys: string[]) {
        this.foodKeys = keys;
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

    public addFoodManually(foodKey: string, angle: number) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const food = this.foods.create(centerX, centerY, foodKey) as Phaser.Physics.Arcade.Image;
        food.setScale(0.15);

        const speed = 300;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        const degrees = Phaser.Math.RadToDeg(angle);
        const direction =
            degrees >= 45 && degrees < 135 ? 'down' :
            degrees >= 135 && degrees < 225 ? 'left' :
            degrees >= 225 && degrees < 315 ? 'up' : 'right';
        console.log(`[SPAWN] ${foodKey} launched ${direction} (${degrees.toFixed(0)}°)`);

        food.setVelocity(velocityX, velocityY);
        food.setBounce(1, 1);
        food.setCollideWorldBounds(true);
        food.setDamping(false);
        food.setDrag(0);
    }

    public setTargetFood(foodId: string) {
        this.currentTargetFoodId = foodId;
        console.log(`[TARGET] Current target food set to: ${foodId}`);
    }

    update() {
        if (this.hippo && this.cursors) this.hippo.update(this.cursors);
        for (const playerId in this.players) {
            const player = this.players[playerId];
            const label = this.playerScoreLabels[playerId];
            if (player && label) {
                label.setPosition(player.x, player.y - 70);
                label.setText(String(this.scoreboard.getScore(playerId)));
            }
        }
    }

    addPlayer(playerId: string, x: number, y: number) {
        this.scoreboard.addPlayer(playerId);
        this.playerScores[playerId] = 0;
        if (!(playerId in this.players)) {
            const playerSprite = this.physics.add.sprite(x, y, 'character', 0);
            playerSprite.setCollideWorldBounds(true);
            playerSprite.setImmovable(true);
            playerSprite.play('walking');
            this.players[playerId] = playerSprite;

            this.physics.add.overlap(playerSprite, this.foods, (_hippo, fruit) => {
                let fruitGO: Phaser.GameObjects.GameObject | null = null;
                if (fruit instanceof Phaser.GameObjects.GameObject) {
                    fruitGO = fruit;
                } else if ('gameObject' in fruit) {
                    fruitGO = (fruit as any).gameObject;
                }
                if (fruitGO) {
                    this.handleFruitCollision(playerId, fruitGO);
                }
            }, undefined, this);

            const scoreLabel = this.add.text(x, y - 50, '0', {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: { x: 6, y: 3 },
                align: 'center'
            });
            scoreLabel.setOrigin(0.5);
            this.playerScoreLabels[playerId] = scoreLabel;
        }
    }

    private handleFruitCollision = (
        playerId: string,
        fruit: Phaser.GameObjects.GameObject
    ) => {
        fruit.destroy();

        if ('texture' in fruit && fruit instanceof Phaser.GameObjects.Sprite) {
            const foodId = fruit.texture.key;
            const isCorrect = foodId === this.currentTargetFoodId;

            if (isCorrect) {
                this.playerScores[playerId] += 1;
                console.log(`[POINT] ${playerId} ate correct food: ${foodId}`);
            } else {
                this.playerScores[playerId] = Math.max(0, this.playerScores[playerId] - 1);
                console.log(`[PENALTY] ${playerId} ate wrong food: ${foodId}`);
            }

            this.updateScoreboard();

            EventBus.emit('scoreUpdate', {
                scores: { ...this.playerScores }
            });

            if (this.sendMessageToServer) {
                this.sendMessageToServer({
                    type: 'scoreUpdate',
                    playerId,
                    scores: { ...this.playerScores }
                });
            }

            EventBus.emit('fruit-eaten', {
                foodId,
                x: fruit.x,
                y: fruit.y
            });
        }
    };

    private updateScoreboard() {
        this.scoreboardTexts.forEach(text => text.destroy());
        this.scoreboardTexts = [];

        const lineHeight = 28;
        let offsetY = 0;

        for (const [playerId, score] of Object.entries(this.playerScores)) {
            const scoreText = this.add.text(0, offsetY, `${playerId}: ${score}`, {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'right',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: { x: 10, y: 5 }
            });
            scoreText.setOrigin(1, 0);
            this.scoreboardContainer.add(scoreText);
            this.scoreboardTexts.push(scoreText);
            offsetY += lineHeight;
        }
    }

    public setSendMessage(sendFn: (message: object) => void) {
        this.sendMessageToServer = sendFn;
    }

    /**
     * Removes a fruit from the scene if it's close enough to the given position.
     * Used to sync fruit destruction across clients when a player eats one.
    */
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
}

