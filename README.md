# Walkable - 3D NavMesh Pathfinding Simulation

A React Three Fiber application that demonstrates NavMesh-based pathfinding for NPCs in a 3D environment using three-pathfinding.

## Features

- 3D environment with React Three Fiber
- Navigation mesh (NavMesh) for pathfinding
- NPC movement simulation using three-pathfinding
- Orbit controls for camera manipulation
- Debug mode to visualize the navigation mesh and paths

## Tech Stack

- React
- Vite
- Three.js
- React Three Fiber (@react-three/fiber)
- React Three Drei (@react-three/drei)
- three-pathfinding

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/walkable.git
cd walkable

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open your browser and navigate to http://localhost:5173 to see the application.

### Building for Production

```bash
# Build the application
npm run build
```

## Project Structure

```
/src
  /components
    /navigation
      NavMesh.jsx     # Navigation mesh implementation
      NPC.jsx         # NPC character with pathfinding
    /scene
      Model.jsx       # 3D model component
      Scene.jsx       # Main 3D scene setup
    UI.jsx            # User interface overlay
  App.jsx             # Main application component
  main.jsx            # Entry point
```

## Usage

- Use the orbit controls to navigate the 3D environment (mouse drag to rotate, scroll to zoom)
- Toggle the debug mode to visualize the navigation mesh and pathfinding
- NPCs will automatically navigate around obstacles using the navigation mesh

## Customization

- Replace the placeholder model in `Model.jsx` with your own 3D models
- Modify the navigation mesh in `NavMesh.jsx` to match your environment
- Adjust NPC behavior in `NPC.jsx` to create different movement patterns

## License

MIT


## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
