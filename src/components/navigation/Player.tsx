import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PlayerProps } from "../../types";

const Player: React.FC<PlayerProps> = ({ 
  position = [0, 0, 0], 
  navMeshRef, 
  color = 'blue', 
  speed = 2.0,
  scale = 1.5
}) => {
  const playerRef = useRef<THREE.Group>(null);
  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const [destination, setDestination] = useState<THREE.Vector3 | null>(null);

  // Set initial position to the center of the navmesh when component mounts
  useEffect(() => {
    console.log("navMeshRef.current", navMeshRef.current, "playerRef.current", playerRef.current);
    if (!navMeshRef.current || !playerRef.current) return;
    
    const bounds = navMeshRef.current.getNavMeshBounds();
    console.log("BOUNDS: ", bounds);
    if (bounds) {
      const center = bounds.center;
      playerRef.current.position.set(center.x, 0.5, center.z);
    }
  }, [navMeshRef.current]);

  // Move along the path
  useFrame((_, delta) => {
    if (!playerRef.current || path.length === 0) return;
    
    // Get the current position of the player
    const currentPosition = new THREE.Vector3();
    playerRef.current.getWorldPosition(currentPosition);
    
    // Get the next point in the path
    const targetPoint = path[0];
    
    // Calculate direction and distance to the next point
    const direction = new THREE.Vector3().subVectors(targetPoint, currentPosition).normalize();
    const distance = currentPosition.distanceTo(targetPoint);
    
    // If we're close enough to the next point, remove it from the path
    if (distance < 0.5) {
      path.shift();
      return;
    }
    
    // Move towards the next point
    const moveDistance = speed * delta;
    const actualMoveDistance = Math.min(moveDistance, distance);
    playerRef.current.position.add(direction.multiplyScalar(actualMoveDistance));
    
    // Rotate to face the direction of movement
    if (direction.length() > 0.001) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      playerRef.current.rotation.y = targetRotation;
    }
  });

  // Handle setting a new destination
  const handleSetDestination = (point: THREE.Vector3) => {
    if (!navMeshRef.current) return;
    
    // Get current position
    const currentPosition = new THREE.Vector3();
    playerRef.current?.getWorldPosition(currentPosition);
    
    // Find path to the new destination
    const newPath = navMeshRef.current.findPath(currentPosition, point);
    if (newPath && newPath.length > 0) {
      setPath(newPath);
      setDestination(point);
    }
  };

  // Expose function to set destination
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.userData.setDestination = handleSetDestination;
    }
  }, [handleSetDestination]);

  return (
    <group ref={playerRef} scale={[scale, scale, scale]}>
      {/* Player body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.9, 2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Player head */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

export default Player;
