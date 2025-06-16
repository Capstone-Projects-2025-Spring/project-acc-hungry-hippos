---
sidebar_position: 1
---
# Unit tests

[View Full Test Coverage Report](coverage/index.html)

Frontend testing is done via Vitest and React Testing Library. 

| Student | Library | Why We Chose It | Key Features | Modules Covered |
| --------| --------| ----------------| -------------| ----------------|
| Kostandin Jorgji | Vitest & React Testing Library | Vite integration, fast TypeScript support, RTL mirrors how users interact with the app | userEvent & render | AacInterface.tsx, Foods.ts
| Omais Khan | Vitest | Works out-of-the-box with Vite + TypeScript | vi.fn(), isolated test logic | Game.ts |
| Jasmine Liu | Vitest | Straightforward setup to run tests | Easily generate coverage reports with a command  | LandingPage.tsx & ButtonClick.tsx |
| Student |
| Student |

# Frontend

## AacInterface

### Handling Food Click
    * Input / User Action
        * Use taps a food button
    * Expected Result
        * `selectedFood` state updated to the tapped food
        * `onFoodSelected(food)` callback invoked 
        * `Audio.play()` called with the selected food.mp3

### Navigate to Foods Grid
    * Input / User Action
        * User taps a category button
    * Expected Result
        * `selectedCategory` state set to that fruit
        * Food grid for that category rendered

### Back to categories
    * Input / User Action
        * While viewing foods grid, user taps the back button
    * Expected Result
        * `selectedCategory` cleared
        * Categiry grid reappears

### Selected food indicator updates
    * Input / user Action
        * User taps a food
    * Expected Result
        * Indicator shows the selected food

## Game.ts

### Method: `setFoodKeys(keys: string[])`

* **Purpose:** Defines which food keys are allowed to be spawned.
* **Test Case:**
    - **Input:** `['apple', 'pizza']`
    - **Expected Result:** `foodKeys` field is updated with these values.

---

### Method: `addFoodManually(foodKey: string)`

* **Purpose:** Manually adds a food item to the game (e.g. from AAC).
* **Test Case:**
    - **Input:** `'apple'`
    - **Mocked:** `foods.create`, `setScale`, `setVelocityY`, `setBounce`, `setCollideWorldBounds`
    - **Expected Result:**
        - `foods.create()` called with a lane `x` and `'apple'`
        - All config methods called with correct values

---

### Method: `spawnFood()`

* **Purpose:** Automatically spawns food from a random key and lane.
* **Test Case:**
    - **Precondition:** `foodKeys = ['apple']`
    - **Mocked:** `Phaser.Utils.Array.GetRandom`, `foods.create`
    - **Expected Result:** `foods.create()` called with valid food key and lane

---

### Method: `handleFoodCollision(hippoObj, foodObj)`

* **Purpose:** Removes food when it overlaps with the hippo.
* **Test Case:**
    - **Input:** a food object with `.destroy()` mocked
    - **Expected Result:** `destroy()` called on food

---

### Method: `update()`

* **Purpose:** Removes any food object that touches the ground.
* **Test Case:**
    - **Input:** a group of food objects, some with `body.blocked.down = true`
    - **Expected Result:** Only those with `blocked.down = true` are destroyed

---

# LandingPage

### Join Game with Valid Code
- **Input / User Action**
  - User enters a valid 5-character code and taps "Join Game"
- **Expected Result**
  - `handleStart` sends POST request to `/validate-session`
  - If `valid: true`, user is navigated to `/GamePage`

---

### Join Game with Invalid Code
- **Input / User Action**
  - User enters an invalid or incomplete code and taps "Join Game"
- **Expected Result**
  - `isValidCode` is set to `false`
  - Input fields are cleared
  - Focus returns to the first input box

---

### Create New Game Session
- **Input / User Action**
  - User taps "No code? Create new game!"
- **Expected Result**
  - `handleCreateGame` sends POST request to `/create-session`
  - On success, user is navigated to `/GamePage`
  - On failure, an alert is shown and error is logged

---

### Input Autofocus on Typing
- **Input / User Action**
  - User types a character into a game code input field
- **Expected Result**
  - Character is uppercased and saved to `code[index]`
  - Next input field is focused automatically

---

### Input Navigation with Backspace
- **Input / User Action**
  - User presses Backspace in an empty input field
- **Expected Result**
  - Focus moves to the previous input field (if it exists)

---

### Paste Entire Code
- **Input / User Action**
  - User pastes a 5-character code into the first input field
- **Expected Result**
  - All input fields are populated from clipboard
  - Focus moves to the next empty or last field

---

### Error Styling Triggered on Invalid Code
- **Input / User Action**
  - User submits an invalid code
- **Expected Result**
  - `isValidCode` is set to `false`
  - All inputs show error styles using CSS class

---

# ButtonClick

### Render with Text
- **Input / User Action**
  - Component is rendered with a `text` prop
- **Expected Result**
  - A `<button>` is present in the DOM
  - The button displays the provided text content

---

### Click Event Handling
- **Input / User Action**
  - User clicks the rendered button
- **Expected Result**
  - `onClick` callback is invoked exactly once

---

### Styling Applied
- **Input / User Action**
  - Component is rendered
- **Expected Result**
  - The button has the `styles.button` class applied

---

# Backend

---

## Session API

### Generate New Session ID
- **Input / User Action**
  - Client sends `POST /create-session`
- **Expected Result**
  - Server responds with `{ sessionId: string }`
  - The new ID is unique (not already in session file)
  - Session file is updated with the new ID

---

### Validate Existing Session
- **Input / User Action**
  - Client sends `POST /validate-session` with a valid session code
- **Expected Result**
  - Server responds with `{ valid: true }`

---

### Reject Invalid Session Code
- **Input / User Action**
  - Client sends `POST /validate-session` with an invalid or non-existent code
- **Expected Result**
  - Server responds with `{ valid: false }`

---

### Handle Missing Game Code in Validation
- **Input / User Action**
  - Client sends `POST /validate-session` with missing or malformed body
- **Expected Result**
  - Server responds with `{ valid: false, error: 'Invalid game code format' }`
  - Status code is `400`

---

### Get All Sessions
- **Input / User Action**
  - Client sends `GET /sessions`
- **Expected Result**
  - Server responds with `{ sessions: string[] }`
  - Returns `[]` if file doesn't exist

---

### File Read Error Handling (GET /sessions)
- **Input / User Action**
  - File exists but is corrupted or unreadable
- **Expected Result**
  - Server responds with status `500`
  - Error is logged and message is `{ message: 'Failed to read session data' }`

---

### File Read Error Handling (POST /validate-session)
- **Input / User Action**
  - File is unreadable or JSON parsing fails
- **Expected Result**
  - Server responds with `{ valid: false }`
  - Status code is `500`

---

### Write Error Handling (POST /create-session)
- **Input / User Action**
  - Write operation fails (e.g. due to file permissions)
- **Expected Result**
  - Server responds with `{ error: 'Failed to save session ID' }`
  - Status code is `500`
