import React, { useRef, useState, useEffect } from 'react';
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
  // State to store the initial positions for NPCs
  const [npcPositions, setNpcPositions] = useState<THREE.Vector3[]>([]);
  
  // Create NPCs with initial positions that will be set once navmesh is loaded
  const [npcs, setNpcs] = useState<NPCType[]>([]);
  
  // Function to generate random positions within navmesh bounds
  const generateRandomPositionsInNavmesh = (count: number) => {
    if (!navMeshRef.current) return [];
    
    const bounds = navMeshRef.current.getNavMeshBounds();
    if (!bounds) return [];
    
    console.log('Generating positions within navmesh bounds:', bounds);
    
    const positions: THREE.Vector3[] = [];
    const { min, max } = bounds;
    
    // Try to find valid positions on the navmesh
    let attempts = 0;
    const maxAttempts = count * 10; // Allow multiple attempts per NPC
    
    while (positions.length < count && attempts < maxAttempts) {
      // Generate a random position within the bounds
      const x = min.x + Math.random() * (max.x - min.x);
      const z = min.z + Math.random() * (max.z - min.z);
      const position = new THREE.Vector3(x, 0.5, z);
      
      // Check if this position is on the navmesh by trying to find a path from center to this point
      const center = new THREE.Vector3();
      center.copy(bounds.center);
      center.y = 0.5;
      
      try {
        const path = navMeshRef.current.findPath(center, position);
        if (path && path.length > 0) {
          // Valid position found
          positions.push(position);
          console.log(`Found valid position ${positions.length}/${count}:`, position);
        }
      } catch (error) {
        console.error("Error finding path in generateRandomPositionsInNavmesh:", error);
        // Continue to next attempt
      }
      
      attempts++;
    }
    
    console.log(`Generated ${positions.length} valid positions after ${attempts} attempts`);
    return positions;
  };
  
  // Initialize NPCs with positions once navmesh is available
  useEffect(() => {
    if (navMeshRef.current && !simulationStarted) {
      // Wait a bit for the navmesh to fully initialize
      const timer = setTimeout(() => {
        try {
          // Try to generate positions for NPCs
          const positions = generateRandomPositionsInNavmesh(50);
          setNpcPositions(positions);
          
          if (positions.length > 0) {
          // Create NPCs with these positions
          const newNpcs = Array.from({ length: positions.length }, (_, i) => ({
            id: i,
            navMeshRef: navMeshRef as React.RefObject<NavMeshRef>,
            position: [positions[i].x, 0.5, positions[i].z] as [number, number, number],
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            speed: 1.4 + Math.random() * 0.6 // Vary speed between 1.4 and 2.0
          }));
          
          setNpcs(newNpcs);
          setSimulationStarted(true);
          
          // Start NPCs moving
          setTimeout(() => {
            scene.traverse((object) => {
              if (object.userData && object.userData.isNPC && object.userData.startMovement) {
                object.userData.startMovement();
              }
            });
          }, 1000);
        } else {
          console.warn("Could not generate valid positions. Using fallback position.");
          // Use a fallback position if no valid positions were found
          const fallbackPosition = new THREE.Vector3(0, 0.5, 0);
          setNpcPositions([fallbackPosition]);
          
          // Create a single NPC at the fallback position
          const newNpcs = [{
            id: 0,
            navMeshRef: navMeshRef as React.RefObject<NavMeshRef>,
            position: [0, 0.5, 0] as [number, number, number],
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            speed: 1.4
          }];
          
          setNpcs(newNpcs);
          setSimulationStarted(true);
        }
      } catch (error) {
        console.error("Error initializing NPCs:", error);
      }
      }, 1000); // Increased timeout to ensure navmesh is fully initialized
      
      return () => clearTimeout(timer);
    }
  }, [navMeshRef.current, simulationStarted, scene, generateRandomPositionsInNavmesh]);
  
  // Handle clicking on the ground to set NPC destination
  const handleGroundClick = (event: any) => {
    event.stopPropagation();
    // Get the clicked point on the ground
    const clickedPoint = event.point.clone();
    console.log("clickedPoint", clickedPoint);
    
    // Set the destination for all NPCs
    scene.traverse((object) => {
      if (object.userData && object.userData.isNPC && object.userData.setDestination) {
        object.userData.setDestination(clickedPoint);
      }
    });
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[-10, 35, -10]} />
      {/* Controls - centered on the model */}
      <OrbitControls 
        target={[20, 10, -30]} // Target the center where the model is positioned
        enableDamping={true}
        // dampingFactor={0.25}
        minDistance={0.1}
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
