"""session_parser.py — parse markdown body → structure JSON `sessions.protocol`.

Module autonome et sans I/O : prend un body markdown en entrée, retourne la
structure attendue par l'app (accordion + checklists). Réutilisable par
`session_sync.py` (import batch depuis .md) et par tout futur flux où Sandra
produit une séance en markdown puis la pousse en DB via MCP.

Format en entrée : voir `sport-sante/knowledge/seances/template-seance.md`.
Format en sortie : consommé par `SessionProtocolView.tsx` côté app.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from typing import Any


# Titres (en minuscule) dont les items sont à cocher pendant l'exécution.
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
