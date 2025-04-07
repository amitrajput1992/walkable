import React, { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import NavMesh from '../navigation/NavMesh';
import Model from '../scene/Model';
import NPC from '../navigation/NPC';
import { SceneProps, NPCProps as NPCType, NavMeshRef } from '../../types';

const Scene: React.FC<SceneProps> = ({ debug = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const navMeshRef = useRef<NavMeshRef>(null);
  const { scene } = useThree();
  
  // State to track if simulation has started
  const [simulationStarted, setSimulationStarted] = useState<boolean>(false);
  // State to store the initial click position
  const [initialClickPosition, setInitialClickPosition] = useState<THREE.Vector3 | null>(null);
  
  // Create 10 NPCs with initial positions at the same spot (will be updated on first click)
  const [npcs] = useState<NPCType[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      navMeshRef: navMeshRef as React.RefObject<NavMeshRef>,
      position: [0, 0.5, 0], // Initial position (will be updated on first click)
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color
      speed: 1.4 // Speed in meters/second
    }));
  });
  
  // Handle clicking on the ground to set NPC destination
  const handleGroundClick = (event: any) => {
    event.stopPropagation();
    // Get the clicked point on the ground
    const clickedPoint = event.point.clone();
    console.log("clickedPoint", clickedPoint);
    
    // If this is the first click, start the simulation and set initial positions
    if (!simulationStarted) {
      console.log('Starting simulation at position:', clickedPoint);
      setInitialClickPosition(clickedPoint);
      setSimulationStarted(true);
      
      // Update all NPCs to start at this position
      scene.traverse((object) => {
        if (object.userData && object.userData.isNPC) {
          // Move the NPC to the clicked position
          object.position.set(clickedPoint.x, 0.5, clickedPoint.z);
          
          // Start random movement after a small delay to avoid all NPCs moving at once
          if (object.userData.startMovement) {
            setTimeout(() => {
              object.userData.startMovement();
            }, Math.random() * 1000); // Random delay up to 1 second
          }
        }
      });
    } else {
      // For subsequent clicks, just set the destination for all NPCs
      scene.traverse((object) => {
        if (object.userData && object.userData.isNPC && object.userData.setDestination) {
          object.userData.setDestination(clickedPoint);
        }
      });
    }
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[-10, 35, -10]} />
      {/* Controls - centered on the model */}
      <OrbitControls 
        target={[20, 10, -30]} // Target the center where the model is positioned
        enableDamping={true}
        dampingFactor={0.25}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2} // Limit vertical rotation to prevent going below the ground
      />
      
      {/* Environment and Lighting */}
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      <React.Suspense fallback={null}>
{/* Scene Content */}
<group ref={groupRef}>
        <Model />
        {/* Navigation Mesh - must come before NPCs */}
        <NavMesh ref={navMeshRef as any} debug={debug} handleClick={handleGroundClick} />
        
        {/* Multiple NPCs with random movement that starts only after first click */}
        {npcs.map(npc => (
          <NPC 
            key={npc.id}
            position={npc.position} 
            navMeshRef={navMeshRef as React.RefObject<NavMeshRef>} 
            color={npc.color}
            speed={npc.speed}
            randomMovement={simulationStarted}
            initialPosition={initialClickPosition}
          />
        ))}
        
        {/* Debug Grid */}
        {debug && <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />}
      </group>
      </React.Suspense>
    </>
  )
}

export default Scene
