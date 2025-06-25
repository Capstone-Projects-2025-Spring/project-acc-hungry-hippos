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

export class Game extends Scene
{
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
    private lanePositions = [256, 512, 768]; // tweak as needed

    /**
     * Constructor for the Game scene. Sets the scene key.
    */
    private foodSpawnTimer: Phaser.Time.TimerEvent; // store timer reference

    /**
     * Constructor for tracking each player.
     */
    private players: Record<string, Phaser.Physics.Arcade.Sprite> = {};


    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    /**
     * Constructor for creating the scoreboard.
     */
    private scoreboard: Scoreboard;

    /**
     * Constructor for the Game scene. Sets the scene key.
    */
    constructor ()
    {
        super('Game');
    }

    /**
     * Preloads game assets including sprites and food images from AAC data.
    */
    preload ()
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

        this.load.spritesheet('character', '/assets/spritesheet.png',{
            frameWidth: 350,
            frameHeight: 425,
        });

    }

    /**
     * Callback that runs when food collides with the hippo.
     * Removes the food from the scene.
     * 
     * @param hippoObj - The hippo game object.
     * @param foodObj - The food game object that collided with the hippo.
    */
    private handleFoodCollision(
        hippoObj: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
        foodObj: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
    ) 
    {
        // Extract the actual GameObjects from bodies or tiles
        const getGameObject = (obj: any): Phaser.GameObjects.GameObject | null => {
            if (obj instanceof Phaser.Tilemaps.Tile) {
                // Tiles don't have a gameObject, so just return null or handle accordingly
                return null;
            }
            if ('gameObject' in obj) {
                return obj.gameObject;
            }
            return obj;
        };

        const foodGO = getGameObject(foodObj);
        if (!foodGO) {
            // Could be a tile, skip collision
            return;
        }

        if (foodGO instanceof Phaser.GameObjects.Sprite || foodGO instanceof Phaser.Physics.Arcade.Image) {
            console.log(`[EAT] ${foodGO.texture.key} eaten by hippo`);
            foodGO.destroy();

            this.scoreboard.incrementScore("host");
        }
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

        // Initialize scoreboard and add host player
        this.scoreboard = new Scoreboard(this);
        this.scoreboard.addPlayer('host');

        this.physics.add.overlap(this.hippo, this.foods, this.handleFoodCollision, undefined);
        
        // Create WebSocket connection for receiving score updates
        const socket = new WebSocket('ws://localhost:8080');

        socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if(data.type === 'scoreUpdate')
            {
                const scores = data.scores;
                for(const [playerId, score] of Object.entries(scores))
                {
                    this.scoreboard.setScore(playerId, score as number);
                }
            }
        })
    }
    

    /**
     * Sets which food keys can be used to spawn food during gameplay.
     * 
     * @param keys - List of food IDs (e.g. 'apple', 'pizza') to enable in spawn logic.
    */
    public setFoodKeys(keys: string[]) {
        this.foodKeys = keys;
    }

    /**
     * Starts a repeating timer to spawn food items every 1500ms.
    */
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

    /**
     * Randomly selects a food from available keys and adds it to a lane position.
     * Called periodically by the food spawn timer.
    */
    spawnFood() {
        if (this.foodKeys.length === 0) return;

        // Random lane position
        const randomLaneX = Phaser.Utils.Array.GetRandom(this.lanePositions);

        // Random food type
        const randomKey = Phaser.Utils.Array.GetRandom(this.foodKeys);

        // Food spawned from top
        const food = this.foods.create(randomLaneX, 0, randomKey) as Phaser.Physics.Arcade.Image;
        console.log(`[SPAWN] ${randomKey} at lane X=${randomLaneX}`);

        food.setScale(0.25); // Food 25% of original size

        // Gravity
        food.setVelocityY(750); // Will move 750 pixels/sec down
        food.setBounce(0.2); // Slight bounce at bottom but used to trigger falling
        food.setCollideWorldBounds(true);
    }

    /**
     * Adds a specific food item to the game manually, typically triggered by AAC input.
     * Spawns the food at a random lane and applies gravity so it falls.
     * 
     * @param foodKey - The identifier of the food (e.g. 'apple', 'fries') to spawn.
    */
    public addFoodManually(foodKey: string) {
        const x = Phaser.Math.Between(64, this.scale.width - 64);
        const food = this.foods.create(x, 0, foodKey) as Phaser.Physics.Arcade.Image;
        console.log(`[SPAWN-MANUAL] ${foodKey} at X=${x}`);

        food.setScale(0.25);
        food.setVelocityY(600);
        food.setBounce(0.2);
        food.setCollideWorldBounds(true);
    }
    
    /**
     * Phaser’s built-in update loop, called on every frame.
     * Handles per-frame logic, such as checking food positions to remove offscreen items.
    */
    update() {
        this.foods.getChildren().forEach((food) => {
            const sprite = food as Phaser.Physics.Arcade.Image;
            if (sprite.body && sprite.body.blocked.down) {
                sprite.destroy(); // Immediately remove food after touching bottom
                console.log(`[EAT] ${sprite.texture.key} removed after hitting ground`);
            }
        });

        if (this.hippo && this.cursors) {
            this.hippo.update(this.cursors);
        }
    }

    addPlayer(playerId: string, x: number, y: number)
    {
        this.scoreboard.addPlayer(playerId);
        if(!(playerId in this.players))
        {
            const playerSprite = this.physics.add.sprite(x, y, 'character', 0);
            playerSprite.setCollideWorldBounds(true);
            playerSprite.setImmovable(true);
            playerSprite.play('walking');
            this.players[playerId] = playerSprite;

            this.physics.add.overlap(playerSprite, this.foods, (hippo, fruit) => {
                let fruitGO: Phaser.GameObjects.GameObject | null = null;

                if(fruit instanceof Phaser.Tilemaps.Tile)
                {
                    return;
                }
                else if('gameObject' in fruit && fruit.gameObject instanceof Phaser.GameObjects.GameObject)
                {
                    fruitGO = fruit.gameObject;
                }
                else if(fruit instanceof Phaser.GameObjects.GameObject)
                {
                    fruitGO = fruit;
                }
                if(fruitGO)
                {
                    this.handleFruitCollision(playerId, fruitGO);
                }
            }, undefined, this)
        }
    }

    private handleFruitCollision = (
        playerId: string,
        fruit: Phaser.GameObjects.GameObject
    ) => {
        fruit.destroy();
        this.scoreboard.incrementScore(playerId);
    };
}
