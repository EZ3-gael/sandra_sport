# Scripts Sandra Sport

Utilitaires Python autonomes qui alimentent Supabase depuis le workspace local.

## `session_sync.py`

Synchronise les séances `sport-sante/seances-du-jour/*.md` vers la table `public.sessions` de Supabase.

Le parsing markdown → structure JSON est délégué à `session_parser.py` (module réutilisable, voir plus bas).

### Install (une fois)

```bash
cd D:/SANDRA/02_Projets/sandra_sport/scripts
python -m venv .venv
.venv/Scripts/python.exe -m pip install --upgrade pip
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### Configuration

Ajoute dans `sandra_sport/.env.local` :

```
SANDRA_SPORT_USER_ID=<ton UUID Supabase Auth>
```

Récupération du UUID : Supabase Dashboard → **Authentication → Users** → clique sur ton email → champ **User UID**.

### Lancer

```bash
# Depuis sandra_sport/
scripts/.venv/Scripts/python.exe scripts/session_sync.py
```

Le script est **idempotent** : il upsert par `(user_id, source_file)`. Tu peux le rejouer, il ne duplique pas les séances.

Chaque séance qu'on cale ensemble, Sandra écrit un `.md` daté dans `sport-sante/seances-du-jour/`. Tu relances ce script à la demande (ou via un hook Sandra plus tard) et la séance apparaît dans l'app mobile.

### Format attendu des .md

```markdown
---
date: 2026-04-23
slot: apres-midi               # matin | midi | apres-midi | soir
planned_start_time: "14:30"
title: Course 7×1/1 + vélo récup Z1
session_type: mixte            # course | velo | muscu | hyrox | recup | mixte
status: planned                # planned | done | skipped
---

# Séance — titre humain

## Contexte
...

## Protocole
...

## Signaux à surveiller
...

## Post-séance
...
```

Le frontmatter YAML alimente les champs SQL structurés. Tout le body markdown est stocké dans `context`.

Template de référence : [`sport-sante/knowledge/seances/template-seance.md`](../../../01_Brainstorming/sport-sante/knowledge/seances/template-seance.md).

## `session_parser.py`

Module Python autonome qui convertit un body markdown en structure JSON (format `sessions.protocol` attendu par l'app). Sans I/O, sans dépendance Supabase — juste du parsing pur.

Utilisé par :
- `session_sync.py` (batch import depuis les `.md`).
- Tout futur flux où Sandra produit une séance en markdown et la pousse directement en DB via MCP (V1.5+).

```python
from session_parser import parse_protocol

body = """## Contexte

- Jour 4 W17
...
"""

protocol = parse_protocol(body)
# → dict avec clé "sections", consommable par SessionProtocolView.tsx
```

Fonctions exportées :
- `parse_protocol(body: str) -> dict` — convertit markdown en structure JSON.
- `slugify(value: str) -> str` — normalise un titre en identifiant URL-safe.
- `item_hash(text: str) -> str` — hash SHA1 stable pour identifier un item à travers les re-syncs (évite de casser les checks utilisateur quand la séance est rééditée).

Constantes exportées :
- `CHECKLIST_SECTION_TITLES` — noms des sections à afficher en checklist interactive (par défaut : `"protocole"`, `"post-séance"`).
- `EXPANDED_BY_DEFAULT` — noms des sections dépliées au chargement (par défaut : `"protocole"`).
