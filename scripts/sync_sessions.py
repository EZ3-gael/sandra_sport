"""sync_sessions.py — sync des .md de seances-du-jour vers Supabase.

Lit :
    D:/SANDRA/01_Brainstorming/sport-sante/seances-du-jour/*.md

Upsert dans : public.sessions (via SERVICE_ROLE_KEY, bypass RLS)

Parse le body markdown en structure JSON stockée dans sessions.protocol, pour
permettre l'affichage en accordion avec checklist interactive côté UI.

Identifie chaque séance par (user_id, source_file) — idempotent.

Usage :
    python scripts/sync_sessions.py

Variables d'environnement requises dans .env.local :
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    SANDRA_SPORT_USER_ID
"""

from __future__ import annotations

import hashlib
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

import frontmatter  # type: ignore[import-untyped]
from dotenv import load_dotenv
from supabase import create_client, Client


ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
USER_ID = os.getenv("SANDRA_SPORT_USER_ID")

DEFAULT_SEANCES_DIR = Path("D:/SANDRA/01_Brainstorming/sport-sante/seances-du-jour")
SEANCES_DIR = Path(os.getenv("SANDRA_SPORT_SEANCES_DIR") or DEFAULT_SEANCES_DIR)


# -------------------------------------------------------------------
# Markdown → structure JSON (sections + items)
# -------------------------------------------------------------------

# Titres dont les items sont à cocher pendant l'exécution.
CHECKLIST_SECTION_TITLES = {"protocole", "post-séance"}

# Titres dépliés par défaut (sinon collapsed). Les autres sections (Contexte,
# Signaux, Décisions, Références) sont collapsed par défaut pour un affichage
# épuré pendant la séance.
EXPANDED_BY_DEFAULT = {"protocole"}


def slugify(value: str) -> str:
    v = unicodedata.normalize("NFKD", value)
    v = "".join(c for c in v if not unicodedata.combining(c))
    v = re.sub(r"[^a-zA-Z0-9]+", "-", v.lower()).strip("-")
    return v[:50] or "section"


def item_hash(text: str) -> str:
    """Hash stable pour identifier un item dans la DB à travers les re-syncs."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


def parse_protocol(body: str) -> dict[str, Any]:
    """Parse un body markdown en structure hiérarchique.

    Retourne :
        {
            "sections": [
                {
                    "id": "contexte",
                    "title": "Contexte",
                    "type": "notes" | "checklist",
                    "default_collapsed": bool,
                    "items": [ { "id": "...", "text": "..." }, ... ],
                    "subsections": [
                        { "id": "...", "title": "...", "items": [...] }, ...
                    ]
                }, ...
            ]
        }
    """
    sections: list[dict[str, Any]] = []
    current_section: dict[str, Any] | None = None
    current_subsection: dict[str, Any] | None = None

    for raw_line in body.splitlines():
        line = raw_line.rstrip()

        # H2 : nouvelle section
        if line.startswith("## "):
            title = line[3:].strip()
            title_lower = title.lower()
            current_section = {
                "id": slugify(title),
                "title": title,
                "type": "checklist" if title_lower in CHECKLIST_SECTION_TITLES else "notes",
                "default_collapsed": title_lower not in EXPANDED_BY_DEFAULT,
                "items": [],
                "subsections": [],
            }
            current_subsection = None
            sections.append(current_section)
            continue

        # H3 : sous-section dans la section courante
        if line.startswith("### ") and current_section is not None:
            title = line[4:].strip()
            current_subsection = {
                "id": f"{current_section['id']}-{slugify(title)}",
                "title": title,
                "items": [],
            }
            current_section["subsections"].append(current_subsection)
            continue

        # Item de liste `- text`
        stripped = line.lstrip()
        if stripped.startswith("- ") and current_section is not None:
            text = stripped[2:].strip()
            if not text:
                continue
            item = {
                "id": f"{current_section['id']}-{item_hash(text)}",
                "text": text,
            }
            if current_subsection is not None:
                # Préfixe avec la sous-section pour éviter collisions inter-sections
                item["id"] = f"{current_subsection['id']}-{item_hash(text)}"
                current_subsection["items"].append(item)
            else:
                current_section["items"].append(item)
            continue

        # Autres lignes (paragraphes, séparateurs gras) : on les ignore en V1.
        # Elles resteront accessibles dans le champ `context` pour un affichage
        # plein texte si besoin.

    return {"sections": sections}


# -------------------------------------------------------------------
# Parse .md → row sessions
# -------------------------------------------------------------------


def parse_md_file(path: Path) -> dict[str, Any]:
    """Parse un fichier .md avec frontmatter YAML + body markdown."""
    post = frontmatter.load(path)
    meta = post.metadata

    d = meta.get("date")
    if d is None:
        d = path.stem
    date_str = str(d) if not isinstance(d, str) else d

    body = post.content.strip()
    protocol = parse_protocol(body)

    return {
        "user_id": USER_ID,
        "date": date_str,
        "slot": meta.get("slot"),
        "planned_start_time": meta.get("planned_start_time"),
        "title": meta.get("title") or "Séance sans titre",
        "session_type": meta.get("session_type"),
        "status": meta.get("status", "planned"),
        "context": body or None,
        "protocol": protocol,
        "source": "sandra",
        "source_file": f"seances-du-jour/{path.name}",
    }


def main() -> int:
    missing = []
    if not SUPABASE_URL:
        missing.append("NEXT_PUBLIC_SUPABASE_URL")
    if not SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not USER_ID:
        missing.append("SANDRA_SPORT_USER_ID")
    if missing:
        print(
            f"[ERREUR] Variables manquantes dans .env.local : {', '.join(missing)}",
            file=sys.stderr,
        )
        if "SANDRA_SPORT_USER_ID" in missing:
            print(
                "  → Récupère ton UUID dans Supabase Dashboard → Authentication "
                "→ Users → clic sur ton email → 'User UID'",
                file=sys.stderr,
            )
        return 1

    if not SEANCES_DIR.exists():
        print(f"[ERREUR] Dossier source introuvable : {SEANCES_DIR}", file=sys.stderr)
        return 1

    client: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    md_files = sorted(SEANCES_DIR.glob("*.md"))
    if not md_files:
        print(f"Aucun .md à synchroniser dans {SEANCES_DIR}")
        return 0

    print(f"Synchronisation de {len(md_files)} fichier(s) depuis {SEANCES_DIR}")
    print(f"Cible : {SUPABASE_URL} → public.sessions\n")

    upserted = 0
    errors = 0

    for md_path in md_files:
        try:
            row = parse_md_file(md_path)
        except Exception as e:
            print(f"[ERREUR] Parse {md_path.name} : {e}", file=sys.stderr)
            errors += 1
            continue

        try:
            client.table("sessions").upsert(
                row,
                on_conflict="user_id,source_file",
            ).execute()
            upserted += 1
            n_sections = len(row["protocol"]["sections"])
            status = row.get("status", "planned")
            print(
                f"OK   {row['date']} [{status}] {row['title']}"
                f"  ({n_sections} sections)"
            )
        except Exception as e:
            print(f"[ERREUR] Upsert {md_path.name} : {e}", file=sys.stderr)
            errors += 1

    print(f"\nTotal : {upserted} upsertés, {errors} erreurs.")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
