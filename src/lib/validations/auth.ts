import { z } from 'zod';

/**
 * Schémas de validation pour les flows d'authentification.
 *
 * - Email : normalisé en minuscules.
 * - Password : min 8, max 72 (limite bcrypt). Pas de règle de complexité forcée —
 *   on laisse Dashlane / les gestionnaires de mots de passe générer des passwords
 *   longs et aléatoires, plus sûrs que des règles arbitraires.
 */

export const emailSchema = z
  .string()
  .email('Email invalide.')
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit faire au moins 8 caractères.')
  .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères.');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    password_confirm: passwordSchema,
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['password_confirm'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
