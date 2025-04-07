import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { NavMeshProps, NavMeshRef } from "../../types";
// @ts-ignore - three-pathfinding doesn't have proper TypeScript definitions
import * as ThreePathfinding from "three-pathfinding";

// NavMesh component that uses a GLTF model for the navmesh
const NavMesh = React.forwardRef<NavMeshRef, NavMeshProps>(
  ({ debug = false, handleClick }, ref) => {
    const { scene } = useThree();
    const navMeshRef = useRef<THREE.Mesh | null>(null);
    const obstaclesRef = useRef<THREE.Object3D[]>([]);
    // @ts-ignore - using any type to avoid TypeScript errors with the library
    const pathfindingRef = useRef<any>(new ThreePathfinding.Pathfinding());
    const zoneIdRef = useRef<string>("level");
    // @ts-ignore
    const pathfindingHelperRef = useRef<any>(null);
    const debugHelpersRef = useRef<THREE.Object3D[]>([]);
    const [navMeshBounds, setNavMeshBounds] = useState<{
      min: THREE.Vector3;
      max: THREE.Vector3;
      center: THREE.Vector3;
      size: THREE.Vector3;
    } | null>(null);

    // Load the Walmart navmesh model
    const { scene: navMeshModel } = useGLTF("/walmart_navmesh_v3.glb");
    const [navMesh, setNavMesh] = useState<THREE.Mesh | null>(null);

    // Create debug helpers
    const createDebugHelpers = () => {
      if (!navMeshRef.current || !debug) return;
      
      const mesh = navMeshRef.current;
      if (!mesh.geometry) {
        console.error("Mesh does not have geometry for debug helpers");
        return;
      }
      
      // Create a wireframe helper for the navmesh
      const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
      const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
      const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
      wireframe.position.copy(mesh.position);
      wireframe.rotation.copy(mesh.rotation);
      wireframe.scale.copy(mesh.scale);
      
      // Add the wireframe to the scene
      scene.add(wireframe);
      
      // Store the wireframe for cleanup
      debugHelpersRef.current.push(wireframe);
    };
    
    // Get the navmesh reference
    const getNavmesh = () => {
      return navMeshRef.current;
    };
    
    // Get the navmesh bounds
    const getNavMeshBounds = () => {
      return navMeshBounds;
    };
    
    // Check if a point is within the navmesh bounds
    const isPointInNavMesh = (point: THREE.Vector3): boolean => {
      if (!navMeshBounds) return false;
      
      const { min, max } = navMeshBounds;
      
      // Check if the point is within the XZ bounds of the navmesh
      if (point.x < min.x || point.x > max.x || point.z < min.z || point.z > max.z) {
        return false;
      }
      
      // For more accurate checking, we can use the pathfinding system
      try {
        if (!pathfindingRef.current) return false;
        
        // Try to get the group ID for this point
        const groupID = pathfindingRef.current.getGroup(zoneIdRef.current, point);
        if (!groupID) return false;
        
        // Try to get the closest node
        const closestNode = pathfindingRef.current.getClosestNode(
          point,
          zoneIdRef.current,
          groupID
        );
        
        // If we found a node and it's close enough, the point is on the navmesh
        if (closestNode) {
          const distance = point.distanceTo(closestNode.centroid);
          return distance < 5; // Consider points within 5 units to be "on" the navmesh
        }
        
        return false;
      } catch (error) {
        console.error("Error checking if point is in navmesh:", error);
        return false;
      }
    };

    // Find a path between two points using three-pathfinding
    const findPath = (
      startPoint: THREE.Vector3,
      endPoint: THREE.Vector3
    ): THREE.Vector3[] | null => {
      try {
        // Check if points are valid
        if (!startPoint || !endPoint) {
          console.error("Invalid points provided to findPath:", { startPoint, endPoint });
          return null;
        }
        
        // Check if points are within navmesh bounds
        const startInBounds = isPointInNavMesh(startPoint);
        const endInBounds = isPointInNavMesh(endPoint);
        
        if (!startInBounds || !endInBounds) {
          console.warn("Points outside navmesh bounds:", { 
            startPoint, 
            endPoint, 
            startInBounds, 
            endInBounds 
          });
          
          // If start point is outside bounds, we need to find a valid start point
          let validStartPoint = startPoint.clone();
          let validEndPoint = endPoint.clone();
          
          if (!startInBounds && navMeshBounds) {
            // Clamp start point to navmesh bounds
            validStartPoint.x = Math.max(navMeshBounds.min.x, Math.min(navMeshBounds.max.x, startPoint.x));
            validStartPoint.z = Math.max(navMeshBounds.min.z, Math.min(navMeshBounds.max.z, startPoint.z));
            validStartPoint.y = 0.5; // Keep consistent Y value
          }
          
          if (!endInBounds && navMeshBounds) {
            // Clamp end point to navmesh bounds
            validEndPoint.x = Math.max(navMeshBounds.min.x, Math.min(navMeshBounds.max.x, endPoint.x));
            validEndPoint.z = Math.max(navMeshBounds.min.z, Math.min(navMeshBounds.max.z, endPoint.z));
            validEndPoint.y = 0.5; // Keep consistent Y value
          }
          
          // Use the clamped points
          startPoint = validStartPoint;
          endPoint = validEndPoint;
          
          console.log("Using clamped points:", { startPoint, endPoint });
        }
        
        // Check if pathfinding is initialized
        if (!pathfindingRef.current) {
          console.warn("Pathfinding not initialized yet");
          // Fallback to direct path
          return [
            new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
            new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
          ];
        }
        
        // Get the closest node on the navmesh for start and end points
        const pathfinding = pathfindingRef.current;
        
        // Try to get the group ID
        let groupID;
        try {
          groupID = pathfinding.getGroup(zoneIdRef.current, endPoint);
          if (!groupID) {
            console.warn("Could not find group ID for the given point");
            // Fallback to direct path
            return [
              new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
              new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
            ];
          }
        } catch (error) {
          console.error("Error getting group ID:", error);
          // Fallback to direct path
          return [
            new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
            new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
          ];
        }
        
        // Find closest node for start position
        // @ts-ignore - using the library's API
        const closestStartNode = pathfinding.getClosestNode(
          startPoint,
          zoneIdRef.current,
          groupID
        );
        
        // Find closest node for end position
        // @ts-ignore - using the library's API
        const closestEndNode = pathfinding.getClosestNode(
          endPoint,
          zoneIdRef.current,
          groupID
        );
        
        if (!closestStartNode || !closestEndNode) {
          console.warn("Could not find valid nodes on navmesh");
          // Fallback to direct path
          return [
            new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
            new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
          ];
        }
        
        // Calculate path
        const calculatedPath = pathfinding.findPath(
          closestStartNode.centroid,
          closestEndNode.centroid,
          zoneIdRef.current,
          groupID
        );
        
        // If no path found, return direct path
        if (!calculatedPath || calculatedPath.length === 0) {
          console.warn("No path found, using direct path");
          return [
            new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
            new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
          ];
        }
        
        // Convert the path to Vector3 array
        const path: THREE.Vector3[] = [];
        for (const point of calculatedPath) {
          path.push(new THREE.Vector3(point.x, 0.5, point.z));
        }
        
        // Add the end point to ensure we reach the exact destination
        path.push(new THREE.Vector3(endPoint.x, 0.5, endPoint.z));
        
        // Visualize the path if in debug mode
        if (debug && pathfindingHelperRef.current) {
          // @ts-ignore - using the library's API
          pathfindingHelperRef.current.reset();
          // @ts-ignore - using the library's API
          pathfindingHelperRef.current.setPath(path);
        }
        
        return path;
      } catch (error) {
        console.error("Error in findPath:", error);
        // Fallback to direct path in case of error
        return [
          new THREE.Vector3(startPoint.x, 0.5, startPoint.z),
          new THREE.Vector3(endPoint.x, 0.5, endPoint.z),
        ];
      }
    };

    // Set up the navmesh
    useEffect(() => {
      try {
        // Clone the loaded navmesh model
        const navMeshClone = navMeshModel.clone();

        // Find the mesh in the model
        let navMeshObject: THREE.Mesh | null = null;
        navMeshClone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // This is our navmesh
            navMeshObject = child;
            // Ensure the mesh has a name for debugging
            if (!navMeshObject.name) navMeshObject.name = 'NavMesh';
          }
        });

        if (navMeshObject) {
          // Position the navmesh appropriately
          (navMeshObject as THREE.Mesh).visible = debug; // Only visible in debug mode

          // Add the navmesh to the scene
          navMeshRef.current = navMeshObject;
          setNavMesh(navMeshObject);
          
          // Calculate the bounds of the navmesh
          if ((navMeshObject as THREE.Mesh).geometry) {
            (navMeshObject as THREE.Mesh).geometry.computeBoundingBox();
            const boundingBox = (navMeshObject as THREE.Mesh).geometry.boundingBox;
            
            if (boundingBox) {
              const min = boundingBox.min.clone();
              const max = boundingBox.max.clone();
              const center = new THREE.Vector3();
              boundingBox.getCenter(center);
              const size = new THREE.Vector3();
              boundingBox.getSize(size);
              
              // Store the bounds for external access
              const bounds = { min, max, center, size };
              setNavMeshBounds(bounds);
              console.log("NavMesh bounds calculated:", bounds);
            }
          }
          
          // Initialize the pathfinding with the navmesh
          try {
            // Create zone from the navmesh geometry
            if ((navMeshObject as THREE.Mesh).geometry) {
              const geometry = (navMeshObject as THREE.Mesh).geometry.clone();
              
              // Create the pathfinding zone
              // @ts-ignore - using the library's API
              const zone = ThreePathfinding.Pathfinding.createZone(geometry);
              
              // Set the zone ID explicitly
              zoneIdRef.current = "level";
              
              // Initialize the pathfinding instance
              // @ts-ignore - using the library's API
              pathfindingRef.current.setZoneData(zoneIdRef.current, zone);
              
              // Create a helper for debugging if needed
              if (debug) {
                // @ts-ignore - using the library's API
                pathfindingHelperRef.current = new ThreePathfinding.PathfindingHelper();
                scene.add(pathfindingHelperRef.current);
              }
              
              console.log("Pathfinding initialized successfully");
            }
          } catch (error) {
            console.error("Error initializing pathfinding:", error);
          }
        } else {
          console.error("No mesh found in the navmesh model");
        }

        // Find obstacles in the scene
        scene.traverse((object) => {
          if (object.userData && object.userData.isObstacle) {
            obstaclesRef.current.push(object);
          }
        });

        // Create debug helpers if needed
        if (debug && navMeshRef.current) {
          createDebugHelpers();
        }

        console.log("NavMesh initialized successfully");
      } catch (error) {
        console.error("Error initializing NavMesh:", error);
      }

      return () => {
        // Clean up debug helpers
        debugHelpersRef.current.forEach((helper) => {
          scene.remove(helper);
        });
        
        // Clean up pathfinding helper
        if (pathfindingHelperRef.current) {
          scene.remove(pathfindingHelperRef.current);
        }
      };
    }, [scene, debug, navMeshModel]);
    
    // Expose the findPath function and bounds to the parent component
    React.useImperativeHandle(ref, () => ({
      findPath,
      getNavmesh,
      getNavMeshBounds,
      isPointInNavMesh,
    }));
    
    return (
      <group>
        {/* The navmesh is invisible but used for pathfinding */}
        {navMesh && (
          <primitive 
            object={navMesh} 
            visible={debug} 
            onClick={handleClick}
          />
        )}
      </group>
    );
  }
);

// Preload the navmesh model
useGLTF.preload("/walmart_navmesh_v3.glb");

export default NavMesh;
