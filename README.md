[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=19552926)
<div align="center">

# The Hungry Hippos Project
[![Report Issue on Jira](https://img.shields.io/badge/Report%20Issues-Jira-0052CC?style=flat&logo=jira-software)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/DT/issues)
[![Deploy Docs](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml/badge.svg)](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml)
[![Documentation Website Link](https://img.shields.io/badge/-Documentation%20Website-brightgreen)](https://applebaumian.github.io/tu-cis-4398-docs-template/)


</div>

## Table of Contents
### 1. [Keywords](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#keywords)
### 2. [Project Abstract](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#project-abstract)
### 3. [How to Run Locally](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#how-to-run-locally)
### 4. [High Level Requirement](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#high-level-requirement)
### 5. [Conceptual Design](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#conceptual-design)
### 6. [Background](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#background)
### 7. [Required Resources](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#required-resources)
### 8. [Collaborators](https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos#collaborators)

## Keywords
Section #701
JavaScript · TypeScript · React · Phaser · Web Game · Accessibility · AAC · Multiplayer · Physics-based · Educational Technology

## Project Abstract

This project proposes the development of a **web-based multiplayer game** inspired by the classic *Hungry Hungry Hippos*, reimagined for accessibility and digital interactivity. The game is accessible via modern web browsers and integrates **Augmentative and Alternative Communication (AAC)** interfaces, ensuring that individuals with speech or motor impairments can participate meaningfully.

Players are divided into two roles:

- **AAC Game Conductor** – selects fruits, launches traps, and directs the flow of the game using an AAC-compatible interface.
- **Hippo Players** – up to four players control cartoon hippos stationed at screen edges, sliding along their borders to "catch" fruits using movement keys or touch input.

Fruits and traps bounce around the arena with physics-based behavior, creating an exciting and dynamic environment. The goal is to collect as many correct fruits as possible while avoiding traps. This game emphasizes **inclusivity, real-time decision-making**, and **competitive play** in a fun, accessible format.

## How to Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/Capstone-Projects-2025-Spring/project-acc-hungry-hippos
cd project-acc-hungry-hippos/Hungry-hippo-game
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the backend API server (WebSocket)
```bash
npm run api
```

### 4. Run the frontend (open three terminals and run this in each)
```bash
npm run dev
```

## High Level Requirement

### Functional Requirements (User-Facing)

#### AAC Game Conductor
- Selects target fruits (e.g., “Apples only”).
- Launches fruits and traps from the screen center.
- Assigns initial launch direction for traps.
- Resets and starts new rounds.
- Views real-time score updates.
- Receives visual and auditory feedback on all actions.

#### Hippo Players (Up to 4)
- Each hippo is assigned to a unique screen edge (top, bottom, left, right).
- Players can slide left/right or up/down along their edge.
- Catch fruits with default open mouths.
- Can close mouths to avoid incorrect fruits or traps.
- Deflects fruits/traps with physics if not "eaten."
- Game ends after time or round limit.


## 🧠 Conceptual Design

### Architecture

- **Frontend**: React (for UI), Phaser (for game logic/physics), TypeScript.
- **Game Engine**: Phaser 3 – responsible for rendering, physics, collisions.
- **Accessibility Layer**: AAC input mapped to game control events.
- **Responsive Design**: Tailwind CSS + flex/grid for adaptive layout.
- **Deployment**: Vercel or GitHub Pages for quick public access.

### Technologies
| Layer        | Stack                             |
|--------------|-----------------------------------|
| UI Framework | React + TypeScript + Tailwind CSS |
| Game Engine  | Phaser 3                          |
| Input Layer  | AAC Interface, Keyboard, Touch    |
| Platform     | Web (Cross-platform, no install)  |

### Operating Systems
- All modern OSes supported (Windows, macOS, iOS, Android, Linux) through browser compatibility.

---
## Background

Many existing web games are designed primarily for able-bodied users, leaving out players who rely on AAC devices. This project was inspired by the desire to **merge play, inclusivity, and technology**, ensuring children and individuals with communication challenges can participate in social, fast-paced gameplay.

The original *Hungry Hungry Hippos* was a turn-based, tactile game, but modernizing it with bouncing physics, interactive traps, and digital control unlocks a new level of engagement. Integrating accessible design principles and playful interaction can foster **joyful shared experiences**, especially in educational or therapeutic settings.

## Required Resources

To successfully develop this project, the following technical competencies and background knowledge are required:

- **Web Development**
  - React.js for building the game interface and AAC control panel.
  - TypeScript or JavaScript for front-end logic and component structure.
- **Game Development**
  - Understanding of **Phaser 3** for 2D game mechanics, physics, and object interaction (e.g., bouncing, collision detection).
- **AAC Design Principles**
  - Basic knowledge of **Augmentative and Alternative Communication (AAC)** systems and best practices for accessibility.
- **UI/UX for Accessibility**
  - High-contrast design
  - Visual and auditory feedback cues
  - Screen-reader and touch input considerations
- **Real-Time Communication (optional)**
  - WebSocket or similar methods for multiplayer or remote setups (advanced/optional).
 
### 💻 Software Resources

| Resource            | Purpose                                        | Notes                      |
|---------------------|------------------------------------------------|----------------------------|
| **Node.js**         | Environment to run and build the web app       | Required                   |
| **npm/yarn**        | Package manager for dependencies               | Required                   |
| **React**           | UI library                                     | Required                   |
| **Phaser 3**        | 2D game engine                                 | Required                   |
| **Tailwind CSS**    | Styling and layout                             | Optional, but helpful      |
| **TypeScript**      | Static typing for safer code                   | Strongly recommended       |
| **Git/GitHub**      | Version control and collaboration              | Required                   |
| **Clerk/Firebase**  | User authentication (if applicable)            | Optional                   |
| **Vite**            | Fast development server and bundler            | Recommended over CRA       |
| **Visual Studio Code** | Code editor                                 | Recommended                |

### 🖥 Hardware Resources

| Device                    | Use                                             | Required? |
|---------------------------|--------------------------------------------------|-----------|
| **Desktop or Laptop**     | Development and playtesting                      | ✅        |
| **Tablet or Touchscreen** | AAC user interface simulation                    | ✅        |
| **Multiple Devices (2–5)**| Simultaneous testing (1 AAC + 4 Hippo players)   | ✅        |



## Collaborators

[//]: # ( readme: collaborators -start )
<table>
<tr>
    <td align="center">
        <a href="https://github.com/tun67213">
            <img src="https://avatars.githubusercontent.com/u/122761457?v=4" width="100;" alt="ArvindhVelrajan"/>
            <br />
            <sub><b>Arvindh Velrajan</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/MKarimF9">
            <img src="https://www.gravatar.com/avatar/?d=mp&s=200" width="100" alt="Default profile picture" />
            <br />
            <sub><b>Mohammed Karim</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/tug74295">
            <img src="https://www.gravatar.com/avatar/?d=mp&s=200" width="100" alt="Default profile picture" />
            <br />
            <sub><b>Kostandin Jorgji</b></sub>
        </a>
    </td>
        <td align="center">
        <a href="https://github.com/jdoooodler">
            <img src="https://www.gravatar.com/avatar/?d=mp&s=200" width="100" alt="Default profile picture" />
            <br />
            <sub><b>Jasmine Liu</b></sub>
        </a>
    </td>
        <td align="center">
        <a href="https://github.com/tun70323">
            <img src="https://www.gravatar.com/avatar/?d=mp&s=200" width="100" alt="Default profile picture" />
            <br />
            <sub><b>Omais Khan</b></sub>
        </a>
    </td>
</tr>
</table>

[//]: # ( readme: collaborators -end )