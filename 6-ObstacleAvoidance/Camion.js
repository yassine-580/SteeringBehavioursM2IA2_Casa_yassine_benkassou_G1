// Classe Camion : sous-classe de Vehicle
// Gère le cycle logistique complet :
// Phase 2 : Ralliement de la zone d'atterrissage et chargement de la cargaison
// Phase 3 : Mode Fuite ("Escape Phase") sous pression vers le Garage sécurisé
class Camion extends Vehicle {
  constructor(x, y, color = "#FB8C00") {
    super(x, y);
    this.maxSpeed = 3.8;
    this.maxForce = 0.28;
    this.r = 30;
    this.r_pourDessin = 18;
    this.color = color;
    this.fleeRadius = 180;
    this.avoidWeight = 3.6;

    // Statuts logistiques : "going_to_cargo" (chargement), "escaping" (fuite avec marchandise), "en_route"
    this.status = "en_route";
    this.hasCargo = false;
    this.cargoBox = null;

    this.targetMode = "path"; // "path", "garage" ou "mouse"
    this.currentCheckpointIndex = 0;
    this.checkpointRadius = 50;
    this.id = Math.floor(Math.random() * 10000);

    // Durée de vie et gestion des dégâts d'obstacles
    this.maxDureeDeVie = 100;
    this.dureeDeVie = 100;
    this.hitFlash = 0;
    this.escapeStrobe = 0;
  }

  // Chargement physique de la palette de marchandises (Phase 2)
  loadCargo(cargoBox) {
    if (!cargoBox || this.hasCargo) return false;
    this.hasCargo = true;
    this.cargoBox = cargoBox;
    this.status = "escaping";
    cargoBox.loadOnto(this);
    return true;
  }

  // Déchargement réussi au Garage
  unloadCargo() {
    if (!this.hasCargo) return null;
    let box = this.cargoBox;
    if (box) box.deliver();
    this.hasCargo = false;
    this.cargoBox = null;
    this.status = "en_route";
    return box;
  }

  // Vérifie si le camion touche un obstacle et diminue sa durée de vie
  checkObstacleCollision(obstacle) {
    if (!obstacle || !obstacle.pos) return false;
    let d = this.pos.dist(obstacle.pos);
    let rContact = obstacle.r + this.r_pourDessin;
    if (d < rContact) {
      const degats = 0.8;
      this.dureeDeVie = Math.max(0, this.dureeDeVie - degats);
      this.hitFlash = 4;
      return true;
    }
    return false;
  }

  isDead() {
    return this.dureeDeVie <= 0;
  }

  getClosestEntity(entities) {
    if (!entities || entities.length === 0) return null;
    let closest = null;
    let minDist = Infinity;
    for (let e of entities) {
      if (e === this) continue;
      let d = this.pos.dist(e.pos);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  // Comportements composables selon Reynolds :
  // 1. Navigation : ralliement cargo (si vide et disponible) OU suivi de route vers le Garage
  // 2. Évitement des obstacles et barrages
  // 3. Fuite face à la police (priorité absolue pendant la phase de fuite)
  // 4. Séparation entre camions
  applyBehaviors(targetOrGarage, obstacles = [], policeList = [], otherCamions = [], roadNetwork = null, cargoTarget = null) {
    let targetPos = null;

    // --- PHASE 2 : Ralliement et chargement de la marchandise mobile disponible ---
    if (!this.hasCargo && cargoTarget && (cargoTarget.status === "on_ground" || cargoTarget.altitude === 0)) {
      targetPos = cargoTarget.pos;
      if (this.pos.dist(cargoTarget.pos) < 42) {
        this.loadCargo(cargoTarget);
      }
    } else if (this.targetMode === "mouse" && targetOrGarage && typeof targetOrGarage.x === 'number') {
      targetPos = targetOrGarage;
    } else if (roadNetwork && roadNetwork.checkpoints && roadNetwork.checkpoints.length > 0) {
      // --- PHASE 3 : Suivi de route / fuite vers le Garage ---
      let cp = roadNetwork.getCheckpoint(this.currentCheckpointIndex);
      let distToCp = this.pos.dist(cp);

      if (distToCp < this.checkpointRadius) {
        if (roadNetwork.isLoop) {
          // Cycle actif fermé — boucle continue
          this.currentCheckpointIndex = (this.currentCheckpointIndex + 1) % roadNetwork.checkpoints.length;
          cp = roadNetwork.getCheckpoint(this.currentCheckpointIndex);
        } else if (this.currentCheckpointIndex < roadNetwork.checkpoints.length - 1) {
          this.currentCheckpointIndex++;
          cp = roadNetwork.getCheckpoint(this.currentCheckpointIndex);
        } else {
          // Arrivé au dernier checkpoint : viser directement le garage
          let garageTarget = (targetOrGarage && targetOrGarage.pos) ? targetOrGarage.pos : targetOrGarage;
          if (garageTarget) cp = garageTarget;
        }
      }

      // Si le camion transporte la cargaison, l'attirer vers le quai du garage dès qu'il est en approche
      if (this.hasCargo && targetOrGarage && targetOrGarage.pos) {
        let distToGarage = this.pos.dist(targetOrGarage.pos);
        if (distToGarage < (roadNetwork.isLoop ? 220 : 320)) {
          cp = targetOrGarage.pos;
        }
      }

      targetPos = cp;
    } else {
      targetPos = (targetOrGarage && targetOrGarage.pos) ? targetOrGarage.pos : targetOrGarage;
    }

    let followForce = targetPos ? this.arrive(targetPos, 50) : createVector(0, 0);

    // 2. Évitement des obstacles et des barrages
    let avoidForce = createVector(0, 0);
    if (obstacles && obstacles.length > 0) {
      avoidForce = this.avoid(obstacles);
    }

    // 3. Fuite face à la police (réaction amplifiée en mode fuite)
    let evadeForce = createVector(0, 0);
    let nearestPolice = this.getClosestEntity(policeList);
    if (nearestPolice) {
      let distToPolice = this.pos.dist(nearestPolice.pos);
      if (distToPolice < this.fleeRadius) {
        evadeForce = this.evade(nearestPolice);
        let factor = map(distToPolice, 0, this.fleeRadius, this.hasCargo ? 4.0 : 3.0, 1.0);
        evadeForce.mult(factor);
      }
    }

    // 4. Séparation entre camions
    let separateForce = createVector(0, 0);
    if (otherCamions && otherCamions.length > 1) {
      separateForce = this.separate(otherCamions);
    }

    // Pondérations équilibrées
    followForce.mult(1.2);
    avoidForce.mult(this.avoidWeight !== undefined ? this.avoidWeight : 3.6);
    evadeForce.mult(this.status === "escaping" ? 3.4 : 2.6);
    separateForce.mult(0.8);

    // Application via la locomotion
    this.applyForce(followForce);
    this.applyForce(avoidForce);
    this.applyForce(evadeForce);
    this.applyForce(separateForce);
  }

  drawLifeBar() {
    push();
    translate(this.pos.x, this.pos.y - this.r_pourDessin - 14);
    let barW = 28;
    let barH = 4;
    let pct = Math.max(0, this.dureeDeVie / this.maxDureeDeVie);

    noStroke();
    fill(0, 0, 0, 160);
    rectMode(CENTER);
    rect(0, 0, barW + 2, barH + 2, 2);

    let barColor = pct > 0.5 ? color(76, 175, 80) : (pct > 0.25 ? color(255, 193, 7) : color(244, 67, 54));
    fill(barColor);
    rectMode(CORNER);
    rect(-barW / 2, -barH / 2, barW * pct, barH, 2);
    pop();
  }

  drawVehicle() {
    this.drawLifeBar();
    this.escapeStrobe += 0.25;

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // 1. Phares avant
    noStroke();
    fill(255, 241, 118, 40);
    triangle(18, -4, 55, -20, 55, 20);
    triangle(18, 4, 55, -20, 55, 20);

    // 2. Roues industrielles
    fill(20);
    stroke(60);
    strokeWeight(1);
    rect(6, -15, 8, 4, 2);
    rect(6, 11, 8, 4, 2);
    rect(-18, -15, 10, 4, 2);
    rect(-18, 11, 10, 4, 2);

    // 3. Châssis / remorque
    let bodyColor = (this.hitFlash > 0) ? "#D32F2F" : this.color;
    if (this.hitFlash > 0) this.hitFlash--;

    fill(bodyColor);
    stroke(30);
    strokeWeight(2);
    rect(-24, -12, 28, 24, 3);

    // Bandes de protection de la remorque
    stroke(255, 255, 255, 70);
    strokeWeight(1.5);
    line(-16, -11, -16, 11);
    line(-8, -11, -8, 11);

    // 4. Marchandise arrimée sur la remorque (si chargée)
    if (this.hasCargo) {
      fill(215, 204, 200);
      stroke(121, 85, 72);
      strokeWeight(1.2);
      rect(-20, -8, 20, 16, 2);

      // Sangles de fixation jaune d'urgence
      stroke(255, 193, 7);
      strokeWeight(1.8);
      line(-10, -8, -10, 8);
    }

    // 5. Cabine de conduite
    fill(45, 52, 54);
    stroke(20);
    strokeWeight(2);
    rect(4, -10, 16, 20, 3);

    // Pare-brise
    fill(129, 212, 250);
    noStroke();
    rect(13, -7, 5, 14, 2);

    // Phares avants jaunes
    fill(255, 235, 59);
    rect(19, -8, 2, 4);
    rect(19, 4, 2, 4);

    // 6. Gyrophare d'alerte de fuite (Phase 3 Escape Mode)
    if (this.status === "escaping") {
      let isAmber = sin(this.escapeStrobe) > 0;
      noStroke();
      fill(isAmber ? color(255, 152, 0) : color(255, 23, 68));
      circle(6, 0, 8);

      // Halo d'alerte lumineux
      fill(255, 152, 0, 50);
      circle(6, 0, 24);
    }

    pop();
  }
}
