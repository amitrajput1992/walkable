import React, { useRef } from 'react';
import * as THREE from 'three';
import { ModelProps } from '../../types';
import { useGLTF } from '@react-three/drei';

// This is a placeholder component for a 3D model
// You can replace this with your actual model loader
// const Model: React.FC<ModelProps> = ({ position = [0, 0, 0], ...props }) => {
//   const meshRef = useRef<THREE.Mesh>(null);
  
//   // For now, we'll create a simple box as a placeholder
//   // Later you can replace this with useGLTF to load a real model
//   return (
//     <mesh
//       ref={meshRef}
//       position={position}
//       castShadow
//       receiveShadow
//       {...props}
//     >
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color="orange" />
//     </mesh>
//   );
// };

// When you have a GLTF model, you can use this instead:

const Model = ({ position = [0, 0, 0], ...props }) => {
  const { scene } = useGLTF('/WM_v02-1743503169457-v1.glb')
  const modelRef = useRef<THREE.Group>(null)

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
useGLTF.preload('/WM_v02-1743503169457-v1.glb')


export default Model;