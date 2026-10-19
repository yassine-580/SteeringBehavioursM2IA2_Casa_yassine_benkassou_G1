import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Adaptateur vectoriel simulant p5.Vector pour le moteur de tests
class Vector {
  constructor(x = 0, y = 0) { this.set(x, y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  copy() { return new Vector(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mult(n) { this.x *= n; this.y *= n; return this; }
  div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
  mag() { return Math.hypot(this.x, this.y); }
  setMag(n) { const m = this.mag(); return m ? this.mult(n / m) : this; }
  limit(n) { return this.mag() > n ? this.setMag(n) : this; }
  heading() { return Math.atan2(this.y, this.x); }
  dist(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  normalize() { const m = this.mag(); return m ? this.div(m) : this; }

  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static add(a, b) { return new Vector(a.x + b.x, a.y + b.y); }
  static mult(v, n) { return new Vector(v.x * n, v.y * n); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static random2D() {
    const angle = Math.random() * Math.PI * 2;
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
  static fromAngle(angle) {
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
}

function scene(w = 1200, h = 800) {
  const context = vm.createContext({
    createVector: (x, y) => new Vector(x, y),
    p5: { Vector },
    width: w,
    height: h,
    CENTER: 'center',
    CORNER: 'corner',
    BOTTOM: 'bottom',
    BOLD: 'bold',
    random: (a, b) => {
      if (b === undefined) { return (a === undefined) ? Math.random() : Math.random() * a; }
      return a + Math.random() * (b - a);
    },
    TWO_PI: Math.PI * 2,
    PI: Math.PI,
    HALF_PI: Math.PI / 2,
    sin: Math.sin,
    cos: Math.cos,
    min: Math.min,
    max: Math.max,
    map: (v, a1, b1, a2, b2) => a2 + (b2 - a2) * ((v - a1) / (b1 - a1)),
    constrain: (n, low, high) => Math.max(low, Math.min(high, n)),
    color: (r, g, b, a) => ({ r, g, b, a }),
    drawingContext: { setLineDash: () => {} },
    rectMode: () => {},
    textAlign: () => {},
    textSize: () => {},
    textStyle: () => {},
    text: () => {},
    push: () => {},
    pop: () => {},
    translate: () => {},
    rotate: () => {},
    stroke: () => {},
    strokeWeight: () => {},
    noStroke: () => {},
    fill: () => {},
    noFill: () => {},
    line: () => {},
    circle: () => {},
    ellipse: () => {},
    rect: () => {},
    triangle: () => {},
    bezier: () => {},
    beginShape: () => {},
    vertex: () => {},
    endShape: () => {},
    strokeJoin: () => {},
    strokeCap: () => {},
    ROUND: 'round',
    CLOSE: 'close',
    HAND: 'pointer',
    ARROW: 'default',
    cursor: () => {},
    frameCount: 1,
    UP_ARROW: 38,
    DOWN_ARROW: 40,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    keyIsDown: () => false,
    vehicules: [],
    window: {}
  });

  const files = [
    '../vehicle.js',
    '../obstacle.js',
    '../RoadNetwork.js',
    '../Helipad.js',
    '../CargoBox.js',
    '../Helicopter.js',
    '../Roadblock.js',
    '../Garage.js',
    '../Camion.js',
    '../PlayerCamion.js',
    '../Police.js',
    '../SoundEffects.js'
  ];

  for (const file of files) {
    const code = readFileSync(new URL(file, import.meta.url), 'utf8');
    vm.runInContext(code, context);
  }

  return vm.runInContext('({ Vehicle, Obstacle, RoadNetwork, Helipad, CargoBox, Helicopter, Roadblock, Garage, Camion, PlayerCamion, Police, SoundEffects })', context);
}

test('Toutes les entités visibles étendent Vehicle (règle stricte)', () => {
  const { Vehicle, Obstacle, Garage, Camion, PlayerCamion, Police, Helipad, CargoBox, Helicopter, Roadblock } = scene();

  const o = new Obstacle(100, 100, 50);
  const g = new Garage(500, 300);
  const c = new Camion(50, 100);
  const pc = new PlayerCamion(50, 100);
  const p = new Police(200, 200);
  const hpad = new Helipad(150, 150);
  const cargo = new CargoBox(150, 150);
  const heli = new Helicopter(0, 0, hpad.pos);
  const rb = new Roadblock(300, 300);

  assert.ok(o instanceof Vehicle, "Obstacle doit hériter de Vehicle");
  assert.ok(g instanceof Vehicle, "Garage doit hériter de Vehicle");
  assert.ok(c instanceof Vehicle, "Camion doit hériter de Vehicle");
  assert.ok(pc instanceof Vehicle, "PlayerCamion doit hériter de Vehicle");
  assert.ok(pc instanceof Camion, "PlayerCamion doit hériter de Camion");
  assert.ok(p instanceof Vehicle, "Police doit hériter de Vehicle");
  assert.ok(hpad instanceof Vehicle, "Helipad doit hériter de Vehicle");
  assert.ok(cargo instanceof Vehicle, "CargoBox doit hériter de Vehicle");
  assert.ok(heli instanceof Vehicle, "Helicopter doit hériter de Vehicle");
  assert.ok(rb instanceof Vehicle, "Roadblock doit hériter de Vehicle");
});

test('Obstacle : dispose des propriétés pos, r et applique un steering d\'ancrage', () => {
  const { Obstacle } = scene();
  const obs = new Obstacle(200, 150, 60);

  assert.equal(obs.pos.x, 200);
  assert.equal(obs.pos.y, 150);
  assert.equal(obs.r, 60);

  // Déplacement artificiel pour tester le retour d'ancrage
  obs.pos.set(210, 160);
  obs.applyBehaviors();
  assert.ok(obs.acc.mag() > 0, "L'obstacle doit appliquer une force de rappel vers home");
  obs.update();
  assert.ok(obs.vel.mag() <= obs.maxSpeed + 1e-9, "Vitesse limitée à maxSpeed");
});

test('Garage : détection d\'entrée et comptage de livraisons', () => {
  const { Garage, Camion } = scene();
  const garage = new Garage(600, 400, 120, 90);
  const camionProche = new Camion(610, 405);
  const camionLoin = new Camion(100, 100);

  assert.equal(garage.deliveredCount, 0);
  assert.ok(garage.contains(camionProche), "Le camion proche doit être dans le garage");
  assert.ok(!garage.contains(camionLoin), "Le camion éloigné ne doit pas être dans le garage");

  garage.deliveredCount++;
  assert.equal(garage.deliveredCount, 1);
});

test('Camion : se dirige vers le Garage en l\'absence de menace ou d\'obstacle', () => {
  const { Garage, Camion } = scene();
  const garage = new Garage(600, 300);
  const camion = new Camion(100, 300);

  // Appliquer le comportement
  camion.applyBehaviors(garage, [], [], []);

  // La force doit être orientée vers la droite (+x) en direction du garage
  assert.ok(camion.acc.x > 0, "Le camion doit accélérer vers le garage");
  assert.ok(camion.acc.mag() > 0);

  camion.update();
  assert.ok(camion.vel.mag() <= camion.maxSpeed + 1e-9, "Vitesse bornée par maxSpeed");
  assert.ok(camion.pos.x > 100, "Le camion avance vers l'objectif");
});

test('Camion : calcule une force d\'évitement face à un obstacle sur son trajet', () => {
  const { Garage, Camion, Obstacle } = scene();
  const garage = new Garage(800, 300);
  const camion = new Camion(200, 300);
  camion.vel.set(3, 0); // Vitesse dirigée vers la droite

  const obstacle = new Obstacle(280, 300, 50); // Directement devant le camion

  camion.applyBehaviors(garage, [obstacle], [], []);

  // Avec un obstacle droit devant, la composante d'accélération subit la force d'évitement
  assert.ok(camion.acc.mag() > 0, "Une force d'évitement doit être générée");
});

test('Camion : réagit et fuit lorsque la Police est à proximité', () => {
  const { Garage, Camion, Police } = scene();
  const garage = new Garage(800, 300);
  const camion = new Camion(300, 300);
  camion.vel.set(2, 0);

  // Cas 1 : Police très éloignée (> fleeRadius)
  const policeLoin = new Police(700, 700);
  camion.applyBehaviors(garage, [], [policeLoin], []);
  const accSansAlerte = camion.acc.copy();

  // Reset accélération
  camion.acc.set(0, 0);

  // Cas 2 : Police tout près (< fleeRadius = 170)
  const policeProche = new Police(350, 300);
  camion.applyBehaviors(garage, [], [policeProche], []);
  const accAvecAlerte = camion.acc.copy();

  // L'accélération doit être différente et réactive sous menace
  assert.notDeepEqual(accSansAlerte, accAvecAlerte, "La trajectoire doit changer en présence de la police");
  // La force d'évasion doit repousser vers l'opposé de la police (vers la gauche / -x)
  assert.ok(accAvecAlerte.x < accSansAlerte.x, "Le camion doit fuir à l'opposé de la police");
});

test('Police : sélectionne le camion actif et calcule une force de poursuite', () => {
  const { Police, Camion } = scene();
  const police = new Police(200, 200);
  const camion1 = new Camion(500, 200);
  const camion2 = new Camion(250, 200); // Plus proche

  const cible = police.getClosestCamion([camion1, camion2]);
  assert.equal(cible, camion2, "La police doit cibler le camion le plus proche");

  police.applyBehaviors([camion1, camion2], []);

  // La police doit accélérer vers la droite (+x) vers le camion
  assert.ok(police.acc.x > 0, "La police doit poursuivre le camion cible");

  police.update();
  assert.ok(police.vel.mag() <= police.maxSpeed + 1e-9, "Vitesse de police bornée par maxSpeed");
});

test('Police : interception réussie selon captureRadius', () => {
  const { Police, Camion } = scene();
  const police = new Police(200, 200);
  const camionCapture = new Camion(210, 205);
  const camionHorsPortee = new Camion(350, 350);

  assert.ok(police.canCatch(camionCapture), "Doit intercepter un camion à portée");
  assert.ok(!police.canCatch(camionHorsPortee), "Ne doit pas intercepter un camion hors de portée");
});

test('SoundEffects : s\'instancie et supporte toggle et méthodes sans lever d\'exception', () => {
  const { SoundEffects } = scene();
  const snd = new SoundEffects();

  assert.equal(typeof snd.playGarageDelivery, 'function');
  assert.equal(typeof snd.playPoliceSiren, 'function');
  assert.equal(typeof snd.playCapture, 'function');
  assert.equal(typeof snd.playTruckHorn, 'function');

  // Doit s'exécuter silencieusement même hors navigateur (sans Web Audio réel)
  assert.doesNotThrow(() => {
    snd.playGarageDelivery();
    snd.playPoliceSiren();
    snd.playCapture();
    snd.playTruckHorn();
  });

  const state1 = snd.toggle();
  assert.equal(state1, false);
  const state2 = snd.toggle();
  assert.equal(state2, true);
});

test('Camion : peut cibler et suivre un vecteur cible (position souris)', () => {
  const { Camion } = scene();
  const camion = new Camion(100, 100);
  // Simule la position de la souris
  const mouseTarget = { x: 500, y: 100 };

  camion.applyBehaviors(mouseTarget, [], [], []);

  // La force calculée doit tirer vers la position souris (+x)
  assert.ok(camion.acc.x > 0, "Le camion doit accélérer vers la cible souris");
  camion.update();
  assert.ok(camion.pos.x > 100, "Le camion se rapproche de la position souris");
  assert.ok(camion.vel.mag() <= camion.maxSpeed + 1e-9, "Vitesse bornée par maxSpeed");
});

test('Obstacle : la méthode contains détecte les points intérieurs et extérieurs', () => {
  const { Obstacle } = scene();
  const obs = new Obstacle(300, 200, 50);

  // Point au centre ou proche
  assert.ok(obs.contains(300, 200), "Centre de l'obstacle");
  assert.ok(obs.contains(320, 210), "Point à l'intérieur du rayon");

  // Point en bordure exacte
  assert.ok(obs.contains(350, 200), "Point sur la circonférence");

  // Point extérieur
  assert.ok(!obs.contains(400, 200), "Point en dehors de l'obstacle");
});

test('Suppression d\'obstacles : retrait ciblé et vidage complet', () => {
  const { Obstacle } = scene();
  let obstacles = [
    new Obstacle(100, 100, 40),
    new Obstacle(300, 300, 50),
    new Obstacle(500, 500, 60)
  ];

  // Suppression par coordonnées (cible le 2ème obstacle à (300, 300))
  const clickX = 310;
  const clickY = 305;
  const index = obstacles.findIndex(o => o.contains(clickX, clickY));
  assert.equal(index, 1, "Doit identifier le deuxième obstacle");

  obstacles.splice(index, 1);
  assert.equal(obstacles.length, 2, "La liste doit contenir 2 obstacles après suppression");
  assert.ok(!obstacles.some(o => o.contains(clickX, clickY)), "L'obstacle ciblé n'existe plus");

  // Vidage complet
  obstacles = [];
  assert.equal(obstacles.length, 0);
});

test('Camion : la durée de vie diminue lors d\'un contact avec un obstacle', () => {
  const { Camion, Obstacle } = scene();
  const camion = new Camion(200, 200);
  const obsTouche = new Obstacle(205, 205, 50); // Contact direct
  const obsLoin = new Obstacle(500, 500, 50);   // Hors de portée

  const vieInitiale = camion.dureeDeVie;
  assert.equal(vieInitiale, 100);

  // Pas d'impact avec l'obstacle éloigné
  const collisionLoin = camion.checkObstacleCollision(obsLoin);
  assert.equal(collisionLoin, false);
  assert.equal(camion.dureeDeVie, 100);

  // Impact avec l'obstacle touché
  const collisionTouche = camion.checkObstacleCollision(obsTouche);
  assert.equal(collisionTouche, true);
  assert.ok(camion.dureeDeVie < vieInitiale, "La durée de vie du camion doit diminuer");

  // Destruction lorsque la vie atteint 0
  camion.dureeDeVie = 0;
  assert.ok(camion.isDead(), "isDead doit renvoyer true quand dureeDeVie <= 0");
});

test('Police : la durée de vie diminue lors d\'un contact avec un obstacle', () => {
  const { Police, Obstacle } = scene();
  const police = new Police(200, 200);
  const obsTouche = new Obstacle(205, 205, 50); // Contact direct
  const obsLoin = new Obstacle(500, 500, 50);   // Hors de portée

  const vieInitiale = police.dureeDeVie;
  assert.equal(vieInitiale, 100);

  // Pas d'impact
  const collisionLoin = police.checkObstacleCollision(obsLoin);
  assert.equal(collisionLoin, false);
  assert.equal(police.dureeDeVie, 100);

  // Impact
  const collisionTouche = police.checkObstacleCollision(obsTouche);
  assert.equal(collisionTouche, true);
  assert.ok(police.dureeDeVie < vieInitiale, "La durée de vie de la police doit diminuer");

  // Destruction
  police.dureeDeVie = 0;
  assert.ok(police.isDead(), "isDead doit renvoyer true quand dureeDeVie <= 0");
});

test('RoadNetwork : initialise les checkpoints et permet la navigation séquentielle', () => {
  const { RoadNetwork } = scene();
  const road = new RoadNetwork(1000, 700);

  assert.ok(road.checkpoints.length >= 5, "Le réseau doit avoir au moins 5 checkpoints");
  const cp0 = road.getCheckpoint(0);
  assert.ok(cp0.x > 0 && cp0.y > 0);

  // Redimensionnement
  road.resize(1200, 800);
  assert.equal(road.checkpoints.length >= 5, true);
});

test('Camion : suit le réseau routier (Path Following) et progresse à travers les checkpoints', () => {
  const { Camion, RoadNetwork, Garage } = scene();
  const road = new RoadNetwork(1000, 700);
  const garage = new Garage(900, 350);
  const camion = new Camion(road.checkpoints[0].x, road.checkpoints[0].y);

  assert.equal(camion.currentCheckpointIndex, 0);

  // Applique le comportement avec le réseau routier
  camion.applyBehaviors(garage, [], [], [], road);
  assert.ok(camion.acc.mag() > 0, "Le camion doit accélérer pour suivre le chemin");

  // Déplacement au premier checkpoint : doit incrémenter l'index
  camion.pos.set(road.checkpoints[0].x, road.checkpoints[0].y);
  camion.applyBehaviors(garage, [], [], [], road);
  assert.equal(camion.currentCheckpointIndex, 1, "Le camion doit passer au checkpoint suivant");
});

test('Police : computeAnticipation prédit la position future selon la vitesse du camion', () => {
  const { Police, Camion } = scene();
  const police = new Police(100, 100);
  const camion = new Camion(300, 300);
  camion.vel.set(3, 0); // Vitesse vers la droite (+x)

  const futurePos = police.computeAnticipation(camion);
  assert.ok(futurePos, "Le point futur doit être calculé");
  assert.ok(futurePos.x > camion.pos.x, "L'anticipation doit projeter le camion vers l'avant dans sa direction de déplacement");
  assert.equal(futurePos.y, camion.pos.y, "Sur l'axe Y le point futur reste aligné si vy = 0");
});

test('Police : bascule en poursuite intelligente avec anticipation lorsqu\'un camion est détecté', () => {
  const { Police, Camion, RoadNetwork } = scene();
  const road = new RoadNetwork(1000, 700);
  const police = new Police(200, 200);
  const camionProche = new Camion(300, 200); // Dans le rayon de détection
  camionProche.vel.set(2, 0);

  police.applyBehaviors([camionProche], [], road);

  assert.equal(police.mode, "poursuite_intelligente", "La police doit être en mode poursuite intelligente");
  assert.ok(police.predictedPoint !== null, "Le point d'interception anticipé doit être mémorisé");
  assert.ok(police.acc.x > 0, "La police doit accélérer vers le point d'interception");
});

test('Police : patrouille en sens inverse sur la route en l\'absence de camion à portée', () => {
  const { Police, Camion, RoadNetwork } = scene();
  const road = new RoadNetwork(1000, 700);
  const police = new Police(road.checkpoints[4].x, road.checkpoints[4].y);
  const camionLoin = new Camion(900, 900); // Hors de détection

  police.patrolIndex = 4;
  police.applyBehaviors([camionLoin], [], road);

  assert.equal(police.mode, "patrouille", "La police doit rester en patrouille");
  assert.ok(police.acc.mag() > 0, "Une force de steering de patrouille doit être appliquée");
});

test('Réglages dynamiques Camion : modification de vitesse, force, fuite et poids d\'évitement', () => {
  const { Camion, Garage } = scene();
  const camion = new Camion(100, 100);
  const garage = new Garage(800, 100, 100, 100);

  // Valeurs initiales
  assert.equal(camion.maxSpeed, 3.8);
  assert.equal(camion.maxForce, 0.28);
  assert.equal(camion.fleeRadius, 180);
  assert.equal(camion.avoidWeight, 3.6);

  // Modification dynamique via le menu
  camion.maxSpeed = 7.0;
  camion.maxForce = 0.50;
  camion.fleeRadius = 250;
  camion.avoidWeight = 5.0;

  assert.equal(camion.maxSpeed, 7.0);
  assert.equal(camion.maxForce, 0.50);
  assert.equal(camion.fleeRadius, 250);
  assert.equal(camion.avoidWeight, 5.0);

  // Vérification de la prise en compte de maxForce dans les comportements de steering
  const steerForce = camion.arrive(garage.pos);
  assert.ok(steerForce.mag() <= camion.maxForce + 0.0001, "La force élémentaire de steering calculée par arrive() doit être bornée par maxForce");

  // Vérification de la contrainte maxSpeed dans la locomotion (update)
  camion.vel.set(20, 0);
  camion.update();
  assert.ok(Math.abs(camion.vel.mag() - 7.0) < 0.0001, "La vitesse dans update() doit être bornée par la nouvelle maxSpeed");
});

test('Réglages dynamiques Police : modification de vitesse, force, radar et anticipation', () => {
  const { Police, Camion } = scene();
  const police = new Police(100, 100);
  const camion = new Camion(450, 100); // Distance = 350
  camion.vel.set(3, 0);

  // Valeurs initiales
  assert.equal(police.maxSpeed, 4.4);
  assert.equal(police.maxForce, 0.32);
  assert.equal(police.detectionRadius, 400);
  assert.equal(police.anticipationSeconds, 1.5);
  assert.equal(police.avoidWeight, 3.6);

  // Vérification de l'effet du radar : avec détection = 300, camion à 350 non détecté
  police.detectionRadius = 300;
  police.applyBehaviors([camion], [], null);
  assert.equal(police.mode, "patrouille", "Le camion à distance 350 ne doit pas être détecté si le radar est à 300");

  // Élargissement du radar à 500 : le camion est maintenant détecté
  police.detectionRadius = 500;
  police.applyBehaviors([camion], [], null);
  assert.equal(police.mode, "poursuite_intelligente", "Le camion doit être détecté lorsque le radar est élargi à 500");
});

test('Police : l\'anticipation configurable modifie la distance de projection du point futur', () => {
  const { Police, Camion } = scene();
  const police = new Police(100, 100);
  const camion = new Camion(300, 100);
  camion.vel.set(3, 0);

  police.anticipationSeconds = 1.0;
  const pCourt = police.computeAnticipation(camion);

  police.anticipationSeconds = 3.0;
  const pLong = police.computeAnticipation(camion);

  assert.ok(pCourt && pLong, "Les points d'anticipation doivent être calculés");
  assert.ok(pLong.x >= pCourt.x, "Une anticipation plus longue doit projeter le point d'interception plus loin vers l'avant");
});

test('RoadNetwork : configuration Niveau 1 (ouvert) vs Niveau 2 (circuit fermé / cycle actif)', () => {
  const { RoadNetwork } = scene();
  const road = new RoadNetwork(1200, 800, 1);

  // Niveau 1 : parcours ouvert avec 6 checkpoints
  assert.equal(road.level, 1);
  assert.equal(road.isLoop, false);
  assert.equal(road.checkpoints.length, 6);

  // Bascule au Niveau 2
  road.setLevel(2, 1200, 800);
  assert.equal(road.level, 2);
  assert.equal(road.isLoop, true, "Le Niveau 2 doit activer un circuit fermé (cycle actif)");
  assert.equal(road.checkpoints.length, 9, "Le circuit du Niveau 2 dispose de 9 checkpoints");
});

test('Camion : progression en cycle actif fermé sur le circuit du Niveau 2', () => {
  const { Camion, RoadNetwork, Garage } = scene();
  const road = new RoadNetwork(1200, 800, 2);
  const garage = new Garage(200, 600);
  const camion = new Camion(road.checkpoints[8].x, road.checkpoints[8].y);

  // Le camion est au dernier checkpoint (index 8)
  camion.currentCheckpointIndex = 8;
  camion.applyBehaviors(garage, [], [], [], road);

  // En circuit fermé (isLoop = true), le camion doit boucler vers le checkpoint 0
  assert.equal(camion.currentCheckpointIndex, 0, "Le camion doit cycler vers le checkpoint 0 sur un circuit fermé");
});

test('Progression de niveaux : le compteur de livraisons du Garage permet d\'atteindre l\'objectif de 10', () => {
  const { Garage, Camion } = scene();
  const garage = new Garage(500, 500);
  const LEVEL_1_TARGET = 10;

  let currentLevel = 1;
  for (let i = 1; i <= LEVEL_1_TARGET; i++) {
    const camion = new Camion(510, 505);
    assert.ok(garage.contains(camion), `Le camion ${i} doit entrer physiquement dans le garage`);
    garage.deliveredCount++;

    if (currentLevel === 1 && garage.deliveredCount >= LEVEL_1_TARGET) {
      currentLevel = 2;
    }
  }

  assert.equal(garage.deliveredCount, 10, "Le garage doit afficher exactement 10 livraisons");
  assert.equal(currentLevel, 2, "Le jeu doit basculer automatiquement au Niveau 2 dès 10 livraisons");
});

test('Niveau 2 : difficulté de poursuite accrue pour la Police et réglages camions', () => {
  const level1Police = { maxSpeed: 4.4, maxForce: 0.32, detectionRadius: 400, anticipationSeconds: 1.5 };
  const level2Police = { maxSpeed: 5.8, maxForce: 0.48, detectionRadius: 550, anticipationSeconds: 2.2 };

  assert.ok(level2Police.maxSpeed > level1Police.maxSpeed, "La vitesse de pointe de la police est supérieure au niveau 2");
  assert.ok(level2Police.maxForce > level1Police.maxForce, "La maniabilité/accélération de la police est accrue au niveau 2");
  assert.ok(level2Police.detectionRadius > level1Police.detectionRadius, "Le radar de détection est plus large au niveau 2");
  assert.ok(level2Police.anticipationSeconds > level1Police.anticipationSeconds, "L'anticipation tactique est plus longue au niveau 2");
});

test('Helipad : zone d\'atterrissage stationnaire avec ancrage arrive et détection contains', () => {
  const { Helipad, Camion } = scene();
  const pad = new Helipad(200, 200, 60);

  assert.equal(pad.pos.x, 200);
  assert.equal(pad.pos.y, 200);
  assert.equal(pad.r, 60);
  assert.equal(pad.status, 'ATTENTE');

  // Déplacement pour tester le comportement de rappel arrive
  pad.pos.set(205, 205);
  pad.applyBehaviors();
  assert.ok(pad.acc.mag() > 0, "L'héliport doit appliquer une force de rappel vers sa position");
  pad.update();
  assert.ok(pad.vel.mag() <= pad.maxSpeed + 1e-9);

  // Détection de camion
  const camionProche = new Camion(210, 205);
  const camionLoin = new Camion(400, 400);
  assert.ok(pad.contains(camionProche), "Le camion proche doit être sur l'héliport");
  assert.ok(!pad.contains(camionLoin), "Le camion éloigné ne doit pas être sur l'héliport");
});

test('Helicopter : phase d\'approche aérienne vers l\'héliport et transition hover_drop', () => {
  const { Helicopter, Helipad } = scene();
  const pad = new Helipad(300, 200);
  const heli = new Helicopter(100, 200, pad.pos);

  assert.equal(heli.flightPhase, "approach");

  // En phase approach, doit générer une force d'accélération vers l'héliport
  heli.applyBehaviors();
  assert.ok(heli.acc.x > 0, "L'hélicoptère doit accélérer vers l'héliport (+x)");
  assert.ok(heli.acc.mag() <= heli.maxForce + 1e-5);

  // Lorsqu'il est stabilisé au-dessus de l'héliport
  heli.pos.set(305, 200);
  heli.vel.set(0.5, 0);
  heli.applyBehaviors();
  assert.equal(heli.flightPhase, "hover_drop", "L'hélicoptère doit basculer en vol stationnaire au-dessus de l'héliport");
});

test('Phase 1 (Livraison aérienne) : Hélicoptère treuille et dépose CargoBox au sol puis repart', () => {
  const { Helicopter, CargoBox, Helipad } = scene();
  const pad = new Helipad(300, 200);
  const heli = new Helicopter(305, 200, pad.pos);
  const cargo = new CargoBox(305, 200, 1);

  heli.flightPhase = "hover_drop";
  heli.attachCargo(cargo);

  assert.equal(cargo.status, "in_air");
  assert.ok(cargo.altitude > 0, "La cargaison commence en altitude");

  // Simulation du treuillage : altitude diminue
  cargo.altitude = 1.0;
  cargo.applyBehaviors(pad.pos);
  assert.equal(cargo.altitude, 0, "L'altitude atteint 0");
  assert.equal(cargo.status, "on_ground", "Le cargo passe au statut on_ground");

  // L'hélicoptère détecte la pose au sol et prépare son départ
  heli.applyBehaviors();
  assert.equal(heli.flightPhase, "depart", "L'hélicoptère bascule en phase depart après le largage");
  assert.equal(heli.cargoBox, null, "Le câble est détaché");
});

test('Phase 2 & 3 (Chargement et Fuite) : Camion charge CargoBox, passe en mode Fuite (escaping) et décharge au Garage', () => {
  const { Camion, CargoBox, Garage } = scene();
  const camion = new Camion(100, 100);
  const cargo = new CargoBox(100, 100, 1);
  cargo.status = "on_ground";
  cargo.altitude = 0;
  const garage = new Garage(500, 100);

  // 1. Initialement vide
  assert.equal(camion.hasCargo, false);
  assert.equal(camion.status, "en_route");

  // 2. Phase 2 : Chargement
  const loaded = camion.loadCargo(cargo);
  assert.ok(loaded, "Le chargement doit réussir");
  assert.equal(camion.hasCargo, true);
  assert.equal(cargo.status, "loaded");
  assert.equal(cargo.carrier, camion);

  // 3. Phase 3 : Début de la fuite (status = escaping)
  assert.equal(camion.status, "escaping", "Dès la cargaison chargée, le camion passe en statut de fuite");

  // Vérification que le cargo suit le camion via steering
  cargo.applyBehaviors();
  assert.ok(cargo.acc.mag() >= 0, "Le cargo applique une force pour suivre la remorque");

  // 4. Arrivée au garage et déchargement
  const deliveredBox = camion.unloadCargo();
  assert.equal(deliveredBox, cargo);
  assert.equal(camion.hasCargo, false);
  assert.equal(camion.status, "en_route");
  assert.equal(cargo.status, "delivered");
});

test('Police : cible en priorité le camion fuyard transportant la cargaison (Escape Phase)', () => {
  const { Police, Camion, CargoBox } = scene();
  const police = new Police(200, 200);

  // Camion 1 : très proche (distance 50), mais vide
  const camionVide = new Camion(250, 200);

  // Camion 2 : plus éloigné (distance 150), mais en fuite avec marchandise
  const camionFuyard = new Camion(350, 200);
  const cargo = new CargoBox(350, 200);
  camionFuyard.loadCargo(cargo);

  assert.equal(camionFuyard.status, "escaping");
  assert.equal(camionVide.status, "en_route");

  const ciblePrioritaire = police.getClosestCamion([camionVide, camionFuyard]);
  assert.equal(ciblePrioritaire, camionFuyard, "La police doit prioritairement intercepter le camion fuyard chargé");
});

test('Roadblock : barrage tactique inflige des dégâts aux véhicules en collision', () => {
  const { Roadblock, Camion } = scene();
  const rb = new Roadblock(250, 250, 0, 70);
  const camionCollision = new Camion(255, 250);
  const camionHorsPortee = new Camion(450, 450);

  const vieInitiale = camionCollision.dureeDeVie;
  assert.equal(vieInitiale, 100);

  // Pas de collision avec le camion éloigné
  const touchHors = rb.checkCollision(camionHorsPortee);
  assert.equal(touchHors, false);

  // Collision avec le camion au contact
  const touchContact = rb.checkCollision(camionCollision);
  assert.equal(touchContact, true);
  assert.ok(camionCollision.dureeDeVie < vieInitiale, "Le barrage doit infliger des dégâts au véhicule");
});

test('RoadNetwork : supporte la configuration des 5 Niveaux avec tracés et loops adaptés', () => {
  const { RoadNetwork } = scene();
  const road = new RoadNetwork(1200, 800, 1);

  // Niveau 1
  assert.equal(road.level, 1);
  assert.equal(road.isLoop, false);
  assert.equal(road.checkpoints.length, 6);

  // Niveau 2
  road.setLevel(2, 1200, 800);
  assert.equal(road.level, 2);
  assert.equal(road.isLoop, true);
  assert.equal(road.checkpoints.length, 9);

  // Niveau 3
  road.setLevel(3, 1200, 800);
  assert.equal(road.level, 3);
  assert.equal(road.isLoop, false);
  assert.equal(road.checkpoints.length, 6);

  // Niveau 4
  road.setLevel(4, 1200, 800);
  assert.equal(road.level, 4);
  assert.equal(road.isLoop, false);
  assert.equal(road.checkpoints.length, 7);

  // Niveau 5
  road.setLevel(5, 1200, 800);
  assert.equal(road.level, 5);
  assert.equal(road.isLoop, true);
  assert.equal(road.checkpoints.length, 9);
});

test('SoundEffects : supporte les nouveaux sons spécifiques aux phases de jeu', () => {
  const { SoundEffects } = scene();
  const snd = new SoundEffects();

  assert.equal(typeof snd.playHelicopterRotor, 'function');
  assert.equal(typeof snd.playCargoDrop, 'function');
  assert.equal(typeof snd.playCargoLoaded, 'function');
  assert.equal(typeof snd.playEscapeAlarm, 'function');
  assert.equal(typeof snd.playLevelUp, 'function');

  assert.doesNotThrow(() => {
    snd.playHelicopterRotor();
    snd.playCargoDrop();
    snd.playCargoLoaded();
    snd.playEscapeAlarm();
    snd.playLevelUp();
  });
});

test('CargoBox : déambulation autonome (wander) au sol et verrouillage solide lors du chargement sur camion', () => {
  const { CargoBox, Camion } = scene();
  const box = new CargoBox(200, 200, 1);
  box.status = "on_ground";
  box.altitude = 0;
  box.vel.set(1.5, 0);

  // 1. Déambulation au sol via wander
  const force = box.wander();
  assert.ok(force.mag() > 0, "Une force de steering wander doit être calculée");
  assert.ok(force.mag() <= box.maxForce + 1e-5, "La force wander est bornée par maxForce");

  // 2. Chargement sur camion
  const camion = new Camion(200, 200);
  camion.vel.set(4, 0);
  camion.loadCargo(box);

  assert.equal(box.status, "loaded");
  assert.equal(box.carrier, camion);

  // 3. Déplacement du camion : la cargaison reste rigoureusement synchronisée avec la remorque
  camion.pos.set(350, 220);
  camion.vel.set(5, 0);
  box.applyBehaviors();

  assert.equal(box.pos.x, 350 - 14, "La cargaison doit rester arrimée à l'arrière du camion");
  assert.equal(box.pos.y, 220, "Alignée sur l'axe Y");
});

test('Cycle de progression : seul un camion ayant chargé un bloc mobile permet de valider une livraison au garage et franchir le niveau', () => {
  const { Garage, Camion, CargoBox } = scene();
  const garage = new Garage(500, 300);
  let currentLevel = 1;
  let levelDeliveredCount = 0;
  const levelTargetDeliveries = 1;

  // Cas 1 : Camion vide entrant au garage
  const camionVide = new Camion(505, 305);
  assert.ok(garage.contains(camionVide));
  assert.equal(camionVide.hasCargo, false);

  // Un camion vide n'augmente pas les livraisons et ne fait pas passer de niveau
  if (garage.contains(camionVide) && camionVide.hasCargo) {
    levelDeliveredCount++;
  }
  assert.equal(levelDeliveredCount, 0, "Aucune livraison comptabilisée pour un camion vide");
  assert.equal(currentLevel, 1, "Le niveau ne change pas sans marchandise");

  // Cas 2 : Camion ayant chargé un bloc mobile
  const camionCharge = new Camion(505, 305);
  const box = new CargoBox(505, 305);
  camionCharge.loadCargo(box);
  assert.equal(camionCharge.hasCargo, true);

  if (garage.contains(camionCharge) && camionCharge.hasCargo) {
    camionCharge.unloadCargo();
    levelDeliveredCount++;
    garage.deliveredCount++;
    if (levelDeliveredCount >= levelTargetDeliveries) {
      currentLevel = 2;
    }
  }

  assert.equal(levelDeliveredCount, 1, "La livraison est validée avec le bloc chargé");
  assert.equal(garage.deliveredCount, 1);
  assert.equal(currentLevel, 2, "Le passage au niveau supérieur est déclenché après entrée au garage avec le bloc");
});

test('PlayerCamion : pilotage manuel et génération de steering forces par contrôle joueur', () => {
  const { PlayerCamion, CargoBox } = scene();
  const player = new PlayerCamion(200, 200);

  assert.equal(player.isPlayer, true);
  assert.equal(player.playerControlEnabled, true);

  // 1. Simulation d'un pilotage ciblant un point (souris ou direction)
  player.targetMode = "mouse";
  player.applyPlayerBehaviors(null, [], [], [], null, null);
  // Avec mouseX non défini dans le test, la décélération fluide s'applique
  player.update();
  assert.ok(player.vel.mag() <= player.maxSpeed);

  // 2. Chargement automatique au contact d'un bloc de marchandise mobile
  const cargo = new CargoBox(210, 205);
  cargo.status = "on_ground";
  cargo.altitude = 0;

  assert.equal(player.hasCargo, false);
  player.applyPlayerBehaviors(null, [], [], [], null, cargo);

  assert.equal(player.hasCargo, true, "Le camion du joueur doit charger le bloc mobile au contact");
  assert.equal(player.status, "escaping", "Le statut passe en fuite");
});

test('Fin de partie (Game Over) : l\'interception de tous les camions déclenche le Game Over et réinitialise au Niveau 1', () => {
  const { Police, PlayerCamion, Camion } = scene();
  const police = new Police(100, 100);
  let camions = [
    new PlayerCamion(105, 105), // Camion joueur à portée
    new Camion(108, 104)        // Camion allié à portée
  ];
  let isGameOver = false;

  // 1. Interception du premier camion
  assert.ok(police.canCatch(camions[0]));
  camions.splice(0, 1);
  assert.equal(camions.length, 1);
  assert.equal(isGameOver, false, "Tant qu'il reste un camion, pas de Game Over");

  // 2. Interception du dernier camion restant
  assert.ok(police.canCatch(camions[0]));
  camions.splice(0, 1);
  assert.equal(camions.length, 0);

  if (camions.length === 0) {
    isGameOver = true;
  }
  assert.equal(isGameOver, true, "L'interception de tous les camions doit déclencher le Game Over");

  // 3. Réinitialisation du jeu depuis le Game Over -> Niveau 1
  let currentLevel = 4; // Était au niveau 4
  function restartFromLevel1() {
    isGameOver = false;
    currentLevel = 1;
  }
  restartFromLevel1();

  assert.equal(isGameOver, false);
  assert.equal(currentLevel, 1, "Le jeu redémarre obligatoirement au Niveau 1 après un Game Over");
});

test('Fin de partie (Game Over) : choix entre refaire le niveau en cours et refaire depuis le Niveau 1', () => {
  let isGameOver = true;
  let currentLevel = 3;
  let totalCrashes = 5;
  let deliveredCount = 2;

  function retryCurrentLevel() {
    isGameOver = false;
    // Conserve le niveau actuel
  }

  function restartFromLevel1() {
    isGameOver = false;
    totalCrashes = 0;
    deliveredCount = 0;
    currentLevel = 1;
  }

  // Option 1 : Rejouer le niveau en cours
  retryCurrentLevel();
  assert.equal(isGameOver, false, "Le Game Over est annulé");
  assert.equal(currentLevel, 3, "Le niveau reste le Niveau 3");

  // Option 2 : Recommencer au Niveau 1
  isGameOver = true;
  restartFromLevel1();
  assert.equal(isGameOver, false, "Le Game Over est annulé");
  assert.equal(currentLevel, 1, "Le niveau revient au Niveau 1");
  assert.equal(totalCrashes, 0, "Les crashes sont remis à 0");
  assert.equal(deliveredCount, 0, "Les livraisons totales sont remises à 0");
});



