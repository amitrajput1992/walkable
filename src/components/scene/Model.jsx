import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// This is a placeholder component for a 3D model
// You can replace this with your actual model loader
const Model = ({ position = [0, 0, 0], ...props }) => {
  const meshRef = useRef()
  
  // For now, we'll create a simple box as a placeholder
  // Later you can replace this with useGLTF to load a real model
  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      {...props}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

export default Model

// When you have a GLTF model, you can use this instead:
/*
const Model = ({ position = [0, 0, 0], ...props }) => {
  const { scene } = useGLTF('/path/to/your/model.glb')
  const modelRef = useRef()

  // Clone the loaded model scene
  const clone = React.useMemo(() => {
    return scene.clone()
  }, [scene])

  return (
    <primitive 
      ref={modelRef}
      object={clone} 
      position={position}
      {...props} 
    />
  )
}

// Preload the model
useGLTF.preload('/path/to/your/model.glb')
*/
