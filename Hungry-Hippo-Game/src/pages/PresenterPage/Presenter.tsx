import styles from './Presenter.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebSocket } from '../../contexts/WebSocketContext';
import UserList from '../../components/UserList/UserList';
import { useEffect } from 'react';
import ButtonClick from '../../components/ButtonClick/ButtonClick';

/**
 * Presenter - React component that displays the session ID to the host after creating a new game.
 *
 * Purpose:
 * - Allows the host to view the game session code.
 * - Provides instructions to share the session code with other players.
 * - Includes a button to cancel the new game and return to the landing page.
 * - Shows a waiting lobby with connected users and their roles.
 *
 */
function Presenter() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const presenterId = 'presenter'; 
  const { sendMessage, connectedUsers, isConnected } = useWebSocket();
  // Join session as "Presenter" to receive updates
  useEffect(() => {
    if (sessionId && isConnected) {
      sendMessage({
        type: 'PLAYER_JOIN',
        payload: { sessionId, userId: presenterId, role: 'Presenter' }
      });
    }
  }, [sessionId, isConnected, sendMessage]);


  /**
   * Handler for clicking the close button.
   * Navigates the user back to the landing page.
   */
  const handleCancel = () => {
    navigate('/');
  };

  // Count roles connected excluding presenter
  const hippoCount = connectedUsers.filter(u => u.role === 'Hippo Player').length;
  const aacCount = connectedUsers.filter(u => u.role === 'AAC User').length;

  // Function to handle start game 
  const handleStartGame = () => {
    console.log('Start Game button clicked, sending START_GAME message');
    if (!sessionId) {
      console.error('No sessionId available');
      return;
    }
    sendMessage({
      type: 'START_GAME',
      payload: { sessionId },
    });
    navigate(`/presenter-game/${sessionId}`);
  };

  return (
    <div className={styles.containerImg}>
      {/* <div className={styles.bannerWrapper}>
        <img
          src="/assets/banner.png"
          alt="Game Banner"
          className={styles.bannerImage}
        />
      </div> */}

      <div className={styles.roleContainer}>
        <button
          className={styles.closeButton}
          onClick={handleCancel}
          aria-label="Cancel New Game"
        >
          ✖
        </button>

        <h1 className={styles.sessionText2}>Game Code: {sessionId}</h1>
        <h3 className={styles.sessionText2}>
          At least one Hippo & AAC device 
          <br />
          must join to start the game.
        </h3>
        <h2 className={styles.sessionText2}>Players Joined:</h2>
        <UserList users={connectedUsers.filter(u => u.role !== 'Presenter')} />
        <br />

        {hippoCount >= 1 && aacCount >= 1 && (
          <ButtonClick text="Start Game" onClick={handleStartGame} />
        )}
      </div>
    </div>
  );
}

export default Presenter;