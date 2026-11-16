# Audit de compatibilité réseau et de sécurité — thetexttospeech.com

Date : 16 novembre 2026
Périmètre : tout le dossier `docs/` (site, annuaire d'outils, synthèse vocale, 8 jeux hébergés).

**Résumé**
- Pour utiliser le site, l'annuaire et les 8 jeux, un réseau scolaire n'a besoin d'autoriser qu'un seul domaine : `thetexttospeech.com`.
- La synthèse vocale demande en plus 3 domaines (`cdn.jsdelivr.net`, `huggingface.co`, `*.hf.co`).
- Les publicités peuvent être bloquées par l'établissement sans rien casser.

Aucun mécanisme de contournement de pare-feu, de filtre DNS ou de proxy n'a été ajouté. Le but est que le site fonctionne au mieux avec les règles de l'établissement, pas malgré elles.

---

## 1. Ce que le site téléchargeait avant l'audit

| Domaine externe | Utilisé par | Risque sur un réseau filtré |
|---|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | Accueil, pages de jeu, et 5 jeux (CSS Diner, Elevator Saga, Flexbox Froggy, Grid Garden, T-Rex Runner) | Fichier qui bloque l'affichage : page vide jusqu'à expiration si le domaine est filtré |
| `cdn.jsdelivr.net` | Encodeur MP3 et moteur de synthèse vocale | Synthèse vocale inutilisable |
| `ajax.googleapis.com` | jQuery d'A Dark Room | Script qui bloque l'affichage |
| `cdnjs.cloudflare.com` (en **HTTP**) | Plugin chargé en cachette par CSS Diner | Dépendance cachée, et en HTTP non chiffré |
| `i.imgur.com` (en **HTTP**) | 2 images d'A Dark Room | Contenu non chiffré |
| `icons.duckduckgo.com` | 98 icônes de l'annuaire, à chaque visite | 98 requêtes externes par page |
| `bauval.org`, `abscloud.org` | Bannières, popunder et Social Bar Adsterra | **Scripts qui bloquent l'affichage : si le pare-feu ignore ces domaines au lieu de les refuser, la page peut rester figée de longues secondes** |
| `pagead2.googlesyndication.com` | Google AdSense | Déjà chargé sans bloquer, aucun risque |

---

## 2. Corrections effectuées

### Compatibilité réseau
- **Polices hébergées sur le site :** 20 fichiers, 576 Ko, dans `docs/fonts/`. Le script `self-host-fonts.mjs` permet de les re-télécharger. Seuls les jeux de caractères latins (français et anglais) sont gardés.
- **Bibliothèques hébergées sur le site :** l'encodeur MP3 (`vendor/lame-1.2.1.min.js`) et le moteur vocal (`vendor/kokoro-1.2.1.web.js`).
- **Icônes de l'annuaire hébergées sur le site :** 84 icônes dans `docs/icons/`, téléchargées une seule fois par `update-data.mjs`. Les 14 outils restants affichent leur initiale.
- **A Dark Room :** jQuery et les 2 images imgur sont maintenant locaux.
- **CSS Diner :** le plugin `jquery-mousewheel`, qui était téléchargé en cachette depuis cdnjs en HTTP, est maintenant local.
- **Publicités qui ne bloquent plus l'affichage :**
  - Chaque bannière Adsterra s'affiche dans son propre cadre (`ad.html`, appelé par `ads.js`). Si le serveur de pub est bloqué ou lent, seul ce cadre reste vide.
  - Le popunder et la Social Bar sont chargés en `async`.

### Sécurité
- **jQuery 1.10.1, 1.11.0 et 2.1.1 remplacés par jQuery 3.7.1 + jQuery Migrate 3.5.2** dans A Dark Room, CSS Diner et Elevator Saga. Ces anciennes versions ont des failles connues (CVE-2015-9251, CVE-2019-11358, CVE-2020-11022, CVE-2020-11023).
- **Correctif d'Elevator Saga :** jQuery 3 exécute le code de démarrage plus tard, et le jeu ratait l'événement qui charge le défi. `app.js` lit maintenant l'adresse lui-même, avec un commentaire qui l'explique.
- **En-têtes de sécurité** (fichier `docs/_headers`) :
  - `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` (caméra, micro, localisation, paiement et USB désactivés).
  - **Politique de sécurité du contenu (CSP) stricte sur `/games/*` :** les jeux ne peuvent charger que des fichiers du site lui-même.
  - Cache d'un an pour les fichiers versionnés (`/vendor/`, `/fonts/files/`).
- **Redirection** (fichier `docs/_redirects`) : l'ancienne adresse `dynamic-heliotrope-4dfe11.netlify.app` redirige vers `thetexttospeech.com`, pour avoir une seule adresse et pas de contenu en double.
- **Rappel des corrections précédentes :** les trackers Google Analytics des auteurs et les pubs AdSense d'un autre éditeur ont été retirés des jeux, et chaque jeu a son propre espace de sauvegarde.

### Hors ligne
- **`docs/sw.js`** est un service worker de type « réseau d'abord ». Le visiteur reçoit toujours la dernière version, et la copie enregistrée ne sert que si le réseau ne répond plus.
- Il enregistre uniquement les fichiers du site. Il ne garde jamais les pubs ni aucun service externe.
- Il est actif sur l'accueil, la synthèse vocale et les 8 pages de jeu.

---

## 3. Vérifications

Les tests ont été faits en local, avec un serveur de test qui applique les mêmes règles que Netlify (`_headers`).

| Test | Résultat |
|---|---|
| HTTPS en ligne | Certificat Let's Encrypt valide jusqu'au 14/02/2027 (renouvelé automatiquement par Netlify). `http://` → `https://` et `www` → domaine principal en 301. HSTS actif. |
| Les 8 jeux avec la CSP stricte | Les 8 se chargent sans erreur et sans aucune requête vers un autre domaine. Polices locales chargées. |
| Jeux dont jQuery a été mis à jour | A Dark Room : allumer le feu fonctionne. CSS Diner : réponse validée, niveau suivant. Elevator Saga : défi affiché, Start/Pause et changement de défi fonctionnent. |
| **Pare-feu simulé** (domaines de pub pointés vers une adresse qui ne répond jamais) | Page prête en 51 ms (accueil, 98 outils affichés), 67 ms (2048, jeu chargé) et 73 ms (synthèse vocale, outil utilisable). |
| Synthèse vocale avec le moteur hébergé sur le site | Phrase générée (2,7 s d'audio) et encodée en MP3 (33 Ko). |
| Hors ligne | Après une visite, serveur arrêté : la page 2048 et son jeu se rouvrent depuis la copie enregistrée. |

**Non testé :**
- Le site en ligne avec ces modifications : `_headers` et `_redirects` ne prendront effet qu'après le prochain envoi du dossier `docs` sur Netlify.
- Un vrai réseau scolaire.
- Safari et Firefox : tous les tests ont été faits dans Chromium.

---

## 4. Liste des domaines pour l'administrateur informatique

### Indispensable : le site, l'annuaire et les 8 jeux
| Domaine | Rôle |
|---|---|
| `thetexttospeech.com` | Tout le site : pages, jeux, polices, icônes, scripts |

### Uniquement pour la synthèse vocale
| Domaine | Rôle |
|---|---|
| `cdn.jsdelivr.net` | Moteur d'exécution du modèle vocal (fichiers WebAssembly onnxruntime) |
| `huggingface.co` | Modèle vocal (environ 88 Mo, téléchargé une seule fois puis gardé par le navigateur) |
| `*.hf.co` (par exemple `us.aws.cdn.hf.co`) | Serveurs de fichiers de Hugging Face, vers lesquels `huggingface.co` redirige. Le nom exact peut changer selon la région. |

### Facultatif : publicités (le site fonctionne sans)
`pagead2.googlesyndication.com`, `ep1.adtrafficquality.google`, `ep2.adtrafficquality.google`, `bauval.org`, `abscloud.org`, `araplhn.org`

Il est normal et attendu qu'un établissement bloque ces domaines. Les pages restent alors rapides et fonctionnelles, avec des emplacements de pub vides.

### Outils externes de l'annuaire
Les 90 outils de l'annuaire qui ne sont pas hébergés sur le site sont de simples liens vers d'autres sites (Excalidraw, Lichess, freeCodeCamp…). Chacun dépend des règles de l'établissement pour son propre domaine. Ce site ne peut ni ne doit les rendre accessibles s'ils sont bloqués.

---

## 5. Risques restants

| Élément | Niveau | Pourquoi ce n'est pas corrigé |
|---|---|---|
| lodash 3.6.0 (Elevator Saga) | Faible | Failles de type « pollution de prototype » (CVE-2019-10744, CVE-2020-8203, CVE-2021-23337), exploitables seulement avec des données non fiables. Le jeu ne traite que le code tapé par le joueur dans son propre navigateur. Passer à lodash 4 changerait l'API et demanderait de réécrire le jeu. |
| riot 1.0.2, melonJS 4.0.0, jquery.color 2.1.2, mCustomScrollbar | Faible | Bibliothèques anciennes mais sans faille connue exploitable ici. Elles ne chargent rien de l'extérieur. |
| Pas de CSP sur les pages principales | Moyen | Les régies (AdSense, Adsterra) chargent des scripts depuis des domaines qui changent sans cesse. Une CSP stricte casserait les pubs. Seuls les jeux, sans pub à l'intérieur, ont une CSP stricte. |
| Publicités tierces | Moyen | Le contenu des pubs est choisi par les régies, pas par le site. Le popunder et la Social Bar sont souvent jugés intrusifs par les filtres scolaires. |
| Modèle vocal de 88 Mo | Contrainte | Trop lourd pour être hébergé confortablement sur Netlify. Il reste sur Hugging Face, et la synthèse vocale demande donc ces domaines. |

---

## 6. À faire de ton côté

1. Envoyer de nouveau le dossier **`docs`** sur Netlify (onglet Deploys). Sans ça, rien de ce rapport n'est en ligne.
2. Après une grosse mise à jour, augmenter `VERSION` dans `docs/sw.js` (par exemple `"v2"` → `"v3"`) pour effacer les anciennes copies hors ligne.
3. Après avoir modifié la liste d'outils, relancer `node update-data.mjs` : il met à jour les étoiles et télécharge les nouvelles icônes.
4. Transmettre la section 4 à l'administrateur informatique si l'établissement veut autoriser le site.

## Fichiers ajoutés ou modifiés

**Ajoutés**
- `docs/ad.html`, `docs/sw.js`, `docs/_headers`, `docs/_redirects`
- `docs/fonts/`, `docs/vendor/`, `docs/icons/`
- `self-host-fonts.mjs`, `AUDIT.md`

**Modifiés**
- Pages : `docs/index.html`, `docs/text-to-speech.html`, `docs/ads.js`, `docs/directory.js`, `docs/worker.js`
- Scripts de génération : `make-play-pages.mjs` (puis les 8 pages `docs/play-*.html` régénérées), `update-data.mjs`
- A Dark Room : `index.html`, `mobileWarning.html`, `lib/` (jQuery)
- CSS Diner : `index.html`, `js/` (jQuery et mousewheel)
- Elevator Saga : `index.html`, `documentation.html`, `app.js`, `libs/` (jQuery)
- Polices des jeux : `index.html` de Flexbox Froggy, Grid Garden et T-Rex Runner
