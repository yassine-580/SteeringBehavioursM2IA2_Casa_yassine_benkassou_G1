// Jeu d'action et stratégie logistique : 5 Niveaux & 3 Phases de Jeu
// Phase 1 : Livraison aérienne (Hélicoptère & Treuillage)
// Phase 2 : Chargement (Ralliement et arrimage sur camion)
// Phase 3 : La Fuite (Escape Phase sous pression policière vers le Garage)

let roadNetwork;
let garage;
let helipad;
let helicopters = [];
let cargoBoxes = [];
let roadblocks = [];
let obstacles = [];
let camions = [];
let polices = [];
let vehicules = []; // Support de compatibilité
let soundManager;
let totalCrashes = 0;

// Gestion des Niveaux (1 à 5)
let currentLevel = 1;
let levelDeliveredCount = 0;
let levelTargetDeliveries = 1;
let levelBannerTimer = 0;
let levelBannerTitle = "";
let levelBannerSubtitle = "";

// Phases de jeu : "AIRDROP", "LOADING", "ESCAPE", "LEVEL_CLEAR"
let gamePhase = "AIRDROP";
let escapeAlarmTimer = 0;
let rainParticles = [];

// Mode de cible camion : "path" (route), "garage" ou "mouse"
let truckTargetMode = "path";
let isHudHidden = false;
let isGameOver = false;
let playerDriveMode = "MANUEL"; // "MANUEL" ou "AUTO"

const CAMION_COLORS = ["#FB8C00", "#FF7043", "#FFA726", "#26C6DA", "#AB47BC", "#26A69A"];

// Configuration globale dynamique synchronisée avec le menu
const simulationConfig = {
  camion: {
    maxSpeed: 3.8,
    maxForce: 0.28,
    fleeRadius: 180,
    avoidWeight: 3.6
  },
  police: {
    maxSpeed: 4.4,
    maxForce: 0.32,
    detectionRadius: 400,
    anticipationSeconds: 1.5,
    avoidWeight: 3.6
  }
};

const PRESETS = {
  default: {
    camion: { maxSpeed: 3.8, maxForce: 0.28, fleeRadius: 180, avoidWeight: 3.6 },
    police: { maxSpeed: 4.4, maxForce: 0.32, detectionRadius: 400, anticipationSeconds: 1.5, avoidWeight: 3.6 }
  },
  speed: {
    camion: { maxSpeed: 6.5, maxForce: 0.45, fleeRadius: 220, avoidWeight: 4.2 },
    police: { maxSpeed: 7.2, maxForce: 0.50, detectionRadius: 500, anticipationSeconds: 2.0, avoidWeight: 4.5 }
  },
  police: {
    camion: { maxSpeed: 3.2, maxForce: 0.22, fleeRadius: 160, avoidWeight: 3.4 },
    police: { maxSpeed: 6.8, maxForce: 0.60, detectionRadius: 600, anticipationSeconds: 2.5, avoidWeight: 5.0 }
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  soundManager = new SoundEffects();

  // Empêcher l'ouverture du menu contextuel au clic droit
  document.addEventListener("contextmenu", e => e.preventDefault());

  // Initialisation des particules de pluie pour le niveau 5
  initRainParticles();

  // Démarrer directement au Niveau 1
  startLevel(1);

  // Branchement des boutons du HUD
  const levelBtn = document.getElementById("level-btn");
  if (levelBtn) {
    levelBtn.addEventListener("click", () => {
      let nextLvl = (currentLevel % 5) + 1;
      startLevel(nextLvl);
    });
  }

  const audioBtn = document.getElementById("audio-btn");
  if (audioBtn) {
    audioBtn.addEventListener("click", () => toggleAudio());
  }

  const targetBtn = document.getElementById("target-btn");
  if (targetBtn) {
    targetBtn.addEventListener("click", () => toggleTruckTarget());
  }

  const clearObsBtn = document.getElementById("clear-obs-btn");
  if (clearObsBtn) {
    clearObsBtn.addEventListener("click", () => clearAllObstacles());
  }

  const driveBadge = document.getElementById("player-drive-badge");
  if (driveBadge) {
    driveBadge.addEventListener("click", () => togglePlayerDriveMode());
  }

  // Branchement des boutons pour masquer / afficher le grand menu HUD
  const collapseBtn = document.getElementById("hud-collapse-btn");
  if (collapseBtn) {
    collapseBtn.addEventListener("click", () => toggleHUD());
  }

  const expandBtn = document.getElementById("hud-expand-btn");
  if (expandBtn) {
    expandBtn.addEventListener("click", () => toggleHUD());
  }

  // Initialisation du menu des réglages interactifs
  initSettingsUI();
}

function togglePlayerDriveMode() {
  playerDriveMode = (playerDriveMode === "MANUEL") ? "AUTO" : "MANUEL";
  for (let c of camions) {
    if (c.isPlayer || (typeof PlayerCamion !== 'undefined' && c instanceof PlayerCamion)) {
      c.playerControlEnabled = (playerDriveMode === "MANUEL");
    }
  }
  const elDrive = document.getElementById("stat-drive-mode");
  if (elDrive) {
    elDrive.textContent = (playerDriveMode === "MANUEL") ? "MANUEL (ZQSD)" : "AUTO (IA)";
  }
}

function toggleHUD(forceState) {
  const hudPanel = document.querySelector(".hud-panel");
  const expandBtn = document.getElementById("hud-expand-btn");
  if (forceState !== undefined) {
    isHudHidden = forceState;
  } else {
    isHudHidden = !isHudHidden;
  }

  if (hudPanel) {
    if (isHudHidden) hudPanel.classList.add("hidden");
    else hudPanel.classList.remove("hidden");
  }

  if (expandBtn) {
    if (isHudHidden) expandBtn.classList.remove("hidden");
    else expandBtn.classList.add("hidden");
  }
}

function initRainParticles() {
  rainParticles = [];
  for (let i = 0; i < 120; i++) {
    rainParticles.push({
      x: random(width),
      y: random(height),
      speed: random(12, 22),
      len: random(10, 20)
    });
  }
}

// Initialisation et transition de niveau (1 à 5)
function startLevel(lvl) {
  currentLevel = constrain(lvl, 1, 5);
  levelDeliveredCount = 0;
  gamePhase = "AIRDROP";

  // Cible de livraisons par niveau
  if (currentLevel === 1) levelTargetDeliveries = 1;
  else if (currentLevel === 2) levelTargetDeliveries = 1;
  else if (currentLevel === 3) levelTargetDeliveries = 2;
  else if (currentLevel === 4) levelTargetDeliveries = 2;
  else if (currentLevel === 5) levelTargetDeliveries = 3;

  // Configuration de la bannière
  levelBannerTimer = 180;
  if (currentLevel === 1) {
    levelBannerTitle = "NIVEAU 1 : INTRODUCTION & SÉCURITÉ";
    levelBannerSubtitle = "Largage aérien par hélicoptère • Chargement • Fuite calme vers le Garage";
  } else if (currentLevel === 2) {
    levelBannerTitle = "NIVEAU 2 : OBSTACLES & PRESSION";
    levelBannerSubtitle = "Trajet sinueux • Alerte police immédiate au départ de la cargaison";
  } else if (currentLevel === 3) {
    levelBannerTitle = "NIVEAU 3 : COMPLEXITÉ TACTIQUE";
    levelBannerSubtitle = "Barrages routiers de police déployés • Double rotation logistique";
  } else if (currentLevel === 4) {
    levelBannerTitle = "NIVEAU 4 : URGENCE MAXIMALE";
    levelBannerSubtitle = "Traque active en temps réel • Police d'élite avec forte anticipation";
  } else if (currentLevel === 5) {
    levelBannerTitle = "NIVEAU 5 : LE GRAND DÉFI FINAL";
    levelBannerSubtitle = "Chaos logistique sous tempête • 3 Intercepteurs • Mode Fuite Extrême";
  }

  if (soundManager) soundManager.playLevelUp();

  // 1. Mise à jour du réseau routier
  roadNetwork = new RoadNetwork(width, height, currentLevel);

  // 2. Positionnement de l'Héliport (Zone de dépôt)
  let startCp = roadNetwork.getCheckpoint(0);
  let helipadPos = createVector(startCp.x - 35, startCp.y + 40);
  helipad = new Helipad(helipadPos.x, helipadPos.y, 55);

  // 3. Positionnement du Garage
  if (currentLevel === 5 || currentLevel === 2) {
    let cp = roadNetwork.getCheckpoint(7);
    garage = new Garage(cp.x - 20, cp.y + 40, 130, 95);
  } else {
    let lastCp = roadNetwork.getCheckpoint(roadNetwork.checkpoints.length - 1);
    garage = new Garage(lastCp.x + 35, lastCp.y, 130, 95);
  }

  // 4. Obstacles et barrages routiers adaptés au niveau
  initObstacles(currentLevel);
  initRoadblocks(currentLevel);

  // 5. Paramètres de vitesse et forces selon le niveau
  configureLevelPhysics(currentLevel);

  // 6. Camions et Police
  let truckCount = (currentLevel >= 3) ? 2 : 1;
  initCamions(truckCount);

  let policeCount = 1;
  if (currentLevel === 4) policeCount = 2;
  else if (currentLevel === 5) policeCount = 3;
  initPolice(policeCount);

  // 7. Lancement de la Phase 1 : Déploiement de l'hélicoptère
  helicopters = [];
  cargoBoxes = [];
  spawnHelicopterDrop();

  applySimulationConfig();
  updateSettingsUIInputs();
}

function configureLevelPhysics(level) {
  if (level === 1) {
    simulationConfig.camion = { maxSpeed: 3.8, maxForce: 0.28, fleeRadius: 160, avoidWeight: 3.5 };
    simulationConfig.police = { maxSpeed: 3.6, maxForce: 0.24, detectionRadius: 320, anticipationSeconds: 1.2, avoidWeight: 3.5 };
  } else if (level === 2) {
    simulationConfig.camion = { maxSpeed: 4.2, maxForce: 0.30, fleeRadius: 200, avoidWeight: 3.8 };
    simulationConfig.police = { maxSpeed: 4.8, maxForce: 0.38, detectionRadius: 460, anticipationSeconds: 1.8, avoidWeight: 3.8 };
  } else if (level === 3) {
    simulationConfig.camion = { maxSpeed: 4.4, maxForce: 0.32, fleeRadius: 220, avoidWeight: 4.2 };
    simulationConfig.police = { maxSpeed: 5.2, maxForce: 0.42, detectionRadius: 500, anticipationSeconds: 2.0, avoidWeight: 4.0 };
  } else if (level === 4) {
    simulationConfig.camion = { maxSpeed: 4.8, maxForce: 0.36, fleeRadius: 240, avoidWeight: 4.5 };
    simulationConfig.police = { maxSpeed: 5.8, maxForce: 0.48, detectionRadius: 550, anticipationSeconds: 2.5, avoidWeight: 4.4 };
  } else if (level === 5) {
    simulationConfig.camion = { maxSpeed: 5.2, maxForce: 0.42, fleeRadius: 260, avoidWeight: 4.8 };
    simulationConfig.police = { maxSpeed: 6.4, maxForce: 0.54, detectionRadius: 620, anticipationSeconds: 2.8, avoidWeight: 4.6 };
  }
}

// Phase 1 : Largage aérien par hélicoptère
function spawnHelicopterDrop() {
  if (!helipad) return;
  let startX = random() > 0.5 ? -120 : width + 120;
  let startY = random(-100, 100);

  let heli = new Helicopter(startX, startY, helipad.pos);
  let cargo = new CargoBox(startX, startY, currentLevel);
  cargo.altitude = 110;
  heli.attachCargo(cargo);

  helicopters.push(heli);
  cargoBoxes.push(cargo);

  gamePhase = "AIRDROP";
  if (helipad) helipad.status = "LARGAGE";
  if (soundManager) soundManager.playHelicopterRotor();
}

function initObstacles(level = currentLevel) {
  obstacles = [];
  const w = width;
  const h = height;

  if (level === 5 || level === 2) {
    obstacles.push(new Obstacle(w * 0.34, h * 0.22, 45, "#2e7d32"));
    obstacles.push(new Obstacle(w * 0.78, h * 0.40, 48, "#1b5e20"));
    obstacles.push(new Obstacle(w * 0.52, h * 0.50, 50, "#c62828"));
    obstacles.push(new Obstacle(w * 0.65, h * 0.78, 46, "#388e3c"));
    obstacles.push(new Obstacle(w * 0.28, h * 0.65, 48, "#2e7d32"));
    obstacles.push(new Obstacle(w * 0.16, h * 0.40, 44, "#1b5e20"));
  } else if (level === 4) {
    obstacles.push(new Obstacle(w * 0.28, h * 0.28, 45, "#2e7d32"));
    obstacles.push(new Obstacle(w * 0.40, h * 0.42, 50, "#c62828"));
    obstacles.push(new Obstacle(w * 0.55, h * 0.42, 48, "#1b5e20"));
    obstacles.push(new Obstacle(w * 0.72, h * 0.50, 52, "#388e3c"));
    obstacles.push(new Obstacle(w * 0.82, h * 0.48, 46, "#2e7d32"));
  } else if (level === 3) {
    obstacles.push(new Obstacle(w * 0.36, h * 0.35, 48, "#2e7d32"));
    obstacles.push(new Obstacle(w * 0.52, h * 0.55, 52, "#1b5e20"));
    obstacles.push(new Obstacle(w * 0.70, h * 0.48, 46, "#388e3c"));
  } else {
    // Niveau 1
    obstacles.push(new Obstacle(w * 0.36, h * 0.42, 48, "#2e7d32"));
    obstacles.push(new Obstacle(w * 0.58, h * 0.52, 50, "#1b5e20"));
    obstacles.push(new Obstacle(w * 0.75, h * 0.40, 46, "#388e3c"));
  }
}

function initRoadblocks(level = currentLevel) {
  roadblocks = [];
  const w = width;
  const h = height;

  if (level === 3) {
    roadblocks.push(new Roadblock(w * 0.42, h * 0.52, 0.3, 65));
    roadblocks.push(new Roadblock(w * 0.65, h * 0.58, -0.2, 60));
  } else if (level === 4) {
    roadblocks.push(new Roadblock(w * 0.38, h * 0.38, 0.5, 65));
    roadblocks.push(new Roadblock(w * 0.58, h * 0.35, -0.4, 60));
    roadblocks.push(new Roadblock(w * 0.78, h * 0.58, 0.2, 70));
  } else if (level === 5) {
    roadblocks.push(new Roadblock(w * 0.45, h * 0.22, 0, 70));
    roadblocks.push(new Roadblock(w * 0.75, h * 0.45, 0.6, 65));
    roadblocks.push(new Roadblock(w * 0.62, h * 0.78, -0.3, 70));
    roadblocks.push(new Roadblock(w * 0.25, h * 0.58, 0.4, 65));
  }
}

function initCamions(count = 2) {
  camions = [];
  for (let i = 0; i < count; i++) {
    spawnCamion(i);
  }
}

function spawnCamion(index = 0) {
  let startCp = roadNetwork ? roadNetwork.getCheckpoint(0) : createVector(80, height * 0.28);
  let startX = startCp.x - 40 + random(-15, 15);
  let startY = startCp.y + (index - 1) * 26 + random(-5, 5);
  let color = CAMION_COLORS[index % CAMION_COLORS.length];

  let c;
  if (index === 0 && typeof PlayerCamion !== 'undefined') {
    c = new PlayerCamion(startX, startY, color);
    c.playerControlEnabled = (playerDriveMode === "MANUEL");
  } else {
    c = new Camion(startX, startY, color);
  }

  c.targetMode = truckTargetMode;
  c.vel = createVector(random(2, 3), random(-0.2, 0.2));
  c.maxSpeed = simulationConfig.camion.maxSpeed;
  c.maxForce = simulationConfig.camion.maxForce;
  c.fleeRadius = simulationConfig.camion.fleeRadius;
  c.avoidWeight = simulationConfig.camion.avoidWeight;
  camions.push(c);
  return c;
}

function initPolice(count = 1) {
  polices = [];
  for (let i = 0; i < count; i++) {
    let p;
    if (i === 1) {
      let startCp = roadNetwork ? roadNetwork.getCheckpoint(0) : createVector(width * 0.2, height * 0.3);
      p = new Police(startCp.x, startCp.y);
      p.vel = createVector(2, 0);
      p.patrolIndex = 0;
      p.patrolDirection = 1;
      p.color = "#0288D1";
    } else if (i === 2) {
      let midCp = roadNetwork ? roadNetwork.getCheckpoint(3) : createVector(width * 0.5, height * 0.5);
      p = new Police(midCp.x, midCp.y);
      p.vel = createVector(0, -2);
      p.patrolIndex = 3;
      p.patrolDirection = -1;
      p.color = "#7B1FA2";
    } else {
      let lastCp = roadNetwork ? roadNetwork.getCheckpoint(roadNetwork.checkpoints.length > 5 ? 4 : 4) : createVector(width * 0.7, height * 0.3);
      p = new Police(lastCp.x, lastCp.y);
      p.vel = createVector(-2, 0);
      p.patrolIndex = (roadNetwork && roadNetwork.checkpoints.length > 5) ? 4 : 5;
      p.patrolDirection = -1;
    }
    p.maxSpeed = simulationConfig.police.maxSpeed;
    p.maxForce = simulationConfig.police.maxForce;
    p.detectionRadius = simulationConfig.police.detectionRadius;
    p.anticipationSeconds = simulationConfig.police.anticipationSeconds;
    p.avoidWeight = simulationConfig.police.avoidWeight;
    polices.push(p);
  }
}

function toggleTruckTarget() {
  if (truckTargetMode === "path") truckTargetMode = "mouse";
  else if (truckTargetMode === "mouse") truckTargetMode = "garage";
  else truckTargetMode = "path";

  for (let c of camions) c.targetMode = truckTargetMode;

  const elTarget = document.getElementById("stat-target");
  if (elTarget) {
    if (truckTargetMode === "path") elTarget.textContent = "ROUTE (PATH)";
    else if (truckTargetMode === "mouse") elTarget.textContent = "SOURIS";
    else elTarget.textContent = "GARAGE";
  }
}

function clearAllObstacles() {
  obstacles = [];
  roadblocks = [];
  if (soundManager) soundManager.playCapture();
}

function removeObstacleAt(x, y) {
  const index = obstacles.findIndex(o => o.contains(x, y));
  if (index !== -1) {
    obstacles.splice(index, 1);
    if (soundManager) soundManager.playCapture();
    return true;
  }
  return false;
}

function draw() {
  // Arrière-plan tactique
  background(13, 17, 23, 140);

  // Effet d'ambiance météo Niveau 5 (Tempête & Pluie)
  if (currentLevel === 5) {
    drawRainStorm();
  }

  // Quadrillage
  drawGrid();

  // 1. Réseau routier
  if (roadNetwork) roadNetwork.show();

  // 2. Zone d'atterrissage Héliport
  if (helipad) {
    helipad.applyBehaviors();
    helipad.update();
    helipad.show();
  }

  // 3. Garage sécurisé
  if (garage) {
    garage.applyBehaviors();
    garage.update();
    garage.show();
  }

  // 4. Barrages routiers tactiques
  roadblocks.forEach(rb => {
    rb.applyBehaviors();
    rb.update();
    rb.show();
  });

  // 5. Obstacles
  let hoveredObstacle = obstacles.find(o => o.contains(mouseX, mouseY));
  cursor(hoveredObstacle ? HAND : ARROW);
  obstacles.forEach(o => {
    o.applyBehaviors();
    o.update();
    o.show(o === hoveredObstacle);
  });

  // Regroupement de tous les obstacles et barrages pour l'évitement
  let allObstacles = [...obstacles, ...roadblocks];

  // 6. Gestion des Hélicoptères (Phase 1)
  for (let i = helicopters.length - 1; i >= 0; i--) {
    let heli = helicopters[i];
    heli.applyBehaviors(obstacles);
    heli.update();
    heli.show();

    if (heli.isFinished()) {
      helicopters.splice(i, 1);
    }
  }

  // 7. Gestion des Cargaisons mobiles (Caisses / Palettes autonomes au sol)
  for (let box of cargoBoxes) {
    box.applyBehaviors(helipad ? helipad.pos : null, allObstacles);
    box.update();
    box.show();
  }

  // Mise à jour de la Phase de jeu selon l'état des cargaisons
  updateGamePhases();

  // Cible camion
  let activeTruckTarget;
  if (truckTargetMode === "mouse") {
    activeTruckTarget = createVector(mouseX, mouseY);
    drawMouseTarget(activeTruckTarget);
  } else {
    activeTruckTarget = garage;
  }

  // 8. Gestion des Camions (Phase 2 Chargement de cargaison & Phase 3 Fuite au Garage)
  let availableCargos = cargoBoxes.filter(b => (b.status === "on_ground" || b.altitude === 0) && !b.carrier);

  for (let i = camions.length - 1; i >= 0; i--) {
    let camion = camions[i];

    // Trouver le bloc de marchandise mobile le plus proche pour ce camion
    let targetCargo = null;
    if (!camion.hasCargo && availableCargos.length > 0) {
      let minDist = Infinity;
      for (let b of availableCargos) {
        let d = camion.pos.dist(b.pos);
        if (d < minDist) {
          minDist = d;
          targetCargo = b;
        }
      }
    }

    // Comportements : pilotage joueur si camion du joueur, sinon IA de suivi
    if (camion.isPlayer || (typeof PlayerCamion !== 'undefined' && camion instanceof PlayerCamion)) {
      camion.applyPlayerBehaviors(activeTruckTarget, allObstacles, polices, camions, roadNetwork, targetCargo);
    } else {
      camion.applyBehaviors(activeTruckTarget, allObstacles, polices, camions, roadNetwork, targetCargo);
    }
    camion.update();
    camion.show();

    constrainToScreen(camion);

    // Détection de collision avec obstacles et barrages
    let isHit = false;
    for (let o of obstacles) {
      if (camion.checkObstacleCollision(o)) isHit = true;
    }
    for (let rb of roadblocks) {
      if (rb.checkCollision(camion)) isHit = true;
    }
    if (isHit && soundManager) soundManager.playCollision();

    // Destruction du camion
    if (camion.isDead()) {
      totalCrashes++;
      if (soundManager) soundManager.playCrash();
      // Si le camion transportait le cargo, le cargo est libéré au sol pour être récupéré
      if (camion.hasCargo && camion.cargoBox) {
        let box = camion.cargoBox;
        box.status = "on_ground";
        box.carrier = null;
        if (typeof p5 !== 'undefined' && p5.Vector && typeof p5.Vector.random2D === 'function') {
          box.vel = p5.Vector.random2D().mult(1.5);
        } else {
          box.vel = createVector(1, 0);
        }
      }
      camions.splice(i, 1);
      if (camions.length === 0) {
        isGameOver = true;
      }
      continue;
    }

    // Détection de livraison réussie au Garage (condition obligatoire pour passer le niveau)
    if (garage.contains(camion)) {
      if (camion.hasCargo) {
        // La marchandise est livrée avec succès !
        let deliveredBox = camion.unloadCargo();
        levelDeliveredCount++;
        garage.deliveredCount++;
        if (soundManager) soundManager.playGarageDelivery();

        // Retire le bloc livré de la liste active
        if (deliveredBox) {
          let idx = cargoBoxes.indexOf(deliveredBox);
          if (idx !== -1) cargoBoxes.splice(idx, 1);
        }

        // Vérification de progression de niveau
        if (levelDeliveredCount >= levelTargetDeliveries) {
          if (currentLevel < 5) {
            startLevel(currentLevel + 1);
          } else {
            // Victoire totale finale
            levelBannerTimer = 240;
            levelBannerTitle = "🎉 VICTOIRE TOTALE — LES 5 NIVEAUX SONT ACCOMPLIS !";
            levelBannerSubtitle = "Maîtrise logistique absolue face aux barrages et poursuites d'élite";
            if (soundManager) soundManager.playLevelUp();
          }
          break;
        } else {
          // Nouveau largage aérien d'un bloc de marchandise
          setTimeout(() => spawnHelicopterDrop(), 1000);
        }

        // Re-positionne le camion pour la prochaine livraison
        camions.splice(i, 1);
        spawnCamion(camions.length);
      }
    }
  }

  // 9. Gestion de la Police (Poursuite intelligente)
  for (let pIndex = polices.length - 1; pIndex >= 0; pIndex--) {
    let police = polices[pIndex];
    police.applyBehaviors(camions, allObstacles, roadNetwork);
    police.update();
    police.show();

    constrainToScreen(police);

    // Collisions police avec obstacles
    let isHitPolice = false;
    for (let o of obstacles) {
      if (police.checkObstacleCollision(o)) isHitPolice = true;
    }
    if (isHitPolice && soundManager) soundManager.playCollision();

    if (police.isDead()) {
      totalCrashes++;
      if (soundManager) soundManager.playCrash();
      polices.splice(pIndex, 1);
      setTimeout(() => initPolice(1), 1500);
      continue;
    }

    // Interceptions de camions
    for (let i = camions.length - 1; i >= 0; i--) {
      let camion = camions[i];
      if (police.canCatch(camion)) {
        police.capturedCount++;
        soundManager.playCapture();
        soundManager.playPoliceSiren();

        // Si le camion transportait la cargaison, la cargaison est saisie et relargage
        if (camion.hasCargo && camion.cargoBox) {
          let idx = cargoBoxes.indexOf(camion.cargoBox);
          if (idx !== -1) cargoBoxes.splice(idx, 1);
          setTimeout(() => spawnHelicopterDrop(), 1000);
        }

        // On retire le camion intercepté par la police
        camions.splice(i, 1);

        // Si tous les camions ont été capturés -> déclenche le GAME OVER !
        if (camions.length === 0) {
          isGameOver = true;
          if (soundManager) soundManager.playCrash();
        }
      }
    }
  }

  // 10. Véhicules libres éventuels
  vehicules.forEach(v => {
    v.applyBehaviors(createVector(mouseX, mouseY), allObstacles, vehicules);
    v.update();
    v.show();
  });

  // 11. Bannière de statut et annonce de Niveau
  drawLevelBanner();

  // 12. Mise à jour de l'affichage HUD
  updateHUD();

  // 13. Écran de GAME OVER si tous les camions sont interceptés
  if (isGameOver) {
    drawGameOverScreen();
  }
}

function updateGamePhases() {
  let hasInAir = cargoBoxes.some(b => b.status === "in_air");
  let hasOnGround = cargoBoxes.some(b => b.status === "on_ground");
  let hasLoaded = camions.some(c => c.hasCargo || c.status === "escaping");

  if (hasLoaded) {
    if (gamePhase !== "ESCAPE") {
      gamePhase = "ESCAPE";
      if (soundManager) soundManager.playEscapeAlarm();
    }
    if (helipad) helipad.status = "DISPONIBLE";
  } else if (hasOnGround) {
    gamePhase = "LOADING";
    if (helipad) helipad.status = "CHARGEMENT";
  } else if (hasInAir) {
    gamePhase = "AIRDROP";
    if (helipad) helipad.status = "LARGAGE";
  } else {
    gamePhase = "AIRDROP";
    if (helipad) helipad.status = "ATTENTE";
  }
}

function drawRainStorm() {
  stroke(120, 180, 255, 120);
  strokeWeight(1.2);
  for (let p of rainParticles) {
    line(p.x, p.y, p.x - 3, p.y + p.len);
    p.y += p.speed;
    p.x -= 2;
    if (p.y > height) {
      p.y = -10;
      p.x = random(width + 50);
    }
  }
}

function drawLevelBanner() {
  if (levelBannerTimer <= 0) return;
  levelBannerTimer--;

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  let alpha = map(levelBannerTimer, 0, 180, 0, 245);
  let pulse = sin(frameCount * 0.15) * 4;

  fill(13, 17, 23, Math.min(235, alpha));
  stroke(255, 193, 7, alpha);
  strokeWeight(2.5);
  rect(width / 2, height * 0.35, 620, 115, 16);

  noStroke();
  fill(255, 193, 7, alpha);
  textSize(21 + pulse * 0.25);
  textStyle(BOLD);
  text(levelBannerTitle, width / 2, height * 0.35 - 22);

  fill(220, 230, 245, alpha);
  textSize(13);
  text(levelBannerSubtitle, width / 2, height * 0.35 + 14);

  fill(129, 199, 132, alpha);
  textSize(11);
  text(`Objectif : ${levelDeliveredCount} / ${levelTargetDeliveries} livraison(s) réussie(s)`, width / 2, height * 0.35 + 34);
  pop();
}

function drawMouseTarget(pos) {
  push();
  translate(pos.x, pos.y);
  let pulse = sin(frameCount * 0.1) * 4;
  noFill();
  stroke(255, 179, 0, 180);
  strokeWeight(2);
  circle(0, 0, 36 + pulse);
  stroke(255, 179, 0, 240);
  strokeWeight(1.5);
  line(-24, 0, 24, 0);
  line(0, -24, 0, 24);
  fill(255, 179, 0, 120);
  noStroke();
  circle(0, 0, 8);
  pop();
}

function drawGrid() {
  stroke(255, 255, 255, 8);
  strokeWeight(1);
  const step = 40;
  for (let x = 0; x < width; x += step) line(x, 0, x, height);
  for (let y = 0; y < height; y += step) line(0, y, width, y);
}

function constrainToScreen(vehicle) {
  let margin = 20;
  if (vehicle.pos.x < margin) vehicle.pos.x = margin;
  if (vehicle.pos.x > width - margin) vehicle.pos.x = width - margin;
  if (vehicle.pos.y < margin) vehicle.pos.y = margin;
  if (vehicle.pos.y > height - margin) vehicle.pos.y = height - margin;
}

function updateHUD() {
  const elDelivered = document.getElementById("stat-delivered");
  const elCaptured = document.getElementById("stat-captured");
  const elCrashes = document.getElementById("stat-crashes");
  const elLevel = document.getElementById("stat-level");
  const elPhase = document.getElementById("stat-phase");
  const elCargo = document.getElementById("stat-cargo");

  if (elDelivered && garage) elDelivered.textContent = garage.deliveredCount;
  if (elCaptured) {
    let totalCaptured = polices.reduce((acc, p) => acc + p.capturedCount, 0);
    elCaptured.textContent = totalCaptured;
  }
  if (elCrashes) elCrashes.textContent = totalCrashes;

  if (elLevel) {
    elLevel.textContent = `${currentLevel}/5 (${levelDeliveredCount}/${levelTargetDeliveries})`;
  }

  if (elPhase) {
    if (gamePhase === "AIRDROP") elPhase.textContent = "1. LARGAGE AÉRIEN (HÉLICO)";
    else if (gamePhase === "LOADING") elPhase.textContent = "2. CHARGEMENT CAMION";
    else if (gamePhase === "ESCAPE") elPhase.textContent = "3. FUITE SOUS PRESSION !";
  }

  if (elCargo) {
    let activeBox = cargoBoxes[0];
    if (activeBox) {
      if (activeBox.status === "in_air") elCargo.textContent = `EN VOL (Alt: ${Math.round(activeBox.altitude)}m)`;
      else if (activeBox.status === "on_ground") elCargo.textContent = "AU SOL (À RÉCUPÉRER)";
      else if (activeBox.status === "loaded") elCargo.textContent = "CHARGÉ (EN FUITE !)";
      else elCargo.textContent = "LIVRÉ";
    } else {
      elCargo.textContent = "AUCUN";
    }
  }

  const elDrive = document.getElementById("stat-drive-mode");
  if (elDrive) {
    elDrive.textContent = (playerDriveMode === "MANUEL") ? "MANUEL (ZQSD)" : "AUTO (IA)";
  }
}

function drawGameOverScreen() {
  push();
  fill(13, 17, 23, 230);
  rectMode(CORNER);
  rect(0, 0, width, height);

  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // Lueur d'alerte rouge clignotante
  let pulse = sin(frameCount * 0.1) * 6;
  fill(248, 81, 73, 20);
  noStroke();
  circle(width / 2, height / 2 - 20, 380 + pulse);

  // Panneau modal Game Over
  fill(22, 27, 36, 245);
  stroke(248, 81, 73);
  strokeWeight(2.5);
  rect(width / 2, height / 2, 560, 360, 20);

  // Titre
  fill(248, 81, 73);
  noStroke();
  textSize(32 + pulse * 0.2);
  textStyle(BOLD);
  text("🚨 GAME OVER 🚨", width / 2, height / 2 - 118);

  // Message explicatif
  fill(240, 246, 252);
  textSize(16);
  textStyle(NORMAL);
  text("La police a intercepté tous les camions !", width / 2, height / 2 - 72);

  // Statistiques de la partie
  fill(139, 148, 158);
  textSize(13);
  text(`Niveau atteint : ${currentLevel}/5  •  Livraisons réussies : ${garage ? garage.deliveredCount : 0}`, width / 2, height / 2 - 40);

  // Bouton 1 : Rejouer le niveau en cours
  let btnW = 400;
  let btnH = 46;
  let btn1X = width / 2;
  let btn1Y = height / 2 + 15;
  let isHover1 = mouseX >= btn1X - btnW / 2 && mouseX <= btn1X + btnW / 2 && mouseY >= btn1Y - btnH / 2 && mouseY <= btn1Y + btnH / 2;

  // Bouton 2 : Recommencer au Niveau 1
  let btn2X = width / 2;
  let btn2Y = height / 2 + 75;
  let isHover2 = mouseX >= btn2X - btnW / 2 && mouseX <= btn2X + btnW / 2 && mouseY >= btn2Y - btnH / 2 && mouseY <= btn2Y + btnH / 2;

  cursor((isHover1 || isHover2) ? HAND : ARROW);

  // --- Dessin Bouton 1 (Rejouer le niveau actuel) ---
  fill(isHover1 ? color(46, 160, 67) : color(35, 134, 54));
  stroke(isHover1 ? color(86, 211, 100) : color(46, 160, 67));
  strokeWeight(2);
  rect(btn1X, btn1Y, btnW, btnH, 12);

  fill(255);
  noStroke();
  textSize(15);
  textStyle(BOLD);
  text(`🔁 REJOUER CE NIVEAU (NIV. ${currentLevel})`, btn1X, btn1Y);

  // --- Dessin Bouton 2 (Refaire du premier niveau) ---
  fill(isHover2 ? color(48, 54, 66) : color(30, 36, 46));
  stroke(isHover2 ? color(139, 148, 158) : color(68, 76, 86));
  strokeWeight(2);
  rect(btn2X, btn2Y, btnW, btnH, 12);

  fill(isHover2 ? color(255) : color(220, 226, 235));
  noStroke();
  textSize(15);
  textStyle(BOLD);
  text("⏮️ RECOMMENCER AU NIVEAU 1", btn2X, btn2Y);

  // Raccourcis clavier d'aide
  fill(139, 148, 158);
  textSize(12);
  textStyle(NORMAL);
  text("Touches : [ENTRÉE] ou [ESPACE] = Rejouer niveau  •  [R] = Niveau 1", width / 2, height / 2 + 135);

  pop();
}

function retryCurrentLevel() {
  isGameOver = false;
  cursor(ARROW);
  startLevel(currentLevel);
  if (soundManager) soundManager.playLevelUp();
}

function restartFromLevel1() {
  isGameOver = false;
  cursor(ARROW);
  totalCrashes = 0;
  if (garage) garage.deliveredCount = 0;
  startLevel(1);
  if (soundManager) soundManager.playLevelUp();
}

function toggleAudio() {
  if (!soundManager) return;
  let active = soundManager.toggle();
  const elAudio = document.getElementById("stat-audio");
  if (elAudio) elAudio.textContent = active ? "ACTIF" : "MUET";
}

function mousePressed() {
  if (soundManager) soundManager.resume();

  // Si Game Over, gestion des clics sur les boutons de choix
  if (isGameOver) {
    let btnW = 400;
    let btnH = 46;
    let btn1X = width / 2;
    let btn1Y = height / 2 + 15;
    let btn2X = width / 2;
    let btn2Y = height / 2 + 75;

    // Clic sur "Rejouer ce niveau"
    if (mouseX >= btn1X - btnW / 2 && mouseX <= btn1X + btnW / 2 && mouseY >= btn1Y - btnH / 2 && mouseY <= btn1Y + btnH / 2) {
      retryCurrentLevel();
      return;
    }

    // Clic sur "Repartir du premier niveau"
    if (mouseX >= btn2X - btnW / 2 && mouseX <= btn2X + btnW / 2 && mouseY >= btn2Y - btnH / 2 && mouseY <= btn2Y + btnH / 2) {
      restartFromLevel1();
      return;
    }

    // Empêcher d'ajouter un obstacle sous le modal Game Over
    return;
  }

  // Ne pas ajouter d'obstacle si on clique sur le bandeau HUD visible
  if (!isHudHidden && mouseY < 135 && mouseX < 900) return;

  // Ne pas ajouter si on clique dans le tiroir de réglages
  const drawer = document.getElementById("settings-drawer");
  if (drawer && !drawer.classList.contains("hidden")) {
    let rect = drawer.getBoundingClientRect();
    if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
      return;
    }
  }

  if (mouseButton === RIGHT || removeObstacleAt(mouseX, mouseY)) {
    return;
  }

  let r = random(35, 65);
  obstacles.push(new Obstacle(mouseX, mouseY, r, "#2e7d32"));
}

function keyPressed() {
  if (soundManager) soundManager.resume();

  // Choix si Game Over
  if (isGameOver) {
    // ENTRÉE ou ESPACE : Rejouer le niveau en cours
    if (keyCode === 13 || keyCode === 32) { // 13 = ENTER, 32 = SPACE
      retryCurrentLevel();
      return;
    }
    // R ou '1' : Recommencer au Niveau 1
    if (key === "r" || key === "R" || key === "1" || key === "&") {
      restartFromLevel1();
      return;
    }
    return;
  }

  // Bascule du mode de pilotage du joueur (Manuel ZQSD vs IA)
  if (key === "j" || key === "J") {
    togglePlayerDriveMode();
    return;
  }

  // Raccourci pour masquer / afficher le grand menu HUD
  if (key === "u" || key === "U") {
    toggleHUD();
    return;
  }

  // Raccourci pour afficher / masquer le tiroir de réglages
  if (key === "t" || key === "T" || keyCode === 9) { // 9 = TAB
    toggleSettingsDrawer();
    return false;
  }

  // Raccourci pour cycle de niveaux (1 à 5)
  if (key === "l" || key === "L") {
    let nextLvl = (currentLevel % 5) + 1;
    startLevel(nextLvl);
    return;
  }

  // Raccourci pour forcer un largage hélicoptère immédiat
  if (key === "h" || key === "H") {
    spawnHelicopterDrop();
    return;
  }

  if (key === "s" || key === "S") {
    toggleTruckTarget();
  } else if (key === "x" || key === "X") {
    if (keyIsDown(SHIFT)) {
      clearAllObstacles();
    } else {
      if (!removeObstacleAt(mouseX, mouseY) && obstacles.length > 0) {
        obstacles.pop();
        if (soundManager) soundManager.playCapture();
      }
    }
  } else if (keyCode === DELETE || keyCode === BACKSPACE) {
    if (!removeObstacleAt(mouseX, mouseY) && obstacles.length > 0) {
      obstacles.pop();
      if (soundManager) soundManager.playCapture();
    }
  } else if (key === "c" || key === "C") {
    spawnCamion(camions.length);
    soundManager.playTruckHorn();
  } else if (key === "p" || key === "P") {
    let p = new Police(mouseX || width / 2, mouseY || height / 2);
    p.maxSpeed = simulationConfig.police.maxSpeed;
    p.maxForce = simulationConfig.police.maxForce;
    p.detectionRadius = simulationConfig.police.detectionRadius;
    p.anticipationSeconds = simulationConfig.police.anticipationSeconds;
    p.avoidWeight = simulationConfig.police.avoidWeight;
    polices.push(p);
    soundManager.playPoliceSiren();
  } else if (key === "o" || key === "O") {
    let r = random(35, 75);
    obstacles.push(new Obstacle(mouseX || width / 2, mouseY || height / 2, r, "#2e7d32"));
  } else if (key === "d" || key === "D") {
    Vehicle.debug = !Vehicle.debug;
  } else if (key === "m" || key === "M") {
    toggleAudio();
  } else if (key === "r" || key === "R") {
    startLevel(1);
    totalCrashes = 0;
    if (garage) garage.deliveredCount = 0;
  } else if (key === "v" || key === "V") {
    vehicules.push(new Vehicle(random(width), random(height)));
  }
}

function toggleSettingsDrawer(forceState) {
  const drawer = document.getElementById("settings-drawer");
  if (!drawer) return;
  if (typeof forceState === "boolean") {
    if (forceState) drawer.classList.remove("hidden");
    else drawer.classList.add("hidden");
  } else {
    drawer.classList.toggle("hidden");
  }
}

function applySimulationConfig() {
  for (let c of camions) {
    c.maxSpeed = simulationConfig.camion.maxSpeed;
    c.maxForce = simulationConfig.camion.maxForce;
    c.fleeRadius = simulationConfig.camion.fleeRadius;
    c.avoidWeight = simulationConfig.camion.avoidWeight;
  }
  for (let p of polices) {
    p.maxSpeed = simulationConfig.police.maxSpeed;
    p.maxForce = simulationConfig.police.maxForce;
    p.detectionRadius = simulationConfig.police.detectionRadius;
    p.anticipationSeconds = simulationConfig.police.anticipationSeconds;
    p.avoidWeight = simulationConfig.police.avoidWeight;
  }
}

function updateSettingsUIInputs() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setVal("slider-camion-speed", simulationConfig.camion.maxSpeed);
  setText("val-camion-speed", Number(simulationConfig.camion.maxSpeed).toFixed(1) + " px/f");

  setVal("slider-camion-force", simulationConfig.camion.maxForce);
  setText("val-camion-force", Number(simulationConfig.camion.maxForce).toFixed(2));

  setVal("slider-camion-flee", simulationConfig.camion.fleeRadius);
  setText("val-camion-flee", Math.round(simulationConfig.camion.fleeRadius) + " px");

  setVal("slider-camion-avoid", simulationConfig.camion.avoidWeight);
  setText("val-camion-avoid", Number(simulationConfig.camion.avoidWeight).toFixed(1));

  setVal("slider-police-speed", simulationConfig.police.maxSpeed);
  setText("val-police-speed", Number(simulationConfig.police.maxSpeed).toFixed(1) + " px/f");

  setVal("slider-police-force", simulationConfig.police.maxForce);
  setText("val-police-force", Number(simulationConfig.police.maxForce).toFixed(2));

  setVal("slider-police-radar", simulationConfig.police.detectionRadius);
  setText("val-police-radar", Math.round(simulationConfig.police.detectionRadius) + " px");

  setVal("slider-police-anticipation", simulationConfig.police.anticipationSeconds);
  setText("val-police-anticipation", Number(simulationConfig.police.anticipationSeconds).toFixed(1) + " s");
}

function setPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  simulationConfig.camion = { ...preset.camion };
  simulationConfig.police = { ...preset.police };
  updateSettingsUIInputs();
  applySimulationConfig();
  if (soundManager) soundManager.playCapture();
}

function initSettingsUI() {
  const drawer = document.getElementById("settings-drawer");
  if (drawer) {
    drawer.addEventListener("mousedown", (e) => e.stopPropagation());
    drawer.addEventListener("click", (e) => e.stopPropagation());
  }

  const toggleBtn = document.getElementById("settings-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettingsDrawer();
    });
  }

  const closeBtn = document.getElementById("close-settings-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettingsDrawer(false);
    });
  }

  // Sliders Camion
  const bindSlider = (id, valSpanId, formatFn, onInput) => {
    const slider = document.getElementById(id);
    const span = document.getElementById(valSpanId);
    if (!slider) return;
    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if (span) span.textContent = formatFn(val);
      onInput(val);
      applySimulationConfig();
    });
  };

  bindSlider("slider-camion-speed", "val-camion-speed", v => v.toFixed(1) + " px/f", v => { simulationConfig.camion.maxSpeed = v; });
  bindSlider("slider-camion-force", "val-camion-force", v => v.toFixed(2), v => { simulationConfig.camion.maxForce = v; });
  bindSlider("slider-camion-flee", "val-camion-flee", v => Math.round(v) + " px", v => { simulationConfig.camion.fleeRadius = v; });
  bindSlider("slider-camion-avoid", "val-camion-avoid", v => v.toFixed(1), v => { simulationConfig.camion.avoidWeight = v; });

  // Sliders Police
  bindSlider("slider-police-speed", "val-police-speed", v => v.toFixed(1) + " px/f", v => { simulationConfig.police.maxSpeed = v; });
  bindSlider("slider-police-force", "val-police-force", v => v.toFixed(2), v => { simulationConfig.police.maxForce = v; });
  bindSlider("slider-police-radar", "val-police-radar", v => Math.round(v) + " px", v => { simulationConfig.police.detectionRadius = v; });
  bindSlider("slider-police-anticipation", "val-police-anticipation", v => v.toFixed(1) + " s", v => { simulationConfig.police.anticipationSeconds = v; });

  // Boutons presets niveaux
  const bindLevelBtn = (id, lvl) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", () => startLevel(lvl));
  };
  bindLevelBtn("preset-lvl1", 1);
  bindLevelBtn("preset-lvl2", 2);
  bindLevelBtn("preset-lvl3", 3);
  bindLevelBtn("preset-lvl4", 4);
  bindLevelBtn("preset-lvl5", 5);

  const bindPreset = (id, name) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", () => setPreset(name));
  };
  bindPreset("preset-default", "default");
  bindPreset("preset-speed", "speed");
  bindPreset("preset-police", "police");
  bindPreset("preset-reset", "default");

  updateSettingsUIInputs();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (roadNetwork) {
    roadNetwork.resize(width, height);
    if (helipad) {
      let startCp = roadNetwork.getCheckpoint(0);
      helipad.pos.set(startCp.x - 35, startCp.y + 40);
      helipad.home.set(startCp.x - 35, startCp.y + 40);
    }
    if (garage) {
      if (currentLevel === 5 || currentLevel === 2) {
        let cp = roadNetwork.getCheckpoint(7);
        garage.pos.set(cp.x - 20, cp.y + 40);
        garage.home.set(cp.x - 20, cp.y + 40);
      } else {
        let lastCp = roadNetwork.getCheckpoint(roadNetwork.checkpoints.length - 1);
        garage.pos.set(lastCp.x + 35, lastCp.y);
        garage.home.set(lastCp.x + 35, lastCp.y);
      }
    }
  }
}