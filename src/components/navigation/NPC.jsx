import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const NPC = ({ 
  position = [0, 0, 0], 
  navMeshRef, 
  color = 'red', 
  speed = 0.05,
  randomMovement = false
}) => {
  const npcRef = useRef()
  const [path, setPath] = useState([])
  const [currentPathIndex, setCurrentPathIndex] = useState(0)
  const targetRef = useRef(new THREE.Vector3(...position))
  const timeToNextDestination = useRef(Math.random() * 2 + 1) // 1-3 seconds
  
  // Register the NPC with userData for scene-level interactions
  useEffect(() => {
    if (npcRef.current) {
      npcRef.current.userData.isNPC = true
      npcRef.current.userData.setDestination = setDestination
    }
    
    return () => {
      if (npcRef.current) {
        delete npcRef.current.userData.isNPC
        delete npcRef.current.userData.setDestination
      }
    }
  }, [])
  
  // Function to pick a random destination within the navmesh bounds
  const pickRandomDestination = useCallback(() => {
    if (!npcRef.current || !navMeshRef.current) return
    
    // Pick a random point within the navmesh bounds (assuming it's 20x20)
    const x = Math.random() * 16 - 8 // -8 to 8
    const z = Math.random() * 16 - 8 // -8 to 8
    
    const destination = new THREE.Vector3(x, 0, z)
    setDestination(destination)
    
    // Reset the timer for the next random movement
    timeToNextDestination.current = Math.random() * 3 + 2 // 2-5 seconds
  }, []);
  
  // Set up random movement if enabled
  useEffect(() => {
    if (randomMovement && npcRef.current) {
      // Initial random destination
      pickRandomDestination()
    }
  }, [randomMovement, pickRandomDestination])
  
  // Move along the path and handle random movement
  useFrame((state, delta) => {
    if (!npcRef.current) return
    
    // Handle random movement
    if (randomMovement) {
      timeToNextDestination.current -= delta
      
      // If we've reached the end of the path or it's time for a new destination
      if ((path.length === 0 || currentPathIndex >= path.length) || 
          timeToNextDestination.current <= 0) {
        pickRandomDestination()
      }
    }
    
    // Skip movement if no path or reached the end
    if (path.length === 0 || currentPathIndex >= path.length) return
    
    const currentPosition = npcRef.current.position
    const targetPosition = path[currentPathIndex]
    
    // Calculate direction and distance to the next point
    const direction = new THREE.Vector3()
    direction.subVectors(targetPosition, currentPosition)
    const distance = direction.length()
    
    // If we're close enough to the target, move to the next point
    if (distance < 0.1) {
      setCurrentPathIndex(prev => prev + 1)
      return
    }
    
    // Normalize and scale by speed (meters per second) * delta time (seconds)
    // This makes movement frame-rate independent at exactly 1.4 meters/second
    direction.normalize().multiplyScalar(speed * delta)
    
    // Move towards the target
    currentPosition.add(direction)
    
    // Rotate to face the direction of movement
    if (direction.length() > 0.001) {
      const lookAtTarget = new THREE.Vector3(
        currentPosition.x + direction.x,
        currentPosition.y,
        currentPosition.z + direction.z
      )
      npcRef.current.lookAt(lookAtTarget)
    }
  })
  
  // Set a new destination and calculate path
  const setDestination = (destination) => {
    if (!navMeshRef.current || !npcRef.current) {
      console.warn('NavMesh or NPC reference not available')
      return
    }
    
    console.log('Setting destination:', destination)
    
    // Get current position of the NPC
    const start = new THREE.Vector3(
      npcRef.current.position.x,
      npcRef.current.position.y,
      npcRef.current.position.z
    )
    
    // Target destination
    const end = new THREE.Vector3(destination.x, destination.y, destination.z)
    
    // Use the navmesh to find a path
    try {
      // Access the findPath method through the ref
      if (typeof navMeshRef.current.findPath !== 'function') {
        console.error('findPath is not a function on navMeshRef.current', navMeshRef.current)
        return
      }
      
      const newPath = navMeshRef.current.findPath(start, end)
      
      if (newPath && newPath.length > 0) {
        console.log('Path found with', newPath.length, 'points:', newPath)
        setPath(newPath)
        setCurrentPathIndex(0)
      } else {
        console.warn('No path found to destination')
        // If no path is found, just create a direct path to the destination
        // This is a fallback for debugging
        setPath([start, end])
        setCurrentPathIndex(0)
      }
    } catch (error) {
      console.error('Error finding path:', error)
    }
  }
  
  return (
    <group ref={npcRef} position={position}>
      {/* Simple NPC representation */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Debug visualization of the path */}
      {path.length > 0 && (
        <line>
          <bufferGeometry>
            <float32BufferAttribute 
              attach="attributes-position" 
              args={[new Float32Array(path.flatMap(p => [p.x, p.y, p.z])), 3]} 
            />
          </bufferGeometry>
          <lineBasicMaterial color="yellow" linewidth={2} />
        </line>
      )}
    </group>
  )
}

export default NPC
