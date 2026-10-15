/**
 * js/game.js
 * Main Game Loop, Raycaster Unscrew Mechanics, Web Audio Synthesizer, Level Blueprints & Cloud Hooks
 */

import * as THREE from 'three';
import { PhysicsEngine } from './physics.js';
import { GraphicsEngine } from './graphics.js';

/* ==========================================================================
   1. Procedural Web Audio Mechanical Sound Synthesizer & Android Haptics
   ========================================================================== */
class WorkshopAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    vibrate(pattern) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (_) { /* ignore on unsupported browsers */ }
        }
    }

    playRatchetUnscrew() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // 4 rapid metallic ratchet clicks ascending in pitch
        [0, 0.055, 0.11, 0.165].forEach((offset, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520 + idx * 140, this.ctx.currentTime + offset);
            osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + offset + 0.045);

            gain.gain.setValueAtTime(0.18, this.ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.045);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + offset);
            osc.stop(this.ctx.currentTime + offset + 0.05);
        });
    }

    playBlockedClink() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(95, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.14);
    }

    playMetalClang(intensity = 0.5) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [290, 465, 780];
        freqs.forEach((f) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 30, now);

            gain.gain.setValueAtTime(0.08 * intensity, now);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.19);
        });
    }

    playVictoryChime() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = this.ctx.currentTime + i * 0.09;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.36);
        });
    }
}

/* ==========================================================================
   2. Future Backend / Firebase Auth & Leaderboard Service Layer
   ========================================================================== */
class BackendService {
    constructor() {
        this.storageKey = 'ustaad_mechanic_profile_v1';
        this.profile = this.loadProfile();
    }

    loadProfile() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (_) { /* ignore storage errors */ }
        return {
            uid: 'local_ustaad_' + Math.floor(1000 + Math.random() * 9000),
            name: 'You (Chief Ustaad)',
            score: 0,
            highestLevel: 1
        };
    }

    saveResult(levelNumber, addedScore) {
        this.profile.score += addedScore;
        this.profile.highestLevel = Math.max(this.profile.highestLevel, levelNumber + 1);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
        } catch (_) { /* ignore */ }
    }

    /**
     * Ready to swap with Firebase Firestore `getDocs(query(collection(db, 'leaderboards'), orderBy('score', 'desc')))`
     */
    async fetchLeaderboard() {
        const competitors = [
            { name: 'Raju Mistri (Pune)', score: 2450, self: false },
            { name: 'Babloo Diesel (Ludhiana)', score: 1890, self: false },
            { name: 'Chhotu Spanner (Indore)', score: 1320, self: false },
            { name: ' Guddu Alignment (Kanpur)', score: 780, self: false },
            { name: this.profile.name, score: this.profile.score, self: true }
        ];
        return competitors.sort((a, b) => b.score - a.score);
    }
}

/* ==========================================================================
   3. Handcrafted Multi-Layer Level Blueprints
   ========================================================================== */
const LEVEL_BLUEPRINTS = [
    // LEVEL 1: Warm-up Crossbar & Vertical Pendulum Plates
    {
        bolts: [
            { id: 'b1', x: -1.8, y: 1.5, rusted: false },
            { id: 'b2', x: 1.8, y: 1.5, rusted: false },
            { id: 'b3', x: 0.0, y: -1.6, rusted: false }
        ],
        plates: [
            { id: 'p1', p1: [-1.8, 1.5], p2: [0.0, -1.6], width: 1.15, layer: 0, mat: 0 },
            { id: 'p2', p1: [1.8, 1.5], p2: [0.0, -1.6], width: 1.15, layer: 1, mat: 1 },
            { id: 'p3', p1: [-1.8, 1.5], p2: [1.8, 1.5], width: 1.2, layer: 2, mat: 3 }
        ]
    },
    // LEVEL 2: Overlapping Z-Layer Scissors + Rusted Center Pin
    {
        bolts: [
            { id: 'b1', x: -2.0, y: 2.2, rusted: false },
            { id: 'b2', x: 2.0, y: 2.2, rusted: false },
            { id: 'b3', x: 0.0, y: 0.0, rusted: true },
            { id: 'b4', x: -1.9, y: -2.2, rusted: false },
            { id: 'b5', x: 1.9, y: -2.2, rusted: false }
        ],
        plates: [
            { id: 'p1', p1: [-2.0, 2.2], p2: [-1.9, -2.2], width: 1.1, layer: 0, mat: 2 },
            { id: 'p2', p1: [2.0, 2.2], p2: [1.9, -2.2], width: 1.1, layer: 0, mat: 2 },
            { id: 'p3', p1: [-2.0, 2.2], p2: [1.9, -2.2], width: 1.15, layer: 1, mat: 0 },
            { id: 'p4', p1: [2.0, 2.2], p2: [-1.9, -2.2], width: 1.15, layer: 2, mat: 3, extraHole: [0, 0] }
        ]
    },
    // LEVEL 3: Front Lock-Bar Occluding Rear Bolt (Requires swinging the top plate out of the way!)
    {
        bolts: [
            { id: 'b1', x: -2.1, y: 2.4, rusted: false },
            { id: 'b2', x: 2.1, y: 2.4, rusted: false },
            { id: 'b3', x: 0.0, y: 0.5, rusted: false },
            { id: 'b4', x: -1.8, y: -2.0, rusted: true },
            { id: 'b5', x: 1.8, y: -2.0, rusted: false }
        ],
        plates: [
            // Rear Y-frame plates pinned to b3
            { id: 'p1', p1: [0.0, 0.5], p2: [-1.8, -2.0], width: 1.15, layer: 0, mat: 1 },
            { id: 'p2', p1: [0.0, 0.5], p2: [1.8, -2.0], width: 1.15, layer: 1, mat: 4 },
            { id: 'p3', p1: [-1.8, -2.0], p2: [1.8, -2.0], width: 1.1, layer: 0, mat: 0 },
            // Diagonal front shield plate on Layer 2 that physically covers bolt b3 until swung!
            { id: 'p4', p1: [-2.1, 2.4], p2: [1.8, -2.0], width: 1.35, layer: 2, mat: 3 },
            { id: 'p5', p1: [-2.1, 2.4], p2: [2.1, 2.4], width: 1.15, layer: 3, mat: 2 }
        ]
    },
    // LEVEL 4: Heavy Hex Truss with Dual Rusted Pins
    {
        bolts: [
            { id: 'b1', x: 0.0, y: 2.8, rusted: true },
            { id: 'b2', x: -2.2, y: 1.0, rusted: false },
            { id: 'b3', x: 2.2, y: 1.0, rusted: false },
            { id: 'b4', x: -1.8, y: -1.8, rusted: false },
            { id: 'b5', x: 1.8, y: -1.8, rusted: true },
            { id: 'b6', x: 0.0, y: -0.4, rusted: false }
        ],
        plates: [
            { id: 'p1', p1: [0.0, 2.8], p2: [-2.2, 1.0], width: 1.1, layer: 0, mat: 0 },
            { id: 'p2', p1: [0.0, 2.8], p2: [2.2, 1.0], width: 1.1, layer: 0, mat: 0 },
            { id: 'p3', p1: [-2.2, 1.0], p2: [-1.8, -1.8], width: 1.1, layer: 1, mat: 2 },
            { id: 'p4', p1: [2.2, 1.0], p2: [1.8, -1.8], width: 1.1, layer: 1, mat: 2 },
            { id: 'p5', p1: [-2.2, 1.0], p2: [0.0, -0.4], width: 1.15, layer: 2, mat: 4 },
            { id: 'p6', p1: [2.2, 1.0], p2: [0.0, -0.4], width: 1.15, layer: 3, mat: 3 }
        ]
    }
];

/* ==========================================================================
   4. Main Game Controller
   ========================================================================== */
class UstaadMechanicGame {
    constructor() {
        this.audio = new WorkshopAudio();
        this.backend = new BackendService();

        const container = document.getElementById('canvas-container');
        this.graphics = new GraphicsEngine(container);
        this.physics = new PhysicsEngine((intensity) => {
            this.audio.playMetalClang(intensity);
        });

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.pointerDownPos = { x: 0, y: 0 };

        // Game State
        this.currentLevel = 1;
        this.score = this.backend.profile.score;
        this.plates = [];
        this.bolts = [];
        this.extractingBolts = [];
        this.levelBoltsExtracted = 0;
        this.levelStartTime = 0;
        this.elapsedSeconds = 0;
        this.isLevelCleared = false;

        // Workshop Boosters
        this.activeBooster = null; // 'wd40' | 'magnet' | null
        this.boosters = { wd40: 2, magnet: 1 };

        this.clock = new THREE.Clock();

        this.bindUIEvents();
        this.bootGame();
    }

    bootGame() {
        const loadingBar = document.getElementById('loading-bar');
        const loadingScreen = document.getElementById('loading-screen');

        if (loadingBar) loadingBar.style.width = '100%';
        this.updateHUD();

        setTimeout(() => {
            this.loadLevel(this.currentLevel);
            if (loadingScreen) loadingScreen.classList.add('fade-out');
            this.animate();
        }, 450);
    }

    bindUIEvents() {
        const domElement = this.graphics.renderer.domElement;

        // Distinguish between a quick Tap (unscrew bolt) and a Drag (OrbitControls camera rotate)
        domElement.addEventListener('pointerdown', (e) => {
            this.pointerDownPos.x = e.clientX;
            this.pointerDownPos.y = e.clientY;
        });

        domElement.addEventListener('pointerup', (e) => {
            const dx = e.clientX - this.pointerDownPos.x;
            const dy = e.clientY - this.pointerDownPos.y;
            if (Math.hypot(dx, dy) < 10) {
                this.handleCanvasTap(e);
            }
        });

        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.audio.vibrate(25);
            this.loadLevel(this.currentLevel);
            this.showToast('Workbench reset! Fresh start, Ustaad.');
        });

        document.getElementById('btn-camera')?.addEventListener('click', () => {
            this.graphics.resetCamera();
            this.showToast('Camera centered on workbench.');
        });

        document.getElementById('btn-sound')?.addEventListener('click', () => {
            this.audio.enabled = !this.audio.enabled;
            const icon = document.getElementById('sound-icon');
            if (icon) icon.textContent = this.audio.enabled ? '\u{1F50A}' : '\u{1F507}';
            this.showToast(this.audio.enabled ? 'Workshop sound enabled' : 'Workshop muted');
        });

        // Booster: WD-40 Rust Spray
        document.getElementById('btn-wd40')?.addEventListener('click', () => {
            this.toggleBooster('wd40');
        });

        // Booster: Magnet Pull (Extracts even occluded or rusted bolts immediately)
        document.getElementById('btn-magnet')?.addEventListener('click', () => {
            this.toggleBooster('magnet');
        });

        // Next Level Button
        document.getElementById('btn-next-level')?.addEventListener('click', () => {
            document.getElementById('victory-modal')?.classList.add('hidden');
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        });

        // Leaderboard Sheet
        document.getElementById('btn-sync')?.addEventListener('click', () => {
            this.openLeaderboardSheet();
        });
        document.getElementById('btn-close-ranks')?.addEventListener('click', () => {
            document.getElementById('leaderboard-modal')?.classList.add('hidden');
        });
    }

    toggleBooster(type) {
        if (this.boosters[type] <= 0) {
            this.showToast('Out of that tool! Clear jobs to restock.', true);
            this.audio.vibrate([30, 40, 30]);
            return;
        }

        if (this.activeBooster === type) {
            this.activeBooster = null;
            this.showToast('Tool put back in tray.');
        } else {
            this.activeBooster = type;
            const msg = type === 'wd40'
                ? 'RUST SPRAY READY: Tap any rusted bolt to loosen & extract!'
                : 'MAGNET READY: Tap ANY bolt (even blocked ones) to yank it out!';
            this.showToast(msg, false, true);
        }
        this.updateBoosterUI();
    }

    updateBoosterUI() {
        const btnWd40 = document.getElementById('btn-wd40');
        const btnMagnet = document.getElementById('btn-magnet');
        const badgeWd40 = document.getElementById('badge-wd40');
        const badgeMagnet = document.getElementById('badge-magnet');

        if (badgeWd40) badgeWd40.textContent = String(this.boosters.wd40);
        if (badgeMagnet) badgeMagnet.textContent = String(this.boosters.magnet);

        btnWd40?.classList.toggle('active-booster', this.activeBooster === 'wd40');
        btnMagnet?.classList.toggle('active-booster', this.activeBooster === 'magnet');
    }

    /**
     * Builds or procedurally generates a level blueprint and spawns 3D plates + Cannon-es HingeConstraints.
     */
    getBlueprintForLevel(levelNum) {
        if (levelNum <= LEVEL_BLUEPRINTS.length) {
            return LEVEL_BLUEPRINTS[levelNum - 1];
        }
        // Procedural Workshop Generator for endless levels 5+
        const bolts = [
            { id: 'b1', x: -2.0, y: 2.3, rusted: levelNum % 2 === 0 },
            { id: 'b2', x: 2.0, y: 2.3, rusted: false },
            { id: 'b3', x: 0.0, y: 0.2, rusted: true },
            { id: 'b4', x: -2.0, y: -2.0, rusted: false },
            { id: 'b5', x: 2.0, y: -2.0, rusted: levelNum % 3 === 0 }
        ];
        const plates = [
            { id: 'p1', p1: [-2.0, 2.3], p2: [0.0, 0.2], width: 1.15, layer: 0, mat: levelNum % 5 },
            { id: 'p2', p1: [2.0, 2.3], p2: [0.0, 0.2], width: 1.15, layer: 1, mat: (levelNum + 1) % 5 },
            { id: 'p3', p1: [0.0, 0.2], p2: [-2.0, -2.0], width: 1.15, layer: 0, mat: (levelNum + 2) % 5 },
            { id: 'p4', p1: [0.0, 0.2], p2: [2.0, -2.0], width: 1.15, layer: 2, mat: (levelNum + 3) % 5 },
            { id: 'p5', p1: [-2.0, 2.3], p2: [2.0, -2.0], width: 1.25, layer: 3, mat: (levelNum + 4) % 5 }
        ];
        return { bolts, plates };
    }

    loadLevel(levelNum) {
        // Clean previous meshes & physics bodies
        for (const p of this.plates) {
            this.graphics.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
        }
        for (const b of this.bolts) {
            this.graphics.scene.remove(b.mesh);
        }
        for (const eb of this.extractingBolts) {
            this.graphics.scene.remove(eb.mesh);
        }

        this.physics.clearDynamicWorld();
        this.plates = [];
        this.bolts = [];
        this.extractingBolts = [];
        this.levelBoltsExtracted = 0;
        this.isLevelCleared = false;
        this.activeBooster = null;
        this.levelStartTime = performance.now();
        this.updateBoosterUI();

        const blueprint = this.getBlueprintForLevel(levelNum);
        const plateDepth = 0.26;
        const layerSpacing = 0.34;

        // 1. Create 3D Extruded Plates + Physics RigidBodies
        blueprint.plates.forEach((pDef, idx) => {
            const [x1, y1] = pDef.p1;
            const [x2, y2] = pDef.p2;
            const cx = (x1 + x2) * 0.5;
            const cy = (y1 + y2) * 0.5;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const span = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);

            const plateWidth = span + 1.15;
            const plateHeight = pDef.width || 1.15;
            const zPos = 0.18 + pDef.layer * layerSpacing;

            // Compute local hole coordinates relative to the plate's center & rotation
            const localHoles = [
                { x: -span * 0.5, y: 0 },
                { x: span * 0.5, y: 0 }
            ];

            if (pDef.extraHole) {
                const ex = pDef.extraHole[0] - cx;
                const ey = pDef.extraHole[1] - cy;
                const cos = Math.cos(-angle);
                const sin = Math.sin(-angle);
                localHoles.push({
                    x: ex * cos - ey * sin,
                    y: ex * sin + ey * cos
                });
            }

            const mesh = this.graphics.createExtrudedPlateMesh({
                width: plateWidth,
                height: plateHeight,
                depth: plateDepth,
                localHoles,
                materialIndex: pDef.mat ?? idx
            });

            const body = this.physics.createPlateBody({
                id: pDef.id,
                width: plateWidth,
                height: plateHeight,
                depth: plateDepth,
                x: cx,
                y: cy,
                z: zPos,
                angle,
                layerIndex: pDef.layer,
                mass: 3.5
            });

            this.plates.push({
                id: pDef.id,
                mesh,
                body,
                width: plateWidth,
                height: plateHeight,
                layer: pDef.layer,
                zPos,
                dropped: false
            });
        });

        // 2. Create 3D Bolts and attach Cannon-es HingeConstraints to every plate hole at that (x, y)
        blueprint.bolts.forEach((bDef) => {
            const constraintIds = [];
            let maxLayerZ = 0.25;

            this.plates.forEach((plate) => {
                // Check if this bolt's (x, y) lies inside one of the plate's holes
                const localPt = new THREE.Vector3(bDef.x, bDef.y, plate.zPos);
                plate.mesh.position.copy(plate.body.position);
                plate.mesh.quaternion.copy(plate.body.quaternion);
                plate.mesh.updateMatrixWorld();
                plate.mesh.worldToLocal(localPt);

                const matchesHole = Math.abs(localPt.y) < 0.35 &&
                    Math.abs(localPt.x) <= (plate.width * 0.5 - 0.25);

                if (matchesHole) {
                    const cid = `${bDef.id}_${plate.id}`;
                    this.physics.attachBoltHinge(cid, plate.body, bDef.x, bDef.y, plate.zPos);
                    constraintIds.push(cid);
                    maxLayerZ = Math.max(maxLayerZ, plate.zPos);
                }
            });

            const boltMesh = this.graphics.createBoltMesh({
                x: bDef.x,
                y: bDef.y,
                maxZ: maxLayerZ,
                rusted: bDef.rusted
            });

            const boltRecord = {
                id: bDef.id,
                x: bDef.x,
                y: bDef.y,
                maxZ: maxLayerZ,
                rusted: Boolean(bDef.rusted),
                mesh: boltMesh,
                constraintIds,
                extracted: false
            };

            boltMesh.traverse((child) => {
                if (child.isMesh) {
                    child.userData.boltRef = boltRecord;
                }
            });

            this.bolts.push(boltRecord);
        });

        this.updateHUD();
    }

    /**
     * Checks if any higher-layer plate currently overlaps a bolt's head in 3D space (without being pinned by that bolt).
     */
    isBoltOccludedByFrontPlate(bolt) {
        for (const plate of this.plates) {
            if (plate.dropped) continue;
            // Only plates sitting strictly in front of the bolt's highest pinned plate can block it
            if (plate.zPos <= bolt.maxZ + 0.05) continue;

            const local = new THREE.Vector3(bolt.x, bolt.y, plate.zPos);
            plate.mesh.worldToLocal(local);

            const halfW = plate.width * 0.5 + 0.12;
            const halfH = plate.height * 0.5 + 0.12;

            if (Math.abs(local.x) < halfW && Math.abs(local.y) < halfH) {
                return true;
            }
        }
        return false;
    }

    /**
     * Handles user tap/click via Three.js Raycaster.
     */
    handleCanvasTap(event) {
        if (this.isLevelCleared) return;

        const rect = this.graphics.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.graphics.camera);

        const pickableMeshes = [];
        for (const b of this.bolts) {
            if (!b.extracted) {
                b.mesh.traverse((child) => {
                    if (child.isMesh) pickableMeshes.push(child);
                });
            }
        }

        const intersects = this.raycaster.intersectObjects(pickableMeshes, false);
        if (intersects.length === 0) return;

        const hitBolt = intersects[0].object.userData.boltRef;
        if (!hitBolt || hitBolt.extracted) return;

        // Check Magnet Booster (bypasses occlusion and rust!)
        if (this.activeBooster === 'magnet') {
            this.boosters.magnet--;
            this.activeBooster = null;
            this.updateBoosterUI();
            this.extractBolt(hitBolt);
            this.showToast('MAGNET PULL! Bolt yanked straight out!');
            return;
        }

        // Check if blocked by a front plate layer
        if (this.isBoltOccludedByFrontPlate(hitBolt)) {
            this.audio.playBlockedClink();
            this.audio.vibrate([40, 30, 40]);
            this.shakeBolt(hitBolt);
            this.showToast('Arre! A front plate is blocking this bolt! Swing it clear first.', true);
            return;
        }

        // Check WD-40 Booster on Rusted Bolt
        if (this.activeBooster === 'wd40') {
            this.boosters.wd40--;
            this.activeBooster = null;
            this.updateBoosterUI();
            hitBolt.rusted = false;
            this.graphics.polishRustedBolt(hitBolt.mesh);
            this.extractBolt(hitBolt);
            this.showToast('Rust dissolved & bolt extracted!');
            return;
        }

        // Standard Rusted Bolt requires 1 tap to break the rust loose, 2nd tap to extract
        if (hitBolt.rusted) {
            hitBolt.rusted = false;
            this.graphics.polishRustedBolt(hitBolt.mesh);
            this.graphics.spawnSparks(hitBolt.mesh.position, 0xd97706, 12);
            this.audio.playBlockedClink();
            this.audio.vibrate(35);
            this.shakeBolt(hitBolt);
            this.showToast('Rust cracked loose! Tap once more to unscrew.');
            return;
        }

        this.extractBolt(hitBolt);
    }

    shakeBolt(bolt) {
        const startX = bolt.x;
        let frame = 0;
        const shakeInterval = setInterval(() => {
            frame++;
            bolt.mesh.position.x = startX + Math.sin(frame * 1.8) * 0.08;
            if (frame >= 6) {
                bolt.mesh.position.x = startX;
                clearInterval(shakeInterval);
            }
        }, 25);
    }

    /**
     * Triggers the counter-clockwise unscrewing Z-axis extraction animation and removes Cannon-es constraints.
     */
    extractBolt(bolt) {
        bolt.extracted = true;
        this.levelBoltsExtracted++;
        this.score += 25;

        this.audio.playRatchetUnscrew();
        this.audio.vibrate(45);
        this.graphics.spawnSparks(bolt.mesh.position, 0xfacc15, 16);

        // Immediately release the physics constraints so the plate swings or drops!
        this.physics.removeBoltConstraints(bolt.constraintIds);

        // Queue bolt for smooth Z-axis extraction + counter-clockwise unscrewing spin
        this.extractingBolts.push({
            mesh: bolt.mesh,
            startZ: bolt.mesh.position.z,
            progress: 0
        });

        this.showToast('Bolt unscrewed! Watch the iron swing.');
        this.updateHUD();
    }

    showToast(message, isWarn = false, isBooster = false) {
        const toast = document.getElementById('mechanic-toast');
        const text = document.getElementById('prompt-text');
        if (!toast || !text) return;

        text.textContent = message;
        toast.classList.remove('toast-warn', 'toast-active-tool');
        if (isWarn) toast.classList.add('toast-warn');
        if (isBooster) toast.classList.add('toast-active-tool');
    }

    updateHUD() {
        const total = this.plates.length;
        const dropped = this.plates.filter((p) => p.dropped).length;
        const remaining = total - dropped;

        const lvlEl = document.getElementById('level-indicator');
        const platesEl = document.getElementById('plates-counter');
        const fillEl = document.getElementById('plate-meter-fill');
        const scoreEl = document.getElementById('score-display');

        if (lvlEl) lvlEl.textContent = String(this.currentLevel).padStart(2, '0');
        if (platesEl) platesEl.textContent = `${dropped} / ${total}`;
        if (fillEl) fillEl.style.width = total > 0 ? `${(dropped / total) * 100}%` : '0%';
        if (scoreEl) scoreEl.textContent = String(this.score);

        if (total > 0 && remaining === 0 && !this.isLevelCleared) {
            this.handleLevelVictory();
        }
    }

    handleLevelVictory() {
        this.isLevelCleared = true;
        const levelBonus = 150 + Math.max(0, 60 - this.elapsedSeconds) * 2;
        this.score += levelBonus;

        // Restock 1 Rust Spray every 2 levels cleared
        if (this.currentLevel % 2 === 0) {
            this.boosters.wd40++;
            this.updateBoosterUI();
        }

        this.backend.saveResult(this.currentLevel, levelBonus);
        this.audio.playVictoryChime();
        this.audio.vibrate([60, 50, 100]);

        const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(this.elapsedSeconds % 60).padStart(2, '0');

        document.getElementById('modal-time').textContent = `${mins}:${secs}`;
        document.getElementById('modal-bolts').textContent = String(this.levelBoltsExtracted);
        document.getElementById('modal-score').textContent = `+${levelBonus} \u2B22`;
        document.getElementById('score-display').textContent = String(this.score);

        setTimeout(() => {
            document.getElementById('victory-modal')?.classList.remove('hidden');
        }, 450);
    }

    async openLeaderboardSheet() {
        const modal = document.getElementById('leaderboard-modal');
        const listEl = document.getElementById('leaderboard-list');
        if (!modal || !listEl) return;

        modal.classList.remove('hidden');
        const ranks = await this.backend.fetchLeaderboard();
        listEl.innerHTML = ranks.map((r, i) => `
            <div class="rank-item ${r.self ? 'rank-self' : ''}">
                <span class="rank-name">#${i + 1} &nbsp; ${r.name}</span>
                <span class="rank-score">${r.score} &#x2B22;</span>
            </div>
        `).join('');
    }

    /**
     * Main 60FPS Game Loop: Steps Cannon-es Physics, Syncs 3D Meshes, Animates Bolt Extraction.
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = this.clock.getDelta();
        this.physics.step(dt);

        // 1. Sync Cannon-es Plate RigidBodies to Three.js Plate Meshes
        for (const plate of this.plates) {
            plate.mesh.position.copy(plate.body.position);
            plate.mesh.quaternion.copy(plate.body.quaternion);

            // Detect when an unbolted plate falls off the bottom of the workbench
            if (!plate.dropped && plate.body.position.y < -7.5) {
                plate.dropped = true;
                this.score += 50;
                this.audio.vibrate(30);
                this.updateHUD();
            }
        }

        // 2. Animate Bolts Unscrewing (Spinning counter-clockwise + Backing out on Z-axis)
        for (let i = this.extractingBolts.length - 1; i >= 0; i--) {
            const item = this.extractingBolts[i];
            item.progress += dt * 3.2;

            // Outward Z translation + counter-clockwise thread spin
            item.mesh.position.z = item.startZ + item.progress * 2.4;
            item.mesh.rotation.z += dt * 22.0;

            if (item.progress >= 1.0) {
                this.graphics.scene.remove(item.mesh);
                this.extractingBolts.splice(i, 1);
            }
        }

        // 3. Update Live Workshop Timer
        if (!this.isLevelCleared) {
            const secs = Math.floor((performance.now() - this.levelStartTime) / 1000);
            if (secs !== this.elapsedSeconds) {
                this.elapsedSeconds = secs;
                const m = String(Math.floor(secs / 60)).padStart(2, '0');
                const s = String(secs % 60).padStart(2, '0');
                const timerEl = document.getElementById('timer-display');
                if (timerEl) timerEl.textContent = `${m}:${s}`;
            }
        }

        this.graphics.updateAndRender(dt);
    }
}

// Boot the engine once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.ustaadGame = new UstaadMechanicGame();
});