import React, { useEffect, useRef, ForwardedRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { NavMeshProps, NavMeshRef } from "../../types";
import { theme } from "../../styles/theme";

// NavMesh component that uses a GLTF model for the navmesh
const NavMesh = React.forwardRef<NavMeshRef, NavMeshProps>(
  ({ debug = false, handleClick }, ref) => {
    const { scene } = useThree();
    const navMeshRef = useRef<THREE.Mesh | null>(null);
    const obstaclesRef = useRef<THREE.Object3D[]>([]);

    // Load the Walmart navmesh model
    const { scene: navMeshModel } = useGLTF("/walmart_navmesh_v2.glb");
    const [navMesh, setNavMesh] = useState<THREE.Mesh>(new THREE.Mesh());

    // Set up the navmesh
    useEffect(() => {
      try {
        // Clone the loaded navmesh model
        const navMeshClone = navMeshModel.clone();

        // Find the mesh in the model
        let navMesh: THREE.Mesh | null = null;
        navMeshClone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // This is our navmesh
            navMesh = child;
          }
        });

        if (navMesh) {
          // Position the navmesh appropriately
          // (navMesh as THREE.Mesh).position.y = 0.01; // Slightly above ground to avoid z-fighting
          // (navMesh as THREE.Mesh).name = 'navmesh';

          // Add the navmesh to the scene
          navMeshRef.current = navMesh;
          setNavMesh(navMesh);
        } else {
          console.error("No mesh found in the navmesh model");
        }

        // Find obstacles in the scene
        scene.traverse((object) => {
          if (object.userData && object.userData.isObstacle) {
            obstaclesRef.current.push(object);
          }
        });

        console.log("NavMesh initialized successfully");
      } catch (error) {
        console.error("Error initializing NavMesh:", error);
      }

      return () => {
        // Clean up
        if (navMeshRef.current) {
          // scene.remove(navMeshRef.current);
        }
      };
    }, [scene, debug]);

    const getNavmesh = () => {
      return navMeshRef.current;
    };

    // Simple function to find a path between two points
    // This is a very basic implementation that just returns a direct path
    // In a real application, you would implement A* or another pathfinding algorithm
    const findPath = (
      startPoint: THREE.Vector3,
      endPoint: THREE.Vector3
    ): THREE.Vector3[] | null => {
      try {
        console.log("Finding path from", startPoint, "to", endPoint);

        // Create a direct path from start to end
        // In a real application, you would check for obstacles and create waypoints
        const path = [
          new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
          new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
        ];

        return path;
      } catch (error) {
        console.error("Error in findPath:", error);
        return null;
      }
    };

    // Expose the findPath function to the parent component
    React.useImperativeHandle(ref, () => ({
      findPath,
      getNavmesh,
    }));

    return (
      <>
        {navMesh ? (
          <mesh
            // ref={ref}
            geometry={navMesh.geometry}
            onClick={e => handleClick?.(e)}
            // onPointerDown={onPointerDown}
            // onPointerUp={onPointerUp}
          >
            <meshBasicMaterial
              color={"white"}
              wireframe={false}
              opacity={0.1}
              transparent={true}
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : null}
      </>
    );
  }
);

// Preload the navmesh model
useGLTF.preload("/walmart_navmesh_v1.glb");

export default NavMesh;
