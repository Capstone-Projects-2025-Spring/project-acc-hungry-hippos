import React from "react";
import { AacFood, AAC_DATA } from "../Foods";
import { useWebSocket } from "../contexts/WebSocketContext";

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
  const [selectedFood, setSelectedFood] = React.useState<AacFood | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  
  const { sendMessage } = useWebSocket();

  /**
   * Handles the click event for a food item.
   * @param {AacFood} food - The food item that was clicked.
   * @precondition The food item must be part of the AAC_DATA.
   * @postcondition The selected food is set, and the audio for the food is played if available.
   * @returns {void}
   */
  const handleFoodClick = (food: AacFood) => {
    setSelectedFood(food);

    if (sessionId) {
      sendMessage({
        type: "AAC_FOOD_SELECTED",
        payload: {
          sessionId, userId, role, food
        }
      });
    }
    console.log("Sending AAC_FOOD_SELECTED", {
  sessionId,
  userId,
  role,
  food
});

    if (food.audioPath) {
      const audio = new Audio(food.audioPath);
      setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onerror = () => {
        console.error(`Error playing audio for ${food.name}`);
        setIsAudioPlaying(false);
      };
      audio.play()
    }
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
            onClick={() => setSelectedCategory(category.categoryName)}
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
          onClick={() => setSelectedCategory(null)}
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
        
        {/* Food items for the selected category */}
        {category.foods.map((food) => (
          <button
            key={food.id}
            onClick={() => handleFoodClick(food)}
            disabled={isAudioPlaying}
            className={`aac-food-button ${selectedFood && selectedFood.id === food.id ? 'aac-food-selected' : ''}`}
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
        <h1> AAC Device </h1>

        {/* Display the selected fruit */}
        <div className="aac-foods">
          {selectedFood ? (
            <p className="aac-selected-food"> You selected: {selectedFood.name} {selectedFood.imagePath && (
                <img
                  src={selectedFood.imagePath}
                  alt={selectedFood.name}
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