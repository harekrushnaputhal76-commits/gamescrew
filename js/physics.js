/**
 * js/physics.js
 * Cannon-es 3D Physics World, Rigid Body Factory, and HingeConstraint Manager
 */

import * as CANNON from 'cannon-es';

export class PhysicsEngine {
    constructor(onMetalImpactCallback = null) {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -24.0, 0); // Heavy, snappy workshop gravity
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = false; // Keep bodies responsive when constraints break
        this.world.solver.iterations = 20;
        this.world.solver.tolerance = 0.0005;

        this.onMetalImpact = onMetalImpactCallback;

        // Physics Materials
        this.ironMaterial = new CANNON.Material('scrapIron');
        this.boardMaterial = new CANNON.Material('workbenchBoard');

        const ironOnIron = new CANNON.ContactMaterial(this.ironMaterial, this.ironMaterial, {
            friction: 0.25,
            restitution: 0.32,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 3
        });

        const ironOnBoard = new CANNON.ContactMaterial(this.ironMaterial, this.boardMaterial, {
            friction: 0.12,
            restitution: 0.15
        });

        this.world.addContactMaterial(ironOnIron);
        this.world.addContactMaterial(ironOnBoard);

        // Static Anchor Body (The Pegboard Wall)
        this.anchorBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            material: this.boardMaterial,
            collisionFilterGroup: 1,
            collisionFilterMask: -1
        });
        // Back wall plane so falling plates don't clip through the pegboard
        const wallShape = new CANNON.Box(new CANNON.Vec3(25, 25, 0.5));
        this.anchorBody.addShape(wallShape, new CANNON.Vec3(0, 0, -0.6));
        this.world.addBody(this.anchorBody);

        this.plateBodies = new Map();
        this.constraints = new Map();
    }

    /**
     * Creates a 3D RigidBody for an iron plate with mass, rotation, and layer collision filtering.
     */
    createPlateBody(plateDef) {
        const { id, width, height, depth, x, y, z, angle = 0, layerIndex = 0, mass = 3.5 } = plateDef;

        const halfExtents = new CANNON.Vec3(width * 0.48, height * 0.48, depth * 0.5);
        const boxShape = new CANNON.Box(halfExtents);

        // Bitmask per Z-layer so plates on the same depth layer collide with each other
        // and all plates collide with the back wall (group 1)
        const layerGroup = 1 << (layerIndex + 1);
        const layerMask = 1 | layerGroup;

        const body = new CANNON.Body({
            mass,
            material: this.ironMaterial,
            linearDamping: 0.04,
            angularDamping: 0.06,
            collisionFilterGroup: layerGroup,
            collisionFilterMask: layerMask
        });

        body.addShape(boxShape);
        body.position.set(x, y, z);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), angle);

        // Listen for physical collisions to trigger metallic clang audio
        let lastSoundTime = 0;
        body.addEventListener('collide', (event) => {
            if (!this.onMetalImpact) return;
            const now = performance.now();
            if (now - lastSoundTime < 90) return;

            const impactVelocity = Math.abs(event.contact.getImpactVelocityAlongNormal());
            if (impactVelocity > 1.8) {
                lastSoundTime = now;
                this.onMetalImpact(Math.min(1.0, impactVelocity / 14));
            }
        });

        this.world.addBody(body);
        this.plateBodies.set(id, body);
        return body;
    }

    /**
     * Connects a plate to the static workbench at world coordinates (wx, wy)
     * using a Z-axis HingeConstraint so the plate can pivot around a single bolt.
     */
    attachBoltHinge(constraintId, plateBody, worldX, worldY, plateZ) {
        const worldAnchor = new CANNON.Vec3(worldX, worldY, plateZ);
        const localPivotOnPlate = new CANNON.Vec3();
        plateBody.pointToLocalFrame(worldAnchor, localPivotOnPlate);

        const pivotOnBoard = new CANNON.Vec3(worldX, worldY, plateZ);
        const zAxis = new CANNON.Vec3(0, 0, 1);

        const hinge = new CANNON.HingeConstraint(this.anchorBody, plateBody, {
            pivotA: pivotOnBoard,
            axisA: zAxis,
            pivotB: localPivotOnPlate,
            axisB: zAxis,
            collideConnected: false
        });

        this.world.addConstraint(hinge);
        this.constraints.set(constraintId, {
            constraint: hinge,
            plateBody
        });

        return hinge;
    }

    /**
     * Destroys all physics constraints associated with an extracted bolt and wakes connected plates.
     */
    removeBoltConstraints(constraintIds = []) {
        for (const cid of constraintIds) {
            const entry = this.constraints.get(cid);
            if (entry) {
                this.world.removeConstraint(entry.constraint);
                entry.plateBody.wakeUp();
                // Apply a tiny micro-impulse so balanced vertical plates naturally tip and swing
                entry.plateBody.angularVelocity.z += (Math.random() - 0.5) * 0.35;
                this.constraints.delete(cid);
            }
        }
    }

    /**
     * Advances the physics simulation with fixed substeps for stable constraint solving.
     */
    step(deltaSeconds) {
        const clampedDelta = Math.min(deltaSeconds, 0.05);
        this.world.step(1 / 60, clampedDelta, 4);
    }

    /**
     * Clears all dynamic plate bodies and constraints when resetting or changing levels.
     */
    clearDynamicWorld() {
        for (const { constraint } of this.constraints.values()) {
            this.world.removeConstraint(constraint);
        }
        this.constraints.clear();

        for (const body of this.plateBodies.values()) {
            this.world.removeBody(body);
        }
        this.plateBodies.clear();
    }
}