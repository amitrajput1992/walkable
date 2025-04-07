import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

// Simple NavMesh component that doesn't rely on three-pathfinding
const NavMesh = React.forwardRef(({ debug = false }, ref) => {
  const { scene } = useThree()
  const navMeshRef = useRef()
  const obstaclesRef = useRef([])
  
  // Create a simple navmesh for demonstration
  useEffect(() => {
    try {
      // Create a simple flat plane for the navmesh
      const width = 20
      const height = 20
      
      // Create a simple geometry for visualization
      const navMeshGeometry = new THREE.PlaneGeometry(width, height, 1, 1)
      navMeshGeometry.rotateX(-Math.PI / 2) // Make it flat on the ground
      
      // Create a material for the navmesh - visible only in debug mode
      const material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
        opacity: 0.2,
        transparent: true,
        visible: debug
      })
      
      // Create the navmesh visualization
      const navMesh = new THREE.Mesh(navMeshGeometry, material)
      navMesh.position.y = 0.01 // Slightly above ground to avoid z-fighting
      navMesh.name = 'navmesh'
      
      // Add the navmesh to the scene
      navMeshRef.current = navMesh
      scene.add(navMesh)
      
      // Find obstacles in the scene
      scene.traverse((object) => {
        if (object.userData && object.userData.isObstacle) {
          obstaclesRef.current.push(object)
        }
      })
      
      console.log('NavMesh initialized successfully')
    } catch (error) {
      console.error('Error initializing NavMesh:', error)
    }
    
    return () => {
      // Clean up
      if (navMeshRef.current) {
        scene.remove(navMeshRef.current)
      }
    }
  }, [scene, debug])
  
  // Simple function to find a path between two points
  // This is a very basic implementation that just returns a direct path
  // In a real application, you would implement A* or another pathfinding algorithm
  const findPath = (startPoint, endPoint) => {
    try {
      console.log('Finding path from', startPoint, 'to', endPoint)
      
      // Create a direct path from start to end
      // In a real application, you would check for obstacles and create waypoints
      const path = [
        new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
        new THREE.Vector3(endPoint.x, 0.5, endPoint.z)
      ]
      
      return path
    } catch (error) {
      console.error('Error in findPath:', error)
      return null
    }
  }
  
  // Expose the findPath function to the parent component
  React.useImperativeHandle(ref, () => ({
    findPath
  }))
  
  return null // This component doesn't render anything visible by default
})

export default NavMesh
