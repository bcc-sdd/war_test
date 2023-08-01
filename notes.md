<!-- - [ ] approval collision
    - [ ] number of casualty
    - slider
- [ ] approval visibility
    - [ ] grant visibility status
    - button
    - [ ] grant visibility type
    - button -->
**Map Logic**
- [ ] Map should draw attackId instead of assetId
- [ ] Visibility logic for radar(drones)
- [ ] Persistent assets for bases (delete)
- [ ] hardcoded speed
- [ ] Base tooltip data: children

```mermaid
graph LR
A{{Movement<br/>end}} --> B[Collided with<br/>enemy] --> C(Send socket request<br/>to admin) 
C --> D{Accepted?} -->|yes| E[Destroy assets]
D --> |no| F[Movement Arrive]
Dest(Socket: Destroyed<br/>asset) --> G[MAP_PAINT]
```
---
**Database writes**
```mermaid
graph LR
A{{Accept button <br/> onclick event fnc}}-->B[Aggressor exploded?] -->|yes|D[Map_Controller/updateExplodedAsset]
B -->|no| E[Map_Controller/updatePosition]
A --> C[Target exploded]
C -->|yes|D

```
- [ ] Movement done
    - [x] functions done
    - [ ] database confirmation

- [ ] Explosion
    - [x] functions done
    - [ ] database confirmation 
- [x] bomb casualty numbers
    - slider
- [ ] PENDING ID for paused movements
---
- [x] Admin panel (events validation)
    - [x] Map to admin socket
    - [ ] Admin to DB
- [x] Timer / Table /  Announcements
    - [x] Team / DEFCON / Amount of Objectives
    - [x] Socket connections
    - [x] Database source > connection


---
**Colllision algo**
- Load database assets
- forEach asset
    - Compute trajectories
    - Determine if moving or not
- 
---
**base**
- [x] Determine if base is population or military base
- [x] Add record for children
- [ ] Tooltip
- [ ] Visibility
- [ ] Base attack
- [ ] attack id

---