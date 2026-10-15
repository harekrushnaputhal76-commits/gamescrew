/**
 * js/graphics.js
 * Three.js WebGL Renderer, Studio Environment, Procedural PBR Scrap Iron & 3D Extruded Geometry
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class GraphicsEngine {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = new THREE.Scene();

        // Camera setup optimized for Portrait Mobile & Desktop
        this.camera = new THREE.PerspectiveCamera(
            42,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.updateCameraHomePosition();

        // High-Dynamic-Range WebGL Renderer with Soft Shadows
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // Procedural Studio HDRI Environment for realistic metallic reflections
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

        // Orbit Controls (constrained so player never gets lost behind the workbench)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.07;
        this.controls.enablePan = false;
        this.controls.minDistance = 9;
        this.controls.maxDistance = 24;
        this.controls.minPolarAngle = Math.PI * 0.32;
        this.controls.maxPolarAngle = Math.PI * 0.68;
        this.controls.minAzimuthAngle = -Math.PI * 0.25;
        this.controls.maxAzimuthAngle = Math.PI * 0.25;

        this.particles = [];

        this.initProceduralTextures();
        this.initMaterials();
        this.initLights();
        this.initWorkbenchBackdrop();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Automatically adjusts camera distance for tall mobile portrait screens vs wide desktops.
     */
    updateCameraHomePosition() {
        const aspect = window.innerWidth / window.innerHeight;
        this.homeZ = aspect < 0.75 ? 17.5 : aspect < 1.1 ? 15.0 : 13.0;
        this.camera.position.set(0, 0.4, this.homeZ);
    }

    resetCamera() {
        this.updateCameraHomePosition();
        this.camera.position.set(0, 0.4, this.homeZ);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    /**
     * Generates procedural scratched metal and rusted pit bump/roughness textures on an HTML5 Canvas.
     */
    initProceduralTextures() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base mid-grey
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, 256, 256);

        // Add industrial surface pitting & oil speckles
        for (let i = 0; i < 3500; i++) {
            const shade = 90 + Math.floor(Math.random() * 110);
            ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }

        // Add workshop grinder & wrench scratch lines
        for (let i = 0; i < 90; i++) {
            ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(235,235,235,0.28)' : 'rgba(30,30,30,0.35)';
            ctx.lineWidth = 0.6 + Math.random() * 1.4;
            ctx.beginPath();
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const len = 18 + Math.random() * 55;
            const ang = (Math.random() - 0.5) * 0.8;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            ctx.stroke();
        }

        this.scrapBumpTexture = new THREE.CanvasTexture(canvas);
        this.scrapBumpTexture.wrapS = THREE.RepeatWrapping;
        this.scrapBumpTexture.wrapT = THREE.RepeatWrapping;
        this.scrapBumpTexture.repeat.set(2, 2);
    }

    /**
     * Creates realistic Indian Garage PBR Materials (Cast Iron, Oxidized Rust, Brass, Painted Bajaj Blue/Green).
     */
    initMaterials() {
        const platePalettes = [
            { name: 'rustedIron', color: 0x9a4b26, metalness: 0.82, roughness: 0.58 },
            { name: 'weatheredTeal', color: 0x3b6e75, metalness: 0.78, roughness: 0.48 },
            { name: 'castSteel', color: 0x646d75, metalness: 0.88, roughness: 0.42 },
            { name: 'vintageOchre', color: 0xc27d28, metalness: 0.80, roughness: 0.50 },
            { name: 'oliveChassis', color: 0x556b3e, metalness: 0.76, roughness: 0.52 }
        ];

        this.plateMaterials = platePalettes.map((p) => new THREE.MeshStandardMaterial({
            color: p.color,
            metalness: p.metalness,
            roughness: p.roughness,
            bumpMap: this.scrapBumpTexture,
            bumpScale: 0.025,
            roughnessMap: this.scrapBumpTexture
        }));

        // Polished Brass & Chrome Steel for Standard Bolts
        this.brassBoltMat = new THREE.MeshStandardMaterial({
            color: 0xf5b027,
            metalness: 0.95,
            roughness: 0.22,
            bumpMap: this.scrapBumpTexture,
            bumpScale: 0.008
        });

        this.steelFlangeMat = new THREE.MeshStandardMaterial({
            color: 0xd4dce6,
            metalness: 0.92,
            roughness: 0.28
        });

        // Heavy Corroded Rust Material for 2-Tap Rusted Bolts
        this.rustedBoltMat = new THREE.MeshStandardMaterial({
            color: 0x8c3819,
            metalness: 0.65,
            roughness: 0.78,
            bumpMap: this.scrapBumpTexture,
            bumpScale: 0.04
        });
    }

    /**
     * Configures realistic three-point garage lighting with high-res shadow casting.
     */
    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffeedd, 0.55);
        this.scene.add(ambientLight);

        // Warm overhead mechanic shop lamp (casts dynamic shadows between overlapping plates)
        this.keyLight = new THREE.DirectionalLight(0xfff3db, 2.2);
        this.keyLight.position.set(4.5, 8.5, 11.0);
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 2048;
        this.keyLight.shadow.mapSize.height = 2048;
        this.keyLight.shadow.camera.near = 2;
        this.keyLight.shadow.camera.far = 28;
        const d = 7.5;
        this.keyLight.shadow.camera.left = -d;
        this.keyLight.shadow.camera.right = d;
        this.keyLight.shadow.camera.top = d;
        this.keyLight.shadow.camera.bottom = -d;
        this.keyLight.shadow.bias = -0.0008;
        this.scene.add(this.keyLight);

        // Cool workshop doorway rim light
        const rimLight = new THREE.DirectionalLight(0x7aa2f7, 0.85);
        rimLight.position.set(-7, -4, 6);
        this.scene.add(rimLight);
    }

    /**
     * Builds the 3D Industrial Pegboard Workbench backdrop that receives shadows.
     */
    initWorkbenchBackdrop() {
        const boardGroup = new THREE.Group();

        // Main dark oiled metal pegboard
        const boardGeo = new THREE.BoxGeometry(10.5, 13.5, 0.5);
        const boardMat = new THREE.MeshStandardMaterial({
            color: 0x221e1a,
            metalness: 0.55,
            roughness: 0.72,
            bumpMap: this.scrapBumpTexture,
            bumpScale: 0.015
        });
        const boardMesh = new THREE.Mesh(boardGeo, boardMat);
        boardMesh.position.set(0, 0, -0.38);
        boardMesh.receiveShadow = true;
        boardGroup.add(boardMesh);

        // Heavy welded angle-iron frame border
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x3b3229,
            metalness: 0.8,
            roughness: 0.45
        });

        const topBar = new THREE.Mesh(new THREE.BoxGeometry(10.9, 0.45, 0.75), frameMat);
        topBar.position.set(0, 6.75, -0.32);
        topBar.receiveShadow = true;
        boardGroup.add(topBar);

        const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 13.8, 0.75), frameMat);
        leftBar.position.set(-5.25, 0, -0.32);
        boardGroup.add(leftBar);

        const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 13.8, 0.75), frameMat);
        rightBar.position.set(5.25, 0, -0.32);
        boardGroup.add(rightBar);

        this.scene.add(boardGroup);
    }

    /**
     * Procedurally generates a 3D Extruded Metal Plate with genuine through-holes at `localHoles`.
     * @param {Object} plateDef { width, height, depth, localHoles: [{x, y}], materialIndex }
     */
    createExtrudedPlateMesh(plateDef) {
        const { width, height, depth, localHoles = [], materialIndex = 0 } = plateDef;
        const bevel = 0.045;
        const w = width - bevel * 2;
        const h = height - bevel * 2;
        const r = Math.min(w, h) * 0.42; // Rounded ends like real mechanical brackets

        const shape = new THREE.Shape();
        const hw = w / 2;
        const hh = h / 2;

        // Draw rounded-corner rectangle path centered at (0,0)
        shape.moveTo(-hw + r, -hh);
        shape.lineTo(hw - r, -hh);
        shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
        shape.lineTo(hw, hh - r);
        shape.quadraticCurveTo(hw, hh, hw - r, hh);
        shape.lineTo(-hw + r, hh);
        shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
        shape.lineTo(-hw, -hh + r);
        shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

        // Punch circular bolt holes through the 3D plate
        const holeRadius = 0.34;
        for (const hole of localHoles) {
            const holePath = new THREE.Path();
            holePath.absarc(hole.x, hole.y, holeRadius, 0, Math.PI * 2, true);
            shape.holes.push(holePath);
        }

        const extrudeSettings = {
            depth: depth - bevel * 2,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: bevel,
            bevelThickness: bevel
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Center the extruded geometry on the Z axis so it aligns with Cannon-es Box center
        geometry.translate(0, 0, -(depth - bevel * 2) * 0.5);

        const material = this.plateMaterials[materialIndex % this.plateMaterials.length];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
        return mesh;
    }

    /**
     * Creates a detailed 3D Hex Bolt + Washer + Threaded Shaft assembly.
     */
    createBoltMesh(boltDef) {
        const { x, y, maxZ, rusted = false } = boltDef;
        const boltGroup = new THREE.Group();

        const headMat = rusted ? this.rustedBoltMat.clone() : this.brassBoltMat.clone();
        const washerMat = rusted ? this.rustedBoltMat : this.steelFlangeMat;

        // 1. Wide Steel Washer Collar
        const washerGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24);
        washerGeo.rotateX(Math.PI / 2);
        const washerMesh = new THREE.Mesh(washerGeo, washerMat);
        washerMesh.castShadow = true;
        washerMesh.receiveShadow = true;
        boltGroup.add(washerMesh);

        // 2. 6-Sided Hex Nut/Bolt Head
        const hexGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.26, 6);
        hexGeo.rotateX(Math.PI / 2);
        const hexMesh = new THREE.Mesh(hexGeo, headMat);
        hexMesh.position.z = 0.15;
        hexMesh.castShadow = true;
        hexMesh.receiveShadow = true;
        boltGroup.add(hexMesh);

        // 3. Stamped Socket Cap Ring on top of the Hex Head
        const capGeo = new THREE.CylinderGeometry(0.20, 0.23, 0.06, 16);
        capGeo.rotateX(Math.PI / 2);
        const capMesh = new THREE.Mesh(capGeo, washerMat);
        capMesh.position.z = 0.29;
        boltGroup.add(capMesh);

        // 4. Long Threaded Shaft reaching into the pegboard wall
        const shaftLength = maxZ + 0.65;
        const shaftGeo = new THREE.CylinderGeometry(0.22, 0.22, shaftLength, 16);
        shaftGeo.rotateX(Math.PI / 2);
        const shaftMesh = new THREE.Mesh(shaftGeo, this.steelFlangeMat);
        shaftMesh.position.z = -shaftLength * 0.5;
        boltGroup.add(shaftMesh);

        boltGroup.position.set(x, y, maxZ + 0.14);
        boltGroup.userData.headMaterial = headMat;

        this.scene.add(boltGroup);
        return boltGroup;
    }

    /**
     * Converts a Rusted Bolt's visual appearance to shiny oiled brass after WD-40 spray or first tap.
     */
    polishRustedBolt(boltMesh) {
        const mat = boltMesh.userData.headMaterial;
        if (mat) {
            mat.color.setHex(0xf5b027);
            mat.roughness = 0.22;
            mat.metalness = 0.95;
        }
    }

    /**
     * Spawns a burst of metallic sparks/rust particles when a bolt is unscrewed or loosened.
     */
    spawnSparks(worldPos, colorHex = 0xfbbf24, count = 14) {
        const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const mat = new THREE.MeshBasicMaterial({ color: colorHex });

        for (let i = 0; i < count; i++) {
            const spark = new THREE.Mesh(geo, mat);
            spark.position.copy(worldPos);
            spark.position.z += 0.25;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.8 + Math.random() * 3.5;
            this.scene.add(spark);

            this.particles.push({
                mesh: spark,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 1.2,
                vz: 1.5 + Math.random() * 2.5,
                life: 0.45 + Math.random() * 0.25
            });
        }
    }

    /**
     * Updates active particle bursts and OrbitControls damping each frame.
     */
    updateAndRender(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            p.vy -= 12.0 * dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.mesh.rotation.x += 8 * dt;
            p.mesh.rotation.y += 8 * dt;
            p.mesh.scale.setScalar(Math.max(0.01, p.life * 2));
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}