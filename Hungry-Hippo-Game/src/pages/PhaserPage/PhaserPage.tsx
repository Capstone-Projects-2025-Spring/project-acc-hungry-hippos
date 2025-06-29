import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { PhaserGame, IRefPhaserGame } from '../../PhaserGame';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { AacFood } from '../../Foods';

/**
 * PhaserPage component.
 *
 * Displays the Phaser game canvas and shows the currently selected food visually.
 * Listens to WebSocket messages to update the game scene with the latest selected food.
 *
 * @component
 * @returns {JSX.Element} The rendered Phaser game interface with current food indicator.
 */
const PhaserPage: React.FC = () => {
  /**
   * Extract sessionId and userId from the URL parameters.
   */
  const { sessionId, userId } = useParams<{ sessionId: string, userId: string }>();

  /**
   * Access the React Router location object to get passed state (including user role).
   */
  const location = useLocation();

  /**
   * Ref to the PhaserGame component instance, to call Phaser scene methods.
   */
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  /**
   * Holds the currently selected food object to display.
   */
  const [currentFood, setCurrentFood] = useState<AacFood | null>(null);

  /**
   * WebSocket context values: lastMessage received, sendMessage function, and a function to clear last message.
   */
  const { lastMessage, sendMessage, clearLastMessage } = useWebSocket();

  /**
   * Effect hook to send a "PLAYER_JOIN" message over WebSocket when component mounts,
   * informing the server about the player's session, userId, and role.
   *
   * Dependencies:
   * - sessionId, userId: URL parameters identifying player/session.
   * - location.state?.role: User role passed in navigation state.
   * - sendMessage: WebSocket send function.
   */
  useEffect(() => {
    const role = location.state?.role;
    if (sessionId && userId && role) {
      sendMessage({
        type: 'PLAYER_JOIN',
        payload: { sessionId, userId, role }
      });
    }
  }, [sessionId, userId, location.state?.role, sendMessage]);

  /**
   * Effect hook that listens for WebSocket messages of type 'FOOD_SELECTED_BROADCAST'.
   * When a food is selected by any player, update the local state and notify the Phaser scene to spawn and highlight the food.
   *
   * Dependencies:
   * - lastMessage: Incoming WebSocket message.
   * - clearLastMessage: Function to reset the lastMessage after processing.
   */
  useEffect(() => {
    if (lastMessage?.type === 'FOOD_SELECTED_BROADCAST') {
      const { food, angle } = lastMessage.payload;
      setCurrentFood(food);
      const scene = phaserRef.current?.scene as any;

      if (scene?.addFoodManually) scene.addFoodManually(food.id, angle);
      if (scene?.setTargetFood) scene.setTargetFood(food.id);

      clearLastMessage?.();
    }
  }, [lastMessage, clearLastMessage]);

  /**
   * Render the PhaserGame component and the current food indicator UI.
   */
  return (
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
  );
};

export default PhaserPage;
