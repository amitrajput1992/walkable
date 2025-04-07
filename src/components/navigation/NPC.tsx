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
      const searchRadius = 30; // Reduced radius for more natural movement
      
      // Generate multiple random points and try to find a valid path
      let foundValidPath = false;
      let attempts = 0;
      const maxAttempts = 20; // More attempts to find valid positions
      
      while (!foundValidPath && attempts < maxAttempts) {
        // Generate random position using two approaches:
        // 1. Local movement around current position
        // 2. Global movement within navmesh bounds
        
        let randomPosition;
        
        if (attempts < 15) {
          // Try local movement first (75% of attempts)
          const angle = Math.random() * Math.PI * 2;
          const distance = 5 + Math.random() * searchRadius; // Minimum 5 units away
          
          // Calculate the random position
          const randomX = currentPosition.x + Math.cos(angle) * distance;
          const randomZ = currentPosition.z + Math.sin(angle) * distance;
          randomPosition = new THREE.Vector3(randomX, 0.5, randomZ);
          
          // Ensure the position is within bounds before pathfinding
          if (bounds) {
            randomPosition.x = Math.max(bounds.min.x + 2, Math.min(bounds.max.x - 2, randomPosition.x));
            randomPosition.z = Math.max(bounds.min.z + 2, Math.min(bounds.max.z - 2, randomPosition.z));
          }
        } else {
          // Fall back to global movement within bounds (with margin)
          const { min, max } = bounds;
          // Add a small margin to ensure we're not right at the edge
          const margin = 2;
          const randomX = min.x + margin + Math.random() * (max.x - min.x - 2 * margin);
          const randomZ = min.z + margin + Math.random() * (max.z - min.z - 2 * margin);
          randomPosition = new THREE.Vector3(randomX, 0.5, randomZ);
        }
        
        // First check if the point is within the navmesh
        const isInNavMesh = navMeshRef.current.isPointInNavMesh(randomPosition);
        
        if (isInNavMesh) {
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
        } else {
          console.log("Random position outside navmesh, skipping", randomPosition);
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
      
      // First check if the position is within navmesh bounds
      const isInNavMesh = navMeshRef.current.isPointInNavMesh(testPosition);
      
      if (!isInNavMesh) {
        // If outside bounds, recalculate path to stay within bounds
        console.warn("NPC attempted to move outside navmesh bounds, recalculating path");
        
        // Get navmesh bounds
        const bounds = navMeshRef.current.getNavMeshBounds();
        if (bounds) {
          // Clamp the position to the navmesh bounds
          const clampedPosition = new THREE.Vector3(
            Math.max(bounds.min.x, Math.min(bounds.max.x, testPosition.x)),
            0.5,
            Math.max(bounds.min.z, Math.min(bounds.max.z, testPosition.z))
          );
          
          // Get current position for pathfinding
          const currentPathPoint = new THREE.Vector3(currentPosition.x, 0.5, currentPosition.z);
          
          // Try to find a path to the clamped position
          try {
            const newPath = navMeshRef.current.findPath(currentPathPoint, clampedPosition);
            if (newPath && newPath.length > 0) {
              // Update the path with the new valid path
              setPath(newPath);
              return; // Skip this frame's movement
            }
          } catch (error) {
            console.error("Error finding path to clamped position:", error);
          }
        }
        
        // If we couldn't find a valid path, just stop movement
        return;
      }
      
      // If in bounds, verify it's walkable with pathfinding
      const currentPathPoint = new THREE.Vector3(currentPosition.x, 0.5, currentPosition.z);
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
          
          // Try to find a new path to the target
          if (path.length > 1) {
            const targetPoint = path[path.length - 1];
            try {
              const newPath = navMeshRef.current.findPath(currentPathPoint, targetPoint);
              if (newPath && newPath.length > 0) {
                setPath(newPath);
              }
            } catch (error) {
              console.error("Error finding new path around obstacle:", error);
            }
          }
        }
      } catch (error) {
        // If pathfinding fails, still try to move but more cautiously
        // First check if the cautious move would be within bounds
        const cautionFactor = 0.3; // More cautious than before
        const cautionPosition = new THREE.Vector3()
          .copy(currentPosition)
          .add(direction.clone().multiplyScalar(actualMoveDistance * cautionFactor));
        
        if (navMeshRef.current.isPointInNavMesh(cautionPosition)) {
          npcRef.current.position.x += (newPosition.x - npcRef.current.position.x) * cautionFactor;
          npcRef.current.position.y = newPosition.y;
          npcRef.current.position.z += (newPosition.z - npcRef.current.position.z) * cautionFactor;
        } else {
          // If even the cautious move is outside bounds, don't move
          console.warn("NPC cannot move safely, staying in place");
        }
      }
    } else {
      // If we don't have navmesh reference, just move directly
      // This should rarely happen, but just in case
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
