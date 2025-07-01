/**
 * PhaserGame.tsx
 * 
 * This component wraps the Phaser game instance within a React component.
 * It initializes the Phaser game on mount, handles cleanup, and passes the reference
 * to both the parent component and the scene once it becomes available.
*/

import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { AAC_DATA } from './Foods';
import { useWebSocket } from './contexts/WebSocketContext';

/**
 * Interface to expose the Phaser game and current scene instance to parent components via ref.
*/
export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

/**
 * Props for the PhaserGame component.
 * 
 * @property currentActiveScene - Callback to receive the active Phaser scene instance.
*/
interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void
}

/**
 * PhaserGame is a React component that instantiates the Phaser game engine,
 * and notifies the parent when the current scene becomes available.
 * 
 * It mounts the game in a container div and properly cleans up on unmount.
*/
export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);
    const { isConnected, lastMessage, sendMessage } = useWebSocket();

    /**
     * useLayoutEffect creates the Phaser.Game instance when the component mounts,
     * and ensures cleanup when the component unmounts.
    */
    useLayoutEffect(() =>
    {
        if (game.current === null)
        {

            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }

        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    /**
     * useEffect listens for the Phaser event `current-scene-ready`,
     * then injects AAC food keys into the scene and shares the scene reference via ref.
    */
    useEffect(() =>
    {
        EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) =>
        {
            const foodKeys = Object.values(AAC_DATA).flat().map(food => food.id);
            if ('setFoodKeys' in scene_instance && typeof scene_instance['setFoodKeys'] === 'function') {
                scene_instance['setFoodKeys'](foodKeys);
            }

            if('setSendMessage' in scene_instance && typeof scene_instance['setSendMessage'] === 'function') 
            {
                (scene_instance as any).setSendMessage(sendMessage);
            }
            
            if (currentActiveScene && typeof currentActiveScene === 'function')
            {

                currentActiveScene(scene_instance);

            }

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: scene_instance });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: scene_instance };
            }
            
        });
        return () =>
        {
            EventBus.removeListener('current-scene-ready');
        }
    }, [currentActiveScene, ref]);

    /**
     * Renders the HTML container that will hold the Phaser canvas.
    */
    return (
        <div id="game-container"></div>
    );

    useEffect(() => {
        if(lastMessage?.type === 'scoreUpdate')
        {
            EventBus.emit('external-score-update', lastMessage.scores);
        }
    }, [lastMessage]);
});
