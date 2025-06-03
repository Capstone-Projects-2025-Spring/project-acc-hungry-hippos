import styles from './ButtonClick.module.css';

// props component expects
interface ButtonClickProps {
  text: string; // Text to display inside the button
  onClick: () => void;
}

// reuseable button component
function ButtonClick({ text, onClick }: ButtonClickProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      {text}
    </button>
  );
}

export default ButtonClick;
