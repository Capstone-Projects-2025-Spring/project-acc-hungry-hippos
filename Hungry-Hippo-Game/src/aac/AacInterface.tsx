import React from "react";
import { Fruit, AAC_ITEMS } from "../Fruits";

// Callback function to handle fruit selection
interface AacInterfaceProps {
  onFruitSelected: (fruit: Fruit) => void;
}

const AacInterface: React.FC<AacInterfaceProps> = ({ onFruitSelected }) => {
  // State to keep track of the selected fruit
  const [selectedFruit, setSelectedFruit] = React.useState<Fruit | null>(null);

  const handleFruitClick = (fruit: Fruit) => {
    // Update the selected fruit when an AAC item is clicked
    // Send the selected fruit to the parent component via the onFruitSelected callback
    setSelectedFruit(fruit);
    onFruitSelected(fruit);

    // Play the audio for the selected fruit
    if (fruit.audioPath) {
      const audio = new Audio(fruit.audioPath);
      audio.play()
    }
  };

  return (
    <div className="aac-container">
      <div className="aac-device">
        <h1> AAC Device </h1>

        {/* Display the selected fruit */}
        <div className="aac-fruits">
          {selectedFruit ? (
            <p className="aac-selected-fruit"> You selected: {selectedFruit.name} {selectedFruit.imagePath && (
                <img
                  src={selectedFruit.imagePath}
                  alt={selectedFruit.name}
                  className="aac-selected-fruit-image-display"
                />
              )}
            </p>
          ) : (
            <p className="aac-instruction">Click on a fruit to select it</p>
          )}
        </div>

        {/* Display the AAC items in a grid */}
        <div className="aac-grid">
          {AAC_ITEMS.map((fruit) => (
            <button
              key={fruit.id}
              onClick={() => handleFruitClick(fruit)}
              className={`aac-button ${selectedFruit && selectedFruit.id === fruit.id ? 'aac-selected' : ''}`}
            >
              <img
                src={fruit.imagePath}
                alt={fruit.name}
                className="aac-fruit-image" />
              {fruit.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AacInterface;