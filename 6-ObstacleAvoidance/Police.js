// Classe Police : sous-classe de Vehicle
// Mode Patrouille à contre-sens sur le réseau routier,
// et Poursuite Intelligente avec Anticipation vectorielle pour intercepter les camions dans les virages.
class Police extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 4.4;
    this.maxForce = 0.32;
    this.r = 26;
    this.captureRadius = 36;
    this.detectionRadius = 400; // Rayon de détection radar pour engager la poursuite
    this.anticipationSeconds = 1.5; // Temps d'anticipation en secondes
    this.avoidWeight = 3.6;
    this.capturedCount = 0;
    this.sirenPhase = 0;
    this.currentTarget = null;
    this.mode = "patrouille"; // "patrouille" ou "poursuite_intelligente"
    this.patrolIndex = 5;      // Démarre la patrouille côté Est en sens inverse
    this.patrolDirection = -1; // -1 pour patrouille à contre-sens, +1 pour sens normal
    this.predictedPoint = null; // Point d'interception futur calculé
    this.color = "#1565C0";

    // Durée de vie et gestion des dégâts d'obstacles
    this.maxDureeDeVie = 100;
    this.dureeDeVie = 100;
    this.hitFlash = 0;
  }

  // Vérifie si la police touche un obstacle et diminue sa durée de vie
  checkObstacleCollision(obstacle) {
    if (!obstacle || !obstacle.pos) return false;
    let d = this.pos.dist(obstacle.pos);
    let rContact = obstacle.r + 14;
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

  // Trouve le camion actif le plus prioritaire (fuyard avec marchandise ou le plus proche)
  getClosestCamion(camions) {
    if (!camions || camions.length === 0) return null;
    let closest = null;
    let minDist = Infinity;

    // Priorité 1 : Camion transportant la marchandise en phase de fuite
    for (let c of camions) {
      if (!c || c.isDead()) continue;
      if (c.hasCargo || c.status === "escaping") {
        let d = this.pos.dist(c.pos);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      }
    }
    if (closest) return closest;

    // Priorité 2 : N'importe quel camion en circulation
    minDist = Infinity;
    for (let c of camions) {
      if (!c || c.isDead()) continue;
      let d = this.pos.dist(c.pos);
      if (d < minDist) {
        minDist = d;
        closest = c;
      }
    }
    return closest;
  }

  // Calcul du vecteur d'anticipation pour intercepter le camion dans sa trajectoire
  computeAnticipation(target) {
    if (!target || !target.pos) return null;
    let d = this.pos.dist(target.pos);

    // Temps d'anticipation proportionnel à la distance configurée
    let maxFrames = (this.anticipationSeconds !== undefined ? this.anticipationSeconds : 1.5) * 30;
    let lookAheadFrames = constrain(d / (this.maxSpeed * 1.4), 10, Math.max(15, maxFrames));

    let futurePos = target.pos.copy();
    let velocityPrediction = target.vel ? target.vel.copy() : createVector(0, 0);
    velocityPrediction.mult(lookAheadFrames);
    futurePos.add(velocityPrediction);

    return futurePos;
  }

  // Comportements composables :
  // 1. Patrouille sur le réseau routier en sens inverse OU Poursuite Intelligente avec Anticipation
  // 2. Évitement des obstacles sur la chaussée
  applyBehaviors(camions = [], obstacles = [], roadNetwork = null) {
    this.currentTarget = this.getClosestCamion(camions);

    let steerForce = createVector(0, 0);
    this.predictedPoint = null;

    if (this.currentTarget && this.pos.dist(this.currentTarget.pos) < this.detectionRadius) {
      // --- MODE 2 : POURSUITE INTELLIGENTE AVEC ANTICIPATION ---
      this.mode = "poursuite_intelligente";
      this.predictedPoint = this.computeAnticipation(this.currentTarget);

      if (this.predictedPoint) {
        // La police vise le point futur où le camion va arriver (coupe la trajectoire)
        steerForce = this.seek(this.predictedPoint);
      } else {
        steerForce = this.seek(this.currentTarget.pos);
      }
      steerForce.mult(1.5);
    } else {
      // --- MODE 1 : PATROUILLE EN SENS INVERSE SUR LA ROUTE ---
      this.mode = "patrouille";

      if (roadNetwork && roadNetwork.checkpoints && roadNetwork.checkpoints.length > 0) {
        let cp = roadNetwork.getCheckpoint(this.patrolIndex);
        if (this.pos.dist(cp) < 45) {
          // Décrémente ou incrémente l'index selon la direction de patrouille
          let step = this.patrolDirection !== undefined ? this.patrolDirection : -1;
          this.patrolIndex = (this.patrolIndex + step + roadNetwork.checkpoints.length) % roadNetwork.checkpoints.length;
          cp = roadNetwork.getCheckpoint(this.patrolIndex);
        }
        steerForce = this.arrive(cp, 40);
      } else {
        let center = createVector(width / 2, height / 2);
        steerForce = this.arrive(center);
      }
      steerForce.mult(1.0);
    }

    // Évitement des obstacles
    let avoidForce = createVector(0, 0);
    if (obstacles && obstacles.length > 0) {
      avoidForce = this.avoid(obstacles);
    }
    avoidForce.mult(this.avoidWeight !== undefined ? this.avoidWeight : 3.6);

    this.applyForce(steerForce);
    this.applyForce(avoidForce);
  }

  canCatch(camion) {
    if (!camion || camion.isDead()) return false;
    let d = this.pos.dist(camion.pos);
    return d < this.captureRadius;
  }

  drawLifeBar() {
    push();
    translate(this.pos.x, this.pos.y - 18);
    let barW = 26;
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

  // Dessin de la trajectoire prédictive d'interception
  drawPredictionLine() {
    if (this.mode === "poursuite_intelligente" && this.predictedPoint && this.currentTarget) {
      push();
      // 1. Courbe tactique d'anticipation coupant la trajectoire
      stroke(255, 41, 105, 180);
      strokeWeight(2);
      if (typeof drawingContext !== 'undefined' && drawingContext.setLineDash) {
        drawingContext.setLineDash([8, 8]);
      }

      // Courbe de Bézier tactique de la police vers le point futur
      let midX = (this.pos.x + this.predictedPoint.x) / 2;
      let midY = (this.pos.y + this.predictedPoint.y) / 2;
      noFill();
      bezier(this.pos.x, this.pos.y, midX, this.pos.y, midX, this.predictedPoint.y, this.predictedPoint.x, this.predictedPoint.y);

      if (typeof drawingContext !== 'undefined' && drawingContext.setLineDash) {
        drawingContext.setLineDash([]);
      }

      // 2. Réticule tactique sur le point d'impact anticipé
      noFill();
      stroke(255, 23, 68);
      strokeWeight(1.5);
      circle(this.predictedPoint.x, this.predictedPoint.y, 20);
      line(this.predictedPoint.x - 14, this.predictedPoint.y, this.predictedPoint.x + 14, this.predictedPoint.y);
      line(this.predictedPoint.x, this.predictedPoint.y - 14, this.predictedPoint.x, this.predictedPoint.y + 14);

      fill(255, 23, 68);
      noStroke();
      textAlign(CENTER, BOTTOM);
      textSize(9);
      textStyle(BOLD);
      text("INTERCEPTION (+2s)", this.predictedPoint.x, this.predictedPoint.y - 14);
      pop();
    }
  }

  drawVehicle() {
    this.drawPredictionLine();
    this.drawLifeBar();
    this.sirenPhase += 0.25;

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // Phares avant
    noStroke();
    fill(255, 255, 200, 35);
    triangle(14, -6, 50, -22, 50, 22);
    triangle(14, 6, 50, -22, 50, 22);

    // 4 Roues
    fill(20);
    stroke(50);
    strokeWeight(1);
    rect(6, -12, 7, 3, 1);
    rect(6, 9, 7, 3, 1);
    rect(-14, -12, 7, 3, 1);
    rect(-14, 9, 7, 3, 1);

    // Châssis police
    let chassisColor = (this.hitFlash > 0) ? "#D32F2F" : color(24, 28, 36);
    if (this.hitFlash > 0) this.hitFlash--;

    fill(chassisColor);
    stroke(this.color);
    strokeWeight(2);
    rect(-18, -10, 34, 20, 5);

    // Toit blanc
    fill(245);
    stroke(20);
    strokeWeight(1);
    rect(-10, -7, 18, 14, 2);

    // Vitres
    fill(96, 125, 139);
    noStroke();
    rect(6, -6, 4, 12, 1);
    rect(-10, -6, 3, 12, 1);

    // Gyrophares alternés rouge/bleu
    let isRed = Math.sin(this.sirenPhase) > 0;
    let redColor = isRed ? color(255, 23, 68) : color(120, 10, 20);
    let blueColor = !isRed ? color(41, 121, 255) : color(10, 30, 100);

    fill(isRed ? 255 : 41, isRed ? 23 : 121, isRed ? 68 : 255, 80);
    circle(-2, 0, 16);

    fill(redColor);
    rect(-4, -5, 4, 4, 1);
    fill(blueColor);
    rect(-4, 1, 4, 4, 1);

    // Phares
    fill(255, 235, 59);
    rect(15, -7, 2, 3);
    rect(15, 4, 2, 3);

    pop();
  }
}
