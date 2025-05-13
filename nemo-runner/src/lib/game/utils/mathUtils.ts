import * as THREE from 'three';

/**
 * Generates a random point within a sphere of the given radius
 * @param radius The radius of the sphere
 * @returns A Vector3 representing a random point within the sphere
 */
export function randomPointInSphere(radius: number): THREE.Vector3 {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * radius; // Distribute points evenly within sphere volume
    const sinPhi = Math.sin(phi);
    const x = r * sinPhi * Math.cos(theta);
    const y = r * sinPhi * Math.sin(theta);
    const z = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}