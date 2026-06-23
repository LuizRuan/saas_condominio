import { Response } from 'express';
import Condominium, { ICondominium } from '../models/Condominium';
import { AuthRequest } from '../middlewares/auth';

type Plan = 'free' | 'pro' | 'ultra';

// Statuses that indicate an inactive/lapsed subscription — effective plan reverts to free.
const INACTIVE_STATUSES = new Set<string>(['canceled', 'failed', 'overdue']);

/**
 * Returns the plan the condominium can actually use, taking subscription
 * status into account. Does NOT change any DB field.
 *
 * Rules:
 *   - No condo                        → free
 *   - subscriptionStatus ∈ {canceled, failed, overdue} → free
 *   - plan ∈ {pro, ultra} and status ok (active/pending/undefined) → plan
 *   - otherwise → free
 */
export function getEffectivePlan(
  condo: Pick<ICondominium, 'plan' | 'subscriptionStatus'> | null | undefined
): Plan {
  if (!condo) return 'free';
  if (condo.subscriptionStatus && INACTIVE_STATUSES.has(condo.subscriptionStatus)) return 'free';
  if (condo.plan === 'pro' || condo.plan === 'ultra') return condo.plan;
  return 'free';
}

export async function requirePlan(
  req: AuthRequest,
  res: Response,
  allowedPlans: Plan[],
  message?: string
): Promise<boolean> {
  if (req.user?.isDemo) return true;
  const condo = await Condominium.findById(req.user!.condominiumId).select('plan subscriptionStatus');
  const plan = getEffectivePlan(condo);
  if (!allowedPlans.includes(plan)) {
    res.status(403).json({
      error: message ?? 'Este recurso não está disponível no seu plano atual.',
      requiredPlan: allowedPlans[0],
      currentPlan: plan,
    });
    return false;
  }
  return true;
}
