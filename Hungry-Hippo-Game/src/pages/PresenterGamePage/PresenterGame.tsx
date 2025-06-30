import React from 'react';
import styles from './PresenterGame.module.css';
import ButtonClick from '../../components/ButtonClick/ButtonClick';

const PresenterGamePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <img
        src="/assets/Underwater.png"
        alt="Game placeholder"
        className={styles.image}
      />
    </div>
  );
};

export default PresenterGamePage;
