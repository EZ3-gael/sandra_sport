import { z } from 'zod';

/**
 * Catalogue des tests cliniques. Chaque entrée définit :
 *   - code : identifiant stable côté DB
 *   - label / helper : présentation UI
 *   - side : côté testé par défaut
 *   - resultsEnum : valeurs qualitatives possibles + leur libellé FR + flag pathologique
 *
 * Modèle extensible : ajouter SLHRT, SEBT, knee-to-wall plus tard sans toucher la DB.
 */
export const CLINICAL_TESTS = [
  {
    code: 'T1_dorsiflexion_active',
    label: 'Dorsiflexion active isolée',
    side: 'left',
    helper:
      "Assis sur une chaise, jambes pendantes sans appui. Lever le pied gauche seul, lentement, contre pesanteur (pas de résistance). Comparer gauche vs droite en amplitude et en qualité de la contraction (le tibial antérieur doit saillir sur la face antérieure de la cheville).",
    resultsEnum: {
      symmetric: { label: 'Amplitude symétrique G/D', isPathological: false },
      mild_deficit: {
        label: 'Pied G remonte, mais moins haut ou plus hésitant',
        isPathological: true,
      },
      severe_deficit: {
        label: "Pied G n'atteint pas 90° contre pesanteur",
        isPathological: true,
      },
    },
  },
  {
    code: 'T2_hallux_extension',
    label: 'Extension hallux contre résistance',
    side: 'left',
    helper:
      "Assis, pied à plat. Essayer de lever le gros orteil gauche vers le haut. Placer un doigt dessus et résister. Comparer gauche vs droite. L'extenseur de l'hallux est innervé par le nerf fibulaire profond — une faiblesse unilatérale gauche oriente vers une atteinte nerveuse plutôt qu'AMI.",
    resultsEnum: {
      symmetric: { label: 'Force symétrique G/D', isPathological: false },
      mild_deficit: {
        label: 'Hallux G résiste un peu moins que D',
        isPathological: true,
      },
      severe_deficit: {
        label: 'Hallux G clairement plus faible',
        isPathological: true,
      },
    },
  },
  {
    code: 'T3_dorsal_sensitivity',
    label: 'Sensibilité 1er espace inter-métatarsien',
    side: 'left',
    helper:
      "Assis, tester avec un stylo ou l'ongle la sensibilité de la face dorsale du pied entre le gros et le 2e orteil gauche. Comparer avec le même endroit à droite, et avec d'autres zones du pied. Le nerf fibulaire profond innerve exclusivement cet espace.",
    resultsEnum: {
      normal: {
        label: 'Sensibilité normale et symétrique',
        isPathological: false,
      },
      hypoesthesia: {
        label: 'Sensibilité diminuée localement à G',
        isPathological: true,
      },
      paresthesia: {
        label: 'Picotements / fourmillements à G',
        isPathological: true,
      },
      anesthesia: {
        label: 'Absence de sensibilité localisée à G',
        isPathological: true,
      },
    },
  },
  {
    code: 'T4_tinel_fibula',
    label: 'Signe de Tinel au col de la fibula',
    side: 'left',
    helper:
      "Localiser la tête de la fibula gauche (bosse osseuse à la face externe du genou). Juste en dessous, le nerf fibulaire commun contourne l'os. Tapoter doucement avec l'index sur cette zone. Une décharge électrique distale = nerf irrité ou cicatrisé de manière incomplète.",
    resultsEnum: {
      negative: { label: 'Pas de décharge — négatif', isPathological: false },
      positive: {
        label: 'Décharge électrique vers le pied — positif',
        isPathological: true,
      },
    },
  },
  {
    code: 'T5_heel_walk',
    label: 'Heel walk 10 m',
    side: 'left',
    helper:
      "Marcher 10 m sur les talons uniquement, pieds en l'air, en ligne droite. Observer si le pied gauche tient la position ou retombe. C'est le test fonctionnel le plus rapide de la force en dorsiflexion active.",
    resultsEnum: {
      passed: {
        label: 'Pied G tient sur 10 m sans chute',
        isPathological: false,
      },
      partial_drop: {
        label: 'Pied G tombe après quelques pas',
        isPathological: true,
      },
      cannot_perform: {
        label: 'Incapable de marcher sur les talons à G',
        isPathological: true,
      },
    },
  },
] as const;

export type ClinicalTestCode = (typeof CLINICAL_TESTS)[number]['code'];
export type ClinicalTestSide = 'left' | 'right' | 'bilateral';

const allCodes = CLINICAL_TESTS.map((t) => t.code) as [
  ClinicalTestCode,
  ...ClinicalTestCode[],
];

export const clinicalTestSchema = z.object({
  test_code: z.enum(allCodes),
  performed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD'),
  side: z.enum(['left', 'right', 'bilateral']).default('left'),
  result_qualitative: z.string().nullable().optional(),
  result_value_numeric: z.number().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export type ClinicalTest = z.infer<typeof clinicalTestSchema>;

/**
 * Schéma pour la saisie d'un round complet (jusqu'à 5 tests d'un coup, même date).
 * Saisie partielle autorisée : chaque test peut être absent.
 */
export const clinicalTestRoundSchema = z.object({
  performed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD'),
  tests: z.array(clinicalTestSchema),
});

export type ClinicalTestRound = z.infer<typeof clinicalTestRoundSchema>;

/**
 * Récupère le flag isPathological d'un résultat qualitatif donné.
 * Renvoie null si le résultat n'est pas saisi ou inconnu.
 */
export function isResultPathological(
  testCode: ClinicalTestCode,
  resultQualitative: string | null | undefined,
): boolean | null {
  if (!resultQualitative) return null;
  const test = CLINICAL_TESTS.find((t) => t.code === testCode);
  if (!test) return null;
  const entry = (test.resultsEnum as Record<string, { isPathological: boolean }>)[
    resultQualitative
  ];
  return entry?.isPathological ?? null;
}

/**
 * Verdict d'un round :
 * - 'all_normal'   : 0 pathologique sur ≥ 3 tests saisis
 * - 'has_concerns' : ≥ 1 pathologique
 * - 'inconclusive' : < 3 tests saisis
 */
export type RoundVerdict = 'all_normal' | 'has_concerns' | 'inconclusive';

export function evaluateRoundVerdict(
  tests: ReadonlyArray<{
    test_code: ClinicalTestCode;
    result_qualitative: string | null | undefined;
  }>,
): RoundVerdict {
  const filled = tests.filter(
    (t) => t.result_qualitative != null && t.result_qualitative !== '',
  );
  if (filled.length < 3) return 'inconclusive';
  const hasPatho = filled.some(
    (t) => isResultPathological(t.test_code, t.result_qualitative) === true,
  );
  return hasPatho ? 'has_concerns' : 'all_normal';
}

export const ROUND_VERDICT_LABELS: Record<RoundVerdict, string> = {
  all_normal: 'Tout normal',
  has_concerns: 'Consultation recommandée',
  inconclusive: 'Inconclusif (saisie partielle)',
};
