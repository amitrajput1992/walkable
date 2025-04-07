import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { NPCProps } from "../../types";

const NPC: React.FC<NPCProps> = ({ 
  position = [0, 0, 0], 
  navMeshRef, 
  color = 'red', 
  speed = 1.5,
  randomMovement = false
}) => {
  const npcRef = useRef<THREE.Group>(null);
  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const [destination, setDestination] = useState<THREE.Vector3 | null>(null);
  const [movementEnabled, setMovementEnabled] = useState(false);
  const timeToNextDestination = useRef(Math.random() * 3 + 2); // 2-5 seconds

  // Set initial position when component mounts
  useEffect(() => {
    if (npcRef.current) {
      // Set the NPC to the provided position
      npcRef.current.position.set(
        position[0], 
        position[1], 
        position[2]
      );
    }
  }, []);

  // Function to pick a random destination within the navmesh
  const pickRandomDestination = useCallback(() => {
    if (!navMeshRef.current || !npcRef.current) return;
    
    // Get the current position of the NPC
    const currentPosition = new THREE.Vector3();
    npcRef.current.getWorldPosition(currentPosition);
    
    // Try to get the navmesh bounds first for a more reliable approach
    const bounds = navMeshRef.current.getNavMeshBounds();
    if (bounds) {
      // Define a smaller search radius for better local movement
      const searchRadius = 50; // Smaller radius for more natural movement
      
      // Generate multiple random points and try to find a valid path
      let foundValidPath = false;
      let attempts = 0;
      const maxAttempts = 15; // More attempts with smaller radius
      
      while (!foundValidPath && attempts < maxAttempts) {
        // Generate random position using two approaches:
        // 1. Local movement around current position
        // 2. Global movement within navmesh bounds
        
        let randomPosition;
        
        if (attempts < 10) {
          // Try local movement first (80% of attempts)
          const angle = Math.random() * Math.PI * 2;
          const distance = 5 + Math.random() * searchRadius; // Minimum 5 units away
          
          // Calculate the random position
          const randomX = currentPosition.x + Math.cos(angle) * distance;
          const randomZ = currentPosition.z + Math.sin(angle) * distance;
          randomPosition = new THREE.Vector3(randomX, 0.5, randomZ);
        } else {
          // Fall back to global movement within bounds
          const { min, max } = bounds;
          const randomX = min.x + Math.random() * (max.x - min.x);
          const randomZ = min.z + Math.random() * (max.z - min.z);
          randomPosition = new THREE.Vector3(randomX, 0.5, randomZ);
        }
        
        // Try to find a path to this random position
        try {
          const path = navMeshRef.current.findPath(
            currentPosition,
            randomPosition
          );
          
          // If a valid path is found, use it
          if (path && path.length > 0) {
            console.log("Found valid path to", randomPosition);
            setDestination(randomPosition);
            foundValidPath = true;
            break;
          }
        } catch (error) {
          console.error("Error finding path in pickRandomDestination:", error);
        }
        
        attempts++;
      }
      
      // If no valid path was found after all attempts, use a very simple approach
      if (!foundValidPath) {
        console.warn("Could not find a valid random path after", maxAttempts, "attempts");
        
        // Just move a small distance in a random direction
        const angle = Math.random() * Math.PI * 2;
        const distance = 5; // Small safe distance
        
        const randomX = currentPosition.x + Math.cos(angle) * distance;
        const randomZ = currentPosition.z + Math.sin(angle) * distance;
        const fallbackPosition = new THREE.Vector3(randomX, 0.5, randomZ);
        
        setDestination(fallbackPosition);
      }
    } else {
      // No bounds available, use simple random movement
      const angle = Math.random() * Math.PI * 2;
      const distance = 10; // Small safe distance
      
      const randomX = currentPosition.x + Math.cos(angle) * distance;
      const randomZ = currentPosition.z + Math.sin(angle) * distance;
      const fallbackPosition = new THREE.Vector3(randomX, 0.5, randomZ);
      
      setDestination(fallbackPosition);
    }
  }, [navMeshRef]);

  // Update path when destination changes
  useEffect(() => {
    if (!destination || !npcRef.current || !navMeshRef.current) return;
    
    // Get current position
    const currentPosition = new THREE.Vector3();
    npcRef.current.getWorldPosition(currentPosition);
    
    // Find path to destination
    try {
      const newPath = navMeshRef.current.findPath(currentPosition, destination);
      
      if (newPath && newPath.length > 0) {
        setPath(newPath);
      } else {
        console.warn("No path found to destination");
        // Try direct path as fallback
        setPath([
          new THREE.Vector3(currentPosition.x, 0.5, currentPosition.z),
          new THREE.Vector3(destination.x, 0.5, destination.z)
        ]);
      }
    } catch (error) {
      console.error("Error finding path:", error);
    }
  }, [destination, navMeshRef]);

  // Start random movement when enabled
  useEffect(() => {
    if (randomMovement && movementEnabled) {
      pickRandomDestination();
    }
  }, [randomMovement, pickRandomDestination, movementEnabled]);

  // Expose functions to the parent component
  useEffect(() => {
    if (npcRef.current) {
      npcRef.current.userData.isNPC = true;
      npcRef.current.userData.startMovement = () => {
        setMovementEnabled(true);
        if (randomMovement) {
          pickRandomDestination();
        }
      };
    }
  }, [randomMovement, pickRandomDestination]);

  // Move along the path and handle random movement
  useFrame((_, delta) => {
    if (!npcRef.current || !movementEnabled || path.length === 0) return;
    
    // Get the current position of the NPC
    const currentPosition = new THREE.Vector3();
    npcRef.current.getWorldPosition(currentPosition);
    
    // Get the next point in the path
    const targetPoint = path[0];
    
    // Calculate direction and distance to the next point
    const direction = new THREE.Vector3().subVectors(targetPoint, currentPosition).normalize();
    const distance = currentPosition.distanceTo(targetPoint);
    
    // If we're close enough to the next point, remove it from the path
    if (distance < 0.5) {
      path.shift();
      
      // If we've reached the end of the path, pick a new destination if random movement is enabled
      if (path.length === 0 && randomMovement) {
        // Add a small delay before picking a new destination to prevent constant movement
        setTimeout(() => {
          pickRandomDestination();
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
      }
      
      return;
    }
    
    // Move towards the next point with smoothing to prevent jitter
    const moveDistance = speed * delta;
    
    // Limit the move distance to prevent overshooting
    const actualMoveDistance = Math.min(moveDistance, distance * 0.8);
    
    const newPosition = new THREE.Vector3()
      .copy(currentPosition)
      .add(direction.multiplyScalar(actualMoveDistance));
    
    // Check if the new position is valid (on the navmesh) before moving
    if (navMeshRef.current) {
      const testPosition = new THREE.Vector3(newPosition.x, 0.5, newPosition.z);
      const currentPathPoint = new THREE.Vector3(currentPosition.x, 0.5, currentPosition.z);
      
      // Try to find a path from current to new position to verify it's walkable
      try {
        const testPath = navMeshRef.current.findPath(currentPathPoint, testPosition);
        
        if (testPath && testPath.length > 0) {
          // Update position if the path is valid with smoothing
          npcRef.current.position.x += (newPosition.x - npcRef.current.position.x) * 0.8;
          npcRef.current.position.y = newPosition.y; // Keep Y position exact
          npcRef.current.position.z += (newPosition.z - npcRef.current.position.z) * 0.8;
        } else {
          // If we can't path to the new position, it might be an obstacle
          console.log("NPC avoided obstacle");
        }
      } catch (error) {
        // If pathfinding fails, still try to move but more cautiously
        npcRef.current.position.x += (newPosition.x - npcRef.current.position.x) * 0.5;
        npcRef.current.position.y = newPosition.y;
        npcRef.current.position.z += (newPosition.z - npcRef.current.position.z) * 0.5;
      }
    } else {
      // If we don't have navmesh reference, just move directly
      npcRef.current.position.copy(newPosition);
    }
    
    // Rotate to face the direction of movement with smoothing
    if (direction.length() > 0.001) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      
      // Smooth rotation
      let currentRotation = npcRef.current.rotation.y;
      
      // Normalize the angle difference to between -PI and PI
      let angleDiff = targetRotation - currentRotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Apply smooth rotation
      npcRef.current.rotation.y += angleDiff * 0.1;
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
