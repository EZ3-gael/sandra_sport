/**
 * Brique 5 — Marqueurs mensuels (SLHRT, proprio, validation kiné).
 * V1.5e1 : lecture seule. La saisie arrive en V1.5e3.
 */

import type { IsoDate } from '@/lib/programme/dates';

type MarkerType = 'slhrt' | 'proprio_unipodal_g' | 'proprio_unipodal_d' | 'kine_validation' | 'echo';

export type MonthlyMarkerRow = {
  id: string;
  marker_type: string;
  measured_at: IsoDate;
  value_numeric: number | null;
  value_text: string | null;
  metadata: { droite?: number; gauche?: number; asymetrie?: number } | Record<string, unknown> | null;
  notes: string | null;
};

type MonthlyMarkersProps = {
  markers: MonthlyMarkerRow[]; // triés DESC sur measured_at
};

export function MonthlyMarkers({ markers }: MonthlyMarkersProps) {
  const lastByType = groupLastByType(markers);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Marqueurs mensuels
      </h2>

      <div className="mt-3 space-y-2">
        <SLHRTCard marker={lastByType.get('slhrt') ?? null} />
        <ProprioCard
          markerG={lastByType.get('proprio_unipodal_g') ?? null}
          markerD={lastByType.get('proprio_unipodal_d') ?? null}
        />
        <KineCard marker={lastByType.get('kine_validation') ?? null} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground italic">
        Saisie depuis l&apos;app à venir (V1.5e3). Pour l&apos;instant, on insère
        manuellement via Sandra.
      </p>
    </section>
  );
}

function groupLastByType(markers: MonthlyMarkerRow[]): Map<string, MonthlyMarkerRow> {
  const out = new Map<string, MonthlyMarkerRow>();
  for (const m of markers) {
    if (!out.has(m.marker_type)) {
      out.set(m.marker_type, m);
    }
  }
  return out;
}

function SLHRTCard({ marker }: { marker: MonthlyMarkerRow | null }) {
  if (!marker) {
    return (
      <EmptyMarker
        title="SLHRT (Single Leg Heel Rise Test)"
        hint="Mesure mensuelle des reps côté D / côté G. Cible : asymétrie < 10 %."
      />
    );
  }
  const meta = marker.metadata as { droite?: number; gauche?: number; asymetrie?: number } | null;
  const droite = meta?.droite;
  const gauche = meta?.gauche;
  const asym = meta?.asymetrie;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">SLHRT</span>
        <span className="text-xs text-muted-foreground">{marker.measured_at}</span>
      </div>
      <p className="mt-1 text-xs text-foreground">
        {typeof droite === 'number' && (
          <>Côté D : <strong>{droite} reps</strong>{' '}</>
        )}
        {typeof gauche === 'number' && (
          <>· Côté G : <strong>{gauche} reps</strong>{' '}</>
        )}
        {typeof asym === 'number' && (
          <>· Asymétrie : <strong>{asym} %</strong> (cible &lt; 10 %)</>
        )}
      </p>
    </div>
  );
}

function ProprioCard({
  markerG,
  markerD,
}: {
  markerG: MonthlyMarkerRow | null;
  markerD: MonthlyMarkerRow | null;
}) {
  if (!markerG && !markerD) {
    return (
      <EmptyMarker
        title="Proprioception"
        hint="Appui unipodal yeux fermés sur coussin. Cible Phase 1B : 30 s."
      />
    );
  }
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Proprioception</span>
        <span className="text-xs text-muted-foreground">
          {(markerG ?? markerD)?.measured_at}
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground">
        {markerG && typeof markerG.value_numeric === 'number' && (
          <>Gauche : <strong>{markerG.value_numeric} s</strong>{' '}</>
        )}
        {markerD && typeof markerD.value_numeric === 'number' && (
          <>· Droite : <strong>{markerD.value_numeric} s</strong></>
        )}
      </p>
    </div>
  );
}

function KineCard({ marker }: { marker: MonthlyMarkerRow | null }) {
  if (!marker) {
    return (
      <EmptyMarker
        title="Validation kiné"
        hint="Date + actes (Cyriax, dry needling, ondes de choc...). Saisie après chaque RDV."
      />
    );
  }
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Validation kiné</span>
        <span className="text-xs text-muted-foreground">{marker.measured_at}</span>
      </div>
      {marker.value_text && (
        <p className="mt-1 text-xs text-foreground">{marker.value_text}</p>
      )}
    </div>
  );
}

function EmptyMarker({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export type { MarkerType };
