import React, { useEffect } from "react";
import { AacFood, AAC_DATA, AacVerb, AAC_VERBS } from "../Foods";
import { useWebSocket } from "../contexts/WebSocketContext";
import { updatePlayerInSessionStorage } from "../components/Storage/Storage";

/**
 * Defines the props for the AacInterface component.
 */
interface AacInterfaceProps {
  sessionId: string;
  userId?: string;
  role?: string;
}

/**
 * AacInterface component provides an interface for users to select foods and play associated audio clips.
 * @param {AacInterfaceProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered component.
 */
  const AacInterface: React.FC<AacInterfaceProps> = ({ sessionId,  userId, role  }) => {
  const [selectedItem, setSelectedItem] = React.useState<AacFood | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [activeVerb, setActiveVerb] = React.useState<AacVerb | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const { sendMessage, gameMode  } = useWebSocket();

  useEffect(() => {
    if (sessionId && userId && role && sendMessage) {
      sendMessage({
        type: 'PLAYER_JOIN',
        payload: { sessionId, userId, role }
      });
      updatePlayerInSessionStorage(sessionId, { userId, role });
    }
  }, [sessionId, userId, role, sendMessage]);
  

  /**
   * Plays the audio for the selected item.
   * @param {string | undefined} audioPath - The path to the audio file.
   * @returns {void}
   */
  const playAudioWithDelay = (audioPath: string | undefined) => {
    if (audioPath) {
      const audio = new Audio(audioPath);
      setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onerror = () => {
        console.error(`Error playing audio for ${selectedItem?.name}`);
        setIsAudioPlaying(false);
      };
      audio.play()
    }
  };

  const playAudioWithoutDelay = (audioPath: string | undefined) => {
    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.onerror = () => {
        console.error(`Error playing navigation audio for ${selectedCategory}`);
      };
      audio.play();
    }
  };

  /**
   * Handles the click event for a food item.
   * @param {AacFood} food - The food item that was clicked.
   * @precondition The food item must be part of the AAC_DATA.
   * @postcondition The selected food is set, and the audio for the food is played if available.
   * @returns {void}
   */
  const handleFoodClick = (food: AacFood) => {
    setSelectedItem(food);

    // If a verb is active, send the verb and food selection
    if (sessionId) {
      sendMessage({
        type: "AAC_FOOD_SELECTED",
        payload: {
          sessionId,
          userId,
          role,
          food,
          effect: activeVerb ? activeVerb : null
        }
      });
    }
    setActiveVerb(null);
    playAudioWithDelay(food.audioPath);
    
  };

  /**
   * Handles the click event for a category.
   * @param {typeof AAC_DATA.categories[0]} category - The category that was clicked.
   * @precondition The category must be part of the AAC_DATA.
   * @postcondition The selected category is set, and the audio for the category is played if available.
   * @returns {void}
   */
  const handleCategoryClick = (category: typeof AAC_DATA.categories[0]) => {
    setSelectedCategory(category.categoryName);
    playAudioWithoutDelay(category.categoryAudioPath);
  };

  /**
   * Handles the click event for the back button.
   * @precondition The user must be in a category view.
   * @postcondition The selected category is reset to null, and the back navigation audio is played.
   * @returns {void}
   */
  const handleBackClick = () => {
    setSelectedCategory(null);
    playAudioWithoutDelay("/audio/back.mp3");
  };

  /**
   * Handles the click event for a verb button.
   * @param {AacVerb} verb - The verb that was clicked.
   * @precondition The verb must be part of the AAC_VERBS.
   * @postcondition The selected verb is set, and the audio for the verb is played if available.
   * @returns {void}
   */
  const handleVerbClick = (verb: AacVerb) => {
    setSelectedItem(verb);
    playAudioWithoutDelay(verb.audioPath);
    setActiveVerb(prev => {
      // If the same verb is clicked, do nothing, otherwise replace
      if (prev?.id === verb.id) return prev;

      return verb;
    })
  };

  /**
   * Renders the category view with buttons for each food category.
   * @returns {JSX.Element} The rendered category view.
   */
  const renderCategoryView = () => {
    return (
      <div className="aac-grid aac-grid-categories">
        {AAC_DATA.categories.map((category) => (
          <button
            key={category.categoryName}
            onClick={() => handleCategoryClick(category)}
            disabled={isAudioPlaying}
            className={"aac-food-button aac-category-button"}
          >
            <img
              src={category.categoryIcon}
              alt={category.categoryName}
              className="aac-food-image aac-category-icon"
            />
            {category.categoryName}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Renders the foods view for the selected category.
   * @returns {JSX.Element | null} The rendered foods view or null if no category is selected.
   */
  const renderFoodsView = () => {
    const category = AAC_DATA.categories.find(cat => cat.categoryName === selectedCategory);
    if (!category) return null;
    return (
      <div className="aac-grid aac-grid-foods">
        {/* Back Button */}
        <button
          onClick={() => handleBackClick()}
          disabled={isAudioPlaying}
          className="aac-food-button aac-back-button"
        >
          <img
            src="/assets/categories/back.png"
            alt="Back"
            className="aac-food-image aac-back-icon"
          />
          Back
        </button>

        {/* Verb Buttons (hidden in Easy mode) */}
        {gameMode !== 'Easy' && AAC_VERBS.map((verb) => (
          <button
            key={verb.name}
            onClick={() => handleVerbClick(verb)}
            disabled={isAudioPlaying}
            className='aac-food-button'
            style={{ backgroundColor: verb.color || '#0ea5e9' }}
          >
            <img
              src={verb.imagePath}
              alt={verb.name}
              className="aac-food-image" />
            {verb.name}
          </button>
        ))}
        
        {/* Food items for the selected category */}
        {category.foods.map((food) => (
          <button
            key={food.id}
            onClick={() => handleFoodClick(food)}
            disabled={isAudioPlaying}
            className={`aac-food-button ${selectedItem && selectedItem.id === food.id ? 'aac-food-selected' : ''}`}
          >
            <img
              src={food.imagePath}
              alt={food.name}
              className="aac-food-image" />
            {food.name}
          </button>
        ))}
      </div>
    );
  };
        

  /**
   * Renders the main AAC interface, including the selected food and category views.
   * @returns {JSX.Element} The rendered AAC interface.
   */
  return (
    <div className="aac-container">
      <div className="aac-device">

        {/* Display the selected fruit */}
        <div className="aac-foods">
          {selectedItem ? (
            <p className="aac-selected-food"> You selected: {selectedItem.name} {selectedItem.imagePath && (
                <img
                  src={selectedItem.imagePath}
                  alt={selectedItem.name}
                  className="aac-selected-food-image-display"
                />
              )}
            </p>
          ) : (
            <p className="aac-instruction">Click a food to select it</p>
          )}
        </div>
        {selectedCategory === null ? renderCategoryView() : renderFoodsView()}
      </div>
    </div>
  );
};

export default AacInterface;