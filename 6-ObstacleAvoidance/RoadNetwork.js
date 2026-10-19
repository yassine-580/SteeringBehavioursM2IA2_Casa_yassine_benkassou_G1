// Classe RoadNetwork : Gestion du réseau routier et des checkpoints de circulation (5 Niveaux)
class RoadNetwork {
  constructor(w = 1200, h = 800, level = 1) {
    this.roadWidth = 80;
    this.checkpoints = [];
    this.level = level;
    this.isLoop = false;
    this.initCheckpoints(w, h, level);
  }

  // Changement de niveau dynamique (1 à 5)
  setLevel(level, w, h) {
    this.level = level;
    this.initCheckpoints(w, h, level);
  }

  // Construit le tracé routier selon le niveau actif
  initCheckpoints(w, h, level = this.level) {
    this.level = level;

    if (level === 5) {
      // NIVEAU 5 : Le Grand Défi Final - Circuit tactique fermé en cycle actif
      this.isLoop = true;
      this.roadWidth = 76;
      this.checkpoints = [
        createVector(w * 0.16, h * 0.26),  // 0 : Départ / Zone Héliport
        createVector(w * 0.48, h * 0.18),  // 1 : Ligne rapide Nord
        createVector(w * 0.84, h * 0.28),  // 2 : Virage serré Nord-Est
        createVector(w * 0.74, h * 0.54),  // 3 : Chicane Est (descente)
        createVector(w * 0.52, h * 0.50),  // 4 : Épingle centrale (zone de croisement)
        createVector(w * 0.82, h * 0.78),  // 5 : Virage Sud-Est
        createVector(w * 0.48, h * 0.82),  // 6 : Ligne droite Sud
        createVector(w * 0.18, h * 0.76),  // 7 : Virage Sud-Ouest (quai Garage)
        createVector(w * 0.22, h * 0.50)   // 8 : Remontée Ouest
      ];
    } else if (level === 4) {
      // NIVEAU 4 : Urgence Maximale - Parcours sinueux avec chicanes très serrées
      this.isLoop = false;
      this.roadWidth = 74;
      this.checkpoints = [
        createVector(w * 0.12, h * 0.25),  // 0 : Départ Héliport Ouest
        createVector(w * 0.30, h * 0.22),  // 1 : Chicane 1
        createVector(w * 0.42, h * 0.55),  // 2 : Descente centrale
        createVector(w * 0.58, h * 0.28),  // 3 : Remontée raide
        createVector(w * 0.72, h * 0.68),  // 4 : Virage bas Sud-Est
        createVector(w * 0.85, h * 0.35),  // 5 : Chicane finale
        createVector(w - 140, h * 0.52)    // 6 : Garage de haute sécurité
      ];
    } else if (level === 3) {
      // NIVEAU 3 : Complexité Tactique - Parcours avec carrefour et contournements
      this.isLoop = false;
      this.roadWidth = 78;
      this.checkpoints = [
        createVector(w * 0.10, h * 0.30),  // 0 : Héliport Ouest
        createVector(w * 0.32, h * 0.30),  // 1 : Ligne Ouest
        createVector(w * 0.45, h * 0.70),  // 2 : Descente Sud
        createVector(w * 0.65, h * 0.70),  // 3 : Traversée basse
        createVector(w * 0.75, h * 0.35),  // 4 : Virage Nord-Est
        createVector(w - 145, h * 0.50)    // 5 : Garage
      ];
    } else if (level === 2) {
      // NIVEAU 2 : Obstacles et Pression - S-curve avec virages accentués
      this.isLoop = true;
      this.roadWidth = 76;
      this.checkpoints = [
        createVector(w * 0.16, h * 0.26),  // 0 : Départ / Virage Nord-Ouest
        createVector(w * 0.48, h * 0.18),  // 1 : Ligne rapide Nord
        createVector(w * 0.84, h * 0.28),  // 2 : Virage serré Nord-Est
        createVector(w * 0.74, h * 0.54),  // 3 : Chicane Est (descente)
        createVector(w * 0.52, h * 0.50),  // 4 : Épingle centrale (zone de croisement)
        createVector(w * 0.82, h * 0.78),  // 5 : Virage Sud-Est
        createVector(w * 0.48, h * 0.82),  // 6 : Ligne droite Sud
        createVector(w * 0.18, h * 0.76),  // 7 : Virage Sud-Ouest (quai Garage)
        createVector(w * 0.22, h * 0.50)   // 8 : Remontée Ouest
      ];
    } else {
      // NIVEAU 1 : Introduction & Sécurité - Parcours classique et direct
      this.isLoop = false;
      this.roadWidth = 80;
      this.checkpoints = [
        createVector(80, h * 0.28),          // 0 : Départ Ouest (Zone de fret)
        createVector(w * 0.28, h * 0.28),     // 1 : Ligne droite Ouest
        createVector(w * 0.38, h * 0.65),     // 2 : Virage Sud (contournement)
        createVector(w * 0.60, h * 0.65),     // 3 : Traversée centrale Sud
        createVector(w * 0.72, h * 0.32),     // 4 : Virage Nord-Est
        createVector(w - 150, h * 0.50)       // 5 : Arrivée devant le Garage
      ];
    }
  }

  // Met à jour les checkpoints en cas de redimensionnement de l'écran
  resize(w, h) {
    this.initCheckpoints(w, h, this.level);
  }

  getCheckpoint(index) {
    if (this.checkpoints.length === 0) return createVector(0, 0);
    return this.checkpoints[Math.abs(index) % this.checkpoints.length];
  }

  // Dessine la route : asphalte, bordures, marquage au sol et checkpoints
  show() {
    push();
    strokeJoin(ROUND);
    strokeCap(ROUND);

    // 1. Fond asphalte foncé de la route
    noFill();
    stroke(22, 27, 36);
    strokeWeight(this.roadWidth);
    beginShape();
    for (let cp of this.checkpoints) {
      vertex(cp.x, cp.y);
    }
    if (this.isLoop) endShape(CLOSE); else endShape();

    // 2. Bordures latérales de la route
    stroke(65, 75, 95, 120);
    strokeWeight(this.roadWidth + 4);
    beginShape();
    for (let cp of this.checkpoints) {
      vertex(cp.x, cp.y);
    }
    if (this.isLoop) endShape(CLOSE); else endShape();

    // 3. Asphalte intérieur pour masquer les bordures centrales
    stroke(22, 27, 36);
    strokeWeight(this.roadWidth);
    beginShape();
    for (let cp of this.checkpoints) {
      vertex(cp.x, cp.y);
    }
    if (this.isLoop) endShape(CLOSE); else endShape();

    // 4. Marquage central discontinu (pointillés blancs/jaunes)
    stroke(255, 230, 100, 140);
    strokeWeight(2.5);
    if (typeof drawingContext !== 'undefined' && drawingContext.setLineDash) {
      drawingContext.setLineDash([16, 16]);
    }
    beginShape();
    for (let cp of this.checkpoints) {
      vertex(cp.x, cp.y);
    }
    if (this.isLoop) endShape(CLOSE); else endShape();

    if (typeof drawingContext !== 'undefined' && drawingContext.setLineDash) {
      drawingContext.setLineDash([]);
    }

    // 5. Visualisation des checkpoints
    for (let i = 0; i < this.checkpoints.length; i++) {
      let cp = this.checkpoints[i];
      noFill();
      stroke(56, 139, 253, 40);
      strokeWeight(1.5);
      circle(cp.x, cp.y, 24);

      fill(56, 139, 253, 160);
      noStroke();
      circle(cp.x, cp.y, 6);
    }

    pop();
  }
}
