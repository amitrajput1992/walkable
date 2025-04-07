import React, { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import NavMesh from '../navigation/NavMesh'
import Model from '../scene/Model'
import NPC from '../navigation/NPC'

const Scene = ({ debug }) => {
  const groupRef = useRef()
  const navMeshRef = useRef()
  const { scene } = useThree()
  
  // Create 10 NPCs with random starting positions
  const [npcs] = useState(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      position: [
        Math.random() * 16 - 8, // x between -8 and 8
        0.5,                    // y at 0.5 (just above ground)
        Math.random() * 16 - 8  // z between -8 and 8
      ],
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color
      speed: 1.4 // Speed in meters/second
    }))
  })
  
  // Handle clicking on the ground to set NPC destination
  const handleGroundClick = (event) => {
    event.stopPropagation()
    // Get the clicked point on the ground
    const clickedPoint = event.point.clone()
    
    // Find all NPCs in the scene and set their destination
    scene.traverse((object) => {
      if (object.userData && object.userData.isNPC && object.userData.setDestination) {
        object.userData.setDestination(clickedPoint)
      }
    })
  }
  
  // Add obstacles to the scene
  const createObstacle = (position, size = [1, 2, 1], color = 'gray') => {
    // Create a reference to store the mesh
    const obstacleRef = useRef()
    
    // Set up the obstacle when it's mounted
    useEffect(() => {
      if (obstacleRef.current) {
        // Mark this as an obstacle for the NavMesh
        obstacleRef.current.userData.isObstacle = true
      }
    }, [])
    
    return (
      <mesh ref={obstacleRef} position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    )
  }

  return (
    <>
      {/* Controls */}
      <OrbitControls makeDefault />
      
      {/* Environment and Lighting */}
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Scene Content */}
      <group ref={groupRef}>
        {/* Navigation Mesh - must come before NPCs */}
        <NavMesh ref={navMeshRef} debug={debug} />
        
        {/* Multiple NPCs with random movement */}
        {npcs.map(npc => (
          <NPC 
            key={npc.id}
            position={npc.position} 
            navMeshRef={navMeshRef} 
            color={npc.color}
            speed={npc.speed}
            randomMovement={true}
          />
        ))}
        
        {/* Obstacles */}
        {createObstacle([0, 1, 0], [4, 2, 4], 'darkgray')}
        {createObstacle([-6, 1, 6], [2, 2, 2], 'darkgray')}
        {createObstacle([6, 1, -6], [2, 2, 2], 'darkgray')}
        
        {/* Ground - clickable to set NPC destination */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
          onClick={handleGroundClick}
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        {/* Debug Grid */}
        {debug && <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />}
      </group>
    </>
  )
}

export default Scene
