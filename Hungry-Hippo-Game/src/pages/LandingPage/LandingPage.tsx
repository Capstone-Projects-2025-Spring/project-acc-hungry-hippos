import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';
import ButtonClick from '../../components/ButtonClick/ButtonClick';

// handles navigation to GamePage
function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    try {
      navigate('/GamePage');
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Hungry Hippos</h1>
      <ButtonClick text="Start" onClick={handleStart} />
    </div>
  );
}

export default LandingPage;
