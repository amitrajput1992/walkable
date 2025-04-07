import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NPCProps } from '../../types';

const NPC: React.FC<NPCProps> = ({ 
  position = [0, 0, 0], 
  navMeshRef, 
  color = 'red', 
  speed = 0.05,
  randomMovement = false,
  initialPosition = null
}) => {
  const npcRef = useRef<THREE.Group>(null);
  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState<number>(0);
  const [movementEnabled, setMovementEnabled] = useState<boolean>(false);
  const timeToNextDestination = useRef<number>(Math.random() * 2 + 1); // 1-3 seconds

  // Function to set a new destination and calculate path
  const setDestination = useCallback((destination: THREE.Vector3) => {
    if (!navMeshRef.current || !npcRef.current) {
      console.warn('NavMesh or NPC reference not available');
      return;
    }
    
    // Get current position of the NPC
    const start = new THREE.Vector3(
      npcRef.current.position.x,
      npcRef.current.position.y,
      npcRef.current.position.z
    );
    
    // Target destination
    const end = new THREE.Vector3(destination.x, destination.y, destination.z);
    
    // Use the navmesh to find a path
    try {
      // Access the findPath method through the ref
      if (typeof navMeshRef.current.findPath !== 'function') {
        console.error('findPath is not a function on navMeshRef.current');
        return;
      }
      
      const newPath = navMeshRef.current.findPath(start, end);
      
      if (newPath && newPath.length > 0) {
        setPath(newPath);
        setCurrentPathIndex(0);
      } else {
        console.warn('No path found to destination');
        // If no path is found, just create a direct path to the destination
        // This is a fallback for debugging
        setPath([start, end]);
        setCurrentPathIndex(0);
      }
    } catch (error) {
      console.error('Error finding path:', error);
    }
  }, []);
  
  // Function to pick a random destination within the actual navmesh bounds
  const pickRandomDestination = useCallback(() => {
    if (!npcRef.current || !navMeshRef.current) return;
    
    try {
      // Get the current position of the NPC
      const currentPosition = new THREE.Vector3();
      npcRef.current.getWorldPosition(currentPosition);
      
      // Define a search radius for random destinations
      const searchRadius = 20; // Adjust based on navmesh size
      
      // Generate multiple random points and try to find a valid path
      let foundValidPath = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!foundValidPath && attempts < maxAttempts) {
        // Generate random angle and distance within search radius
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDistance = Math.random() * searchRadius;
        
        // Calculate random point coordinates
        const randomX = currentPosition.x + Math.cos(randomAngle) * randomDistance;
        const randomZ = currentPosition.z + Math.sin(randomAngle) * randomDistance;
        
        // Create a destination vector
        const destination = new THREE.Vector3(randomX, 0, randomZ);
        
        // Check if we can find a path to this destination
        const path = navMeshRef.current.findPath(currentPosition, destination);
        
        if (path && path.length > 0) {
          // We found a valid path, use this destination
          setDestination(destination);
          foundValidPath = true;
        }
        
        attempts++;
      }
      
      if (!foundValidPath) {
        // If we couldn't find a valid path after several attempts,
        // just use the current position as destination to prevent getting stuck
        console.warn('Could not find valid path after', maxAttempts, 'attempts');
        setDestination(currentPosition);
      }
      
      // Reset the timer for the next random movement
      timeToNextDestination.current = Math.random() * 3 + 2; // 2-5 seconds
    } catch (error) {
      console.error('Error in pickRandomDestination:', error);
    }
  }, [setDestination]);
  
  // Function to start random movement
  const startMovement = useCallback(() => {
    setMovementEnabled(true);
    pickRandomDestination();
  }, [pickRandomDestination]);
  
  // Register the NPC with userData for scene-level interactions
  useEffect(() => {
    if (npcRef.current) {
      npcRef.current.userData.isNPC = true;
      npcRef.current.userData.setDestination = setDestination;
      npcRef.current.userData.startMovement = startMovement;
    }
    
    return () => {
      if (npcRef.current) {
        delete npcRef.current.userData.isNPC;
        delete npcRef.current.userData.setDestination;
        delete npcRef.current.userData.startMovement;
      }
    };
  }, [startMovement, setDestination]);
  
  // Set up random movement if enabled
  useEffect(() => {
    if (randomMovement && npcRef.current && movementEnabled) {
      // Initial random destination
      pickRandomDestination();
    }
  }, [randomMovement, pickRandomDestination, movementEnabled]);
  
  // Update position when initialPosition changes (first click)
  useEffect(() => {
    if (initialPosition && npcRef.current) {
      // Set the NPC to the initial position
      npcRef.current.position.set(
        initialPosition.x, 
        0.5, 
        initialPosition.z
      );
    }
  }, [initialPosition]);
  
  // Move along the path and handle random movement
  useFrame((_, delta) => { // Rename state to _ since it's unused
    if (!npcRef.current || !movementEnabled) return;
    
    // Handle random movement
    if (randomMovement) {
      timeToNextDestination.current -= delta;
      
      // If we've reached the end of the path or it's time for a new destination
      if ((path.length === 0 || currentPathIndex >= path.length) || 
          timeToNextDestination.current <= 0) {
        pickRandomDestination();
      }
    }
    
    // Skip movement if no path or reached the end
    if (path.length === 0 || currentPathIndex >= path.length) return;
    
    const currentPosition = npcRef.current.position;
    const targetPosition = path[currentPathIndex];
    
    // Calculate direction and distance to the next point
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, currentPosition);
    const distance = direction.length();
    
    // If we're close enough to the target, move to the next point
    if (distance < 0.1) {
      setCurrentPathIndex(prev => prev + 1);
      return;
    }
    
    // Normalize the direction and move the NPC
    direction.normalize();
    
    // Calculate the movement distance based on speed and delta time
    // This ensures consistent movement speed regardless of frame rate
    const movementDistance = speed * delta;
    
    // Move the NPC towards the target
    npcRef.current.position.x += direction.x * movementDistance;
    npcRef.current.position.z += direction.z * movementDistance;
    
    // Rotate the NPC to face the direction of movement
    if (direction.length() > 0.001) {
      const angle = Math.atan2(direction.x, direction.z);
      npcRef.current.rotation.y = angle;
    }
  });
  
  return (
    <group ref={npcRef} position={position}>
      {/* NPC body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.6, 2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* NPC head */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

export default NPC;
