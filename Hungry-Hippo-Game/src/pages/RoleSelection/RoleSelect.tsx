import { useEffect, useState } from 'react';
import styles from './RoleSelect.module.css';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ButtonClick from '../../components/ButtonClick/ButtonClick';
import { useWebSocket } from '../../contexts/WebSocketContext';

/**
 * RoleSelect - React component for selecting a player's role in the game.
 *
 * <p>Purpose:
 * - Allows the user to choose between two roles: "Hippo Player" or "AAC User".
 * - Prevents navigation to the next game screen until a role is selected.
 * - Highlights the selection dropdown in red if the user attempts to proceed without selecting a role.
 * - Navigates to the game page with the session ID from the URL when valid input is provided.
 *
 * <p>Data Fields:
 * - role: string
 *   - The selected role by the user.
 *   - Empty by default until the user makes a choice.
 *
 * - error: boolean
 *   - True when no role is selected and the user attempts to proceed.
 *   - Used to trigger UI feedback like red border styling.
 *
 * - sessionId: string | undefined
 *   - Retrieved from the route parameters using `useParams()`.
 *   - Represents the unique session identifier needed for routing to the game page.
 *
 * <p>Methods:
 * - handleStart(): void
 *   - Purpose: Validates the role selection and navigates to the game page using the session ID.
 *   - Pre-condition: A role must be selected and sessionId must be defined.
 *   - Post-condition: Navigates to `/gamepage/{sessionId}` if role is valid.
 *   - Parameters: None
 *   - Return value: void
 *   - Exceptions: None explicitly thrown, but `sessionId` may be undefined.
 *     Recovery: Navigation is blocked until valid data is provided.
 *
 * - handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>): void
 *   - Purpose: Updates role state when the user changes their selection.
 *   - Pre-condition: User selects a value from the dropdown.
 *   - Post-condition: Updates internal `role` state; clears error if one was previously set.
 *   - Parameters:
 *     - e: React.ChangeEvent<HTMLSelectElement> — the DOM event triggered by changing the selection.
 *   - Return value: void
 *   - Exceptions: None
 *
 * <p>UI Behavior:
 * - If `role` is not selected, the dropdown will receive a red border and an alert will be shown.
 * - ButtonClick component triggers `handleStart` on click.
 */
function RoleSelect() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();

  const [role, setRole] = useState<string>(''); 
  const [error, setError] = useState<boolean>(false);
  const [username] = useState(location.state?.userId || ''); 
  const [waiting, setWaiting] = useState(false);
  const { gameStarted } = useWebSocket();
  const { sendMessage } = useWebSocket();

  // Navigate to the next page depending on the selected role.
  // and pass ALL player info in the state for the next page to use.
  // Effect to navigate when gameStarted becomes true
  useEffect(() => {
    if (!waiting) return; // Only navigate if waiting is true (after Next clicked)

    if (gameStarted) {
      console.log('[RoleSelect] Game started, navigating...');
      if (role === 'AAC User') {
        navigate(`/aac/${sessionId}/${username}/${role}`, {
          state: { userId: username, role },
        });
      } else if (role === 'Hippo Player') {
        navigate(`/hippo/${sessionId}/${username}/${role}`, {
          state: { userId: username, role },
        });
      }
    }
  }, [gameStarted, waiting, role, sessionId, username, navigate]);
/**
 * Handles the logic for starting the game after a role is selected.
 *
 * <p>This function validates that a role has been selected. It then sends a POST request
 * to the server to update the user's role for the current session. Upon a successful
 * update, the user is navigated to the appropriate game page based on their role.
 *
 * <p>If no role is selected, an error state is triggered and the function exits early.
 * If the server fails to update the role, an alert is shown to the user.
 *
 * @async
 * @function handleStart
 * @returns {Promise<void>} Resolves after role is updated and user is navigated to next page.
 */
    const handleStart = () => {
    if (!role) {
        setError(true);
        return;
    }
    setError(false);

    sendMessage({
        type: 'PLAYER_JOIN',
        payload: {
        sessionId,
        userId: username,
        role,
        },
    });

    setWaiting(true);


    };


  /**
   * Updates the role state as the user selects an option from the dropdown.
   * Clears error if previously triggered.
   *
   * @param e - The change event triggered by selecting a dropdown option.
   */
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
    if (error) setError(false);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className={styles.containerImg}>
      <div className={styles.roleContainer}>
        <button
          className={styles.closeButton}
          onClick={handleCancel}
          aria-label="Close"
        >
          ✖
        </button>

        {waiting ? (
          <h2 className={styles.sessionText2}>Waiting for game to start...</h2>
        ) : (
          <>
            <h2 className={styles.sessionText2}>You are: {username || '_____'} </h2>
            <div className={styles.roleSelectGroup}>
              <select
                id="role-select"
                value={role}
                onChange={handleRoleChange}
                className={`${styles.roleDropdown} ${error ? styles.errorBorder : ''}`}
              >
                <option value="" disabled>Select role</option>
                <option value="Hippo Player">Hippo Player</option>
                <option value="AAC User">AAC User</option>
              </select>
            </div>
            <ButtonClick text="Next" onClick={handleStart} />
          </>
        )}
      </div>
    </div>
  );
}

export default RoleSelect;
