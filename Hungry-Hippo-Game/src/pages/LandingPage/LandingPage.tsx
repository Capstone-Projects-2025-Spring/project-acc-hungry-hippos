import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';
import ButtonClick from '../../components/ButtonClick/ButtonClick';
import { useRef, useState } from 'react';

// handles navigation to GamePage
// TODO: add functionality to check if game code is valid
function LandingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isValidCode, setIsValidCode] = useState(true);

  // navigates to the game page
  const handleStart = () => {
    const gameCode = code.join('');
    
    // handle validation of game code
    // TODO: implement actual validation logic
    if (gameCode.length !== 5) {
      setIsValidCode(false);
      return; 
    }

    setIsValidCode(true);
    console.log('User entered game code:', gameCode);

    try {
      navigate('/GamePage');
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  // Handles input 
  const handleChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value.toUpperCase().slice(0, 1);
    setCode(newCode);

    if (value && index < 4) {
      inputsRef.current[index + 1]?.focus();//move to next box
    }
  };

  // Handles backspace to move to previous input box
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles.container}>
      <img
        src="/assets/hippoLogo.png"
        alt="Hungry Hippos Logo"
        className={styles.logo}
      />

      <h3 className={styles.enterText}>Enter game code: </h3>

      {/* Input for 5 character game code */}
      <div className={styles.codeInputGroup}>
        {code.map((char, i) => (
          <input
            key={i}
            ref={(el) => void (inputsRef.current[i] = el)}
            type="text"
            value={char}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            maxLength={1}
            className={`${styles.codeInputBox} ${!isValidCode ? styles.errorInputBox : ''}`}
          />
        ))}
      </div>

      <p className={styles.createGameText}>No code? Create new game! </p>

      <ButtonClick text="Join Game" onClick={handleStart} />
    </div>
  );
}

export default LandingPage;
