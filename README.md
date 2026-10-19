# 🚚🚨 Police & Camion — Obstacle Avoidance & Steering Behaviors

> Projet M2 IA2 Casablanca — Intelligence Artificielle Réactive & Steering Behaviors (Craig Reynolds)  
> Développé par **[Yassine Benkassou](https://github.com/yassine-580)**

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/fr/docs/Web/JavaScript)
[![p5.js](https://img.shields.io/badge/p5.js-creative%20coding-ED225D)](https://p5js.org/)
[![Tests](https://img.shields.io/badge/Tests-39%20Pass-brightgreen?logo=node.js)](6-ObstacleAvoidance/tests/obstacleAvoidance.test.mjs)

---

## 🎮 Jouer en ligne

**[👉 Lancer le jeu Police & Camion sur GitHub Pages](https://yassine-580.github.io/SteeringBehavioursM2IA2_Casa_yassine_benkassou_G1/)**

> Si le lien n'est pas encore actif, activez GitHub Pages dans **Settings → Pages** du dépôt, en choisissant la branche `main` et le dossier `/(root)`.

---

## 📖 Présentation du Projet

**Police & Camion** est un jeu tactique et pédagogique en temps réel mettant en œuvre les **forces de déplacement autonomes (*Steering Behaviors*)** théorisées par Craig W. Reynolds.

Le scénario simule une chaîne logistique sous haute tension :
1. **Largage aérien (`AIRDROP`)** : un hélicoptère cargo rejoint l'héliport pour parachuter une cargaison sensible.
2. **Récupération au sol (`LOADING`)** : la cargaison déambule de façon autonome. Le camion allié (pilotable manuellement ou en IA autonome) doit la rejoindre et l'arrimer.
3. **Fuite & Livraison (`ESCAPE`)** : dès l'arrimage, les patrouilles de police d'élite se lancent à la poursuite du camion avec anticipation prédictive vectorielle. Le camion doit slalomer entre les obstacles et barrages pour sécuriser la livraison au Garage.

---

## 🏆 Les 5 Niveaux de Défi

| Niveau | Nom | Description & Comportements |
|:---:|---|---|
| **1** | Introduction | Prise en main des mécaniques, vitesse modérée |
| **2** | Pression | Police plus véloce, trafic et obstacles accrus |
| **3** | Barrages | Apparition de barrages routiers et camions alliés |
| **4** | Traque | Interception prédictive avancée, patrouilles multiples |
| **5** | Défi Final | Météo pluvieuse dynamique, adhérence réduite et traque maximale |

---

## 🎮 Commandes du Joueur

| Touche / Action | Fonction |
|---|---|
| `ZQSD` ou `Flèches` | Piloter le camion manuellement |
| `J` | Basculer entre conduite Manuelle et IA Automatique |
| `U` | Afficher / masquer l'interface (HUD) |
| `L` | Changer de niveau |
| `H` | Déclencher un largage hélicoptère immédiat |
| `Tab` ou `T` | Ouvrir / fermer le panneau de réglages |
| `S` | Changer la cible des camions autonomes |
| `Clic gauche` (zone vide) | Poser un obstacle personnalisé |
| `Clic droit` (sur obstacle) | Supprimer un obstacle |
| `X` ou `Suppr` | Supprimer le dernier obstacle posé |
| `Maj` + `X` | Supprimer tous les obstacles personnalisés |
| `C` | Spawner un camion allié supplémentaire |
| `P` | Spawner une voiture de police supplémentaire |
| `D` | Activer / désactiver la vue Débogage (vecteurs de force, rayons) |
| `M` | Activer / couper les effets sonores (Web Audio API) |
| `R` | Réinitialiser la partie au Niveau 1 |

---

## 🧠 Concepts d'IA Réactive & Steering Behaviors

Les agents autonomes du jeu combinent plusieurs algorithmes de Craig Reynolds :

- **Seek & Flee** : attraction vers la cargaison / fuite face à la police.
- **Arrive** : décélération progressive et stationnement précis à l'héliport et au garage.
- **Wander** : errance fluide de la cargaison et des véhicules de patrouille.
- **Obstacle & Vehicle Avoidance** : calcul préventif des collisions par projection de vecteurs d'anticipation et répulsion tangentielle.
- **Path Following** : suivi du réseau routier et des waypoints.
- **Pursuit Prédictive** : calcul de la position future de la cible pour l'intercepter avec un angle optimal.

---

## 🛠️ Stack Technique

- **JavaScript ES6+** (classes modulaires, programmation orientée objet)
- **p5.js** (moteur de rendu 2D Canvas)
- **Web Audio API** (synthèse audio temps réel sans assets externes lourds)
- **Node.js Test Runner** (39 tests unitaires automatisés)

---

## 📂 Architecture des Fichiers

```text
├── 6-ObstacleAvoidance/
│   ├── index.html              # Interface principale du jeu
│   ├── style.css               # Design sombre & glassmorphism
│   ├── sketch.js               # Boucle de jeu, HUD et gestion des niveaux
│   ├── vehicle.js              # Classe de base des Steering Behaviors (Reynolds)
│   ├── Camion.js               # IA du camion logistique autonome
│   ├── PlayerCamion.js         # Camion contrôlable par le joueur (manuel / auto)
│   ├── Police.js               # IA de police avec poursuite prédictive
│   ├── Helicopter.js           # IA de l'hélicoptère de largage
│   ├── CargoBox.js             # Cargaison avec physique et arrimage
│   ├── Helipad.js              # Zone d'atterrissage et de largage
│   ├── Garage.js               # Zone d'arrivée et de livraison
│   ├── RoadNetwork.js          # Réseau routier et waypoints
│   ├── Roadblock.js            # Barrages tactiques
│   ├── obstacle.js             # Obstacles statiques circulaires
│   ├── SoundEffects.js         # Synthétiseur audio Web Audio API
│   ├── libraries/              # Bibliothèques p5.js
│   └── tests/                  # 39 tests unitaires Node.js
├── index.html                  # Point d'entrée racine avec redirection GitHub Pages
└── README.md                   # Documentation officielle du projet
```

---

## 🚀 Installation & Exécution en Local

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/yassine-580/SteeringBehavioursM2IA2_Casa_yassine_benkassou_G1.git
   cd SteeringBehavioursM2IA2_Casa_yassine_benkassou_G1
   ```

2. **Lancer un serveur local** (Python ou Live Server) :
   ```bash
   python -m http.server 8000
   ```
   Puis ouvrir [http://localhost:8000](http://localhost:8000).

3. **Lancer la suite de tests** :
   ```bash
   cd 6-ObstacleAvoidance
   node --test tests/obstacleAvoidance.test.mjs
   ```

---

## 🌐 Déploiement GitHub Pages

1. Rendez-vous sur votre dépôt : [yassine-580/SteeringBehavioursM2IA2_Casa_yassine_benkassou_G1](https://github.com/yassine-580/SteeringBehavioursM2IA2_Casa_yassine_benkassou_G1).
2. Ouvrez **Settings** → **Pages**.
3. Sous **Source**, sélectionnez **Deploy from a branch**.
4. Choisissez la branche `main` et le répertoire `/ (root)`, puis cliquez sur **Save**.
5. Votre jeu sera en ligne sur : `https://yassine-580.github.io/SteeringBehavioursM2IA2_Casa_yassine_benkassou_G1/`.

---

## 👨‍💻 Auteur

**Yassine Benkassou** — [@yassine-580](https://github.com/yassine-580)  
Master 2 IA2 Casablanca — Intelligence Artificielle & Systèmes Multi-Agents.
