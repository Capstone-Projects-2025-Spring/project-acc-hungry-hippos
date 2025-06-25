
// Import Phaser and EventBus
import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class Scoreboard
{
    // Private variables to track scoreboard
    private scene : Phaser.Scene;
    private playerScores : Record<string, number> = {};
    private scoreText: Phaser.GameObjects.Text;
    
    constructor(scene: Phaser.Scene, x = 32, y = 32)
    {
        this.scene = scene;

        this.scoreText = this.scene.add.text(x, y, '', 
            {
                fontSize: '24px',
                color: '#000',
                fontFamily: 'Arial',
                align: 'left',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: { x: 10, y: 10}
            }
        );

        this.updateScoreText();
    }

    // Method to initialize the score for a player
    public addPlayer(playerId: string)
    {
        if(!(playerId in this.playerScores))
        {
            this.playerScores[playerId] = 0;
            this.updateScoreText();
        }
    }

    // Method to increment the player's score
    public incrementScore(playerId: string, amount: number = 1)
    {
        if(!(playerId in this.playerScores))
        {
            this.playerScores[playerId] = 0;
        }
        this.playerScores[playerId] += amount;
        this.updateScoreText();
        EventBus.emit('scoreUpdate', {scores: {...this.playerScores}})
    } 

    // Method to update the on-screen text for score
    private updateScoreText()
    {
        const lines = Object.entries(this.playerScores)
            .map(([player, score]) => `${player}: ${score}`)
            .join('\n');
        this.scoreText.setText(lines);
    }

    // Method to set score on screen
    public setScore(playerId: string, newScore: number)
    {
        this.playerScores[playerId] = newScore;
        this.updateScoreText();
    }
}