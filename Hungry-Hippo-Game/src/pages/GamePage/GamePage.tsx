import React, { useRef, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { IRefPhaserGame, PhaserGame } from '../../PhaserGame';
import AacInterface from '../../aac/AacInterface';
import { AacFood } from '../../Foods';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { EventBus } from '../../game/EventBus';

/**
 * 
 * @component GamePage
 * @description
 * This is a react functional component that serves as the main game interface page. It inlcudes 
 * Augmented and Alternatice Communication) interface for selecting food.
 * Phaser game canvas where the selected food is spawned and animated .
 * A food stack tracker to show the currently selected food
 * 
 *  Data Fields:
 * - phaserRef: React.MutableRefObject<IRefPhaserGame | null>
 *      Reference to the PhaserGame component, used to access the Phaser scene.
 * - foodStack: AacFood[]
 *      Stack of foods selected by the user from the AAC interface.
 *
 * Purpose:
 * - To provide the main gameplay page, integrating the AAC interface and Phaser game.
 * - To handle food selection and trigger food spawning in the game scene.
 *
 * Methods:
 * - handleSelectedFood(selectedFood: AacFood): void
 *      Handles selection of a food from the AAC interface, adds it to the stack,
 *      and spawns it in the Phaser game scene.
 *
 * - currentFood: AacFood | null
 *      Gets the current selected food (top of the stack).
 *
 * Pre-conditions:
 * - PhaserGame and AacInterface components must be properly implemented and imported.
 *
 * Post-conditions:
 * - The selected food is added to the stack and spawned in the Phaser game.
 *
 * @returns {JSX.Element} The rendered game page.

 */
const GamePage: React.FC = () => {
    const { sessionId, userId } = useParams<{ sessionId: string, userId: string }>();
    const location = useLocation();
    //  References to the PhaserGame component (game and scene are exposed)
    /**
     * * @description A React ref pointing to the PhaserGame component instance. 
     * Used to access its scene and methods like addFoodManually.
     */
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const [currentFood, setCurrentFood] = useState<AacFood | null>(null);
    const { lastMessage, sendMessage, clearLastMessage } = useWebSocket();

    // Entering the game lobby
    useEffect(() => {
        const role = location.state?.role;
        if (sessionId && userId && role) {
            sendMessage({
                type: 'PLAYER_JOIN',
                payload: { sessionId, userId, role }
            })
        }
    }, [sessionId, userId, location.state?.role, sendMessage]);

    // Listens for broadcasts from the server about food selection
    useEffect(() => {
        if (lastMessage?.type === 'FOOD_SELECTED_BROADCAST') {
            const { foods } = lastMessage.payload;
            const scene = phaserRef.current?.scene as any;

            if (Array.isArray(foods)) {
                foods.forEach(({ food, angle }: { food: AacFood, angle: number }) => {
                    if (scene && typeof scene.addFoodManually === 'function') {
                        scene.addFoodManually(food.id, angle);
                    }
                });
                
                if (foods.length > 0 && typeof scene.setTargetFood === 'function') {
                    scene.setTargetFood(foods[0].food.id);
                    setCurrentFood(foods[0].food);
                }
            }
            if (clearLastMessage) clearLastMessage();
        }

        if (lastMessage?.type === 'FRUIT_EATEN_BROADCAST') {
            const { foodId, x, y } = lastMessage.payload;
            const scene = phaserRef.current?.scene as any;

            if (scene && typeof scene.removeFruitAt === 'function') {
                scene.removeFruitAt(foodId, x, y);
            }
        }
    }, [lastMessage, clearLastMessage]);

    /**
     * Listens for fruit-eaten events emitted from the Phaser scene,
     * and sends a WebSocket message to the server with fruit info.
    */
    useEffect(() => {
        const handleFruitEaten = ({ foodId, x, y }: { foodId: string; x: number; y: number }) => {
            if (sessionId) {
                sendMessage({
                    type: 'FRUIT_EATEN',
                    payload: { sessionId, foodId, x, y }
                });
            }
        };

        EventBus.on('fruit-eaten', handleFruitEaten);

        return () => {
            EventBus.off('fruit-eaten', handleFruitEaten);
        };
    }, [sendMessage, sessionId]);


     /**
     * @returns {JSX.Element}
     * @description Renders the AAC interface, Phaser game container, and food status display.
     */

    return (
        <div id="app">
            {sessionId ? <AacInterface sessionId={sessionId} /> : null}
            <div className="game-container">
                <PhaserGame ref={phaserRef} />
                
                <div className="current-food-indicator">
                    <h3>Current Food to Eat:</h3>
                    {currentFood ? (
                        <>
                            <img
                                src={currentFood.imagePath}
                                alt={currentFood.name}
                                className="current-food-image"
                            />
                            <p className="current-food-name">{currentFood.name}</p>
                        </>
                    ) : (
                        <p className="current-food-placeholder">No Food Selected</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GamePage;
