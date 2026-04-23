# Scripts Sandra Sport

Utilitaires Python autonomes qui alimentent Supabase depuis le workspace local.

## `sync_sessions.py`

Synchronise les séances `sport-sante/seances-du-jour/*.md` vers la table `public.sessions` de Supabase.

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
scripts/.venv/Scripts/python.exe scripts/sync_sessions.py
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
