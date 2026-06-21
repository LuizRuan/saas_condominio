import { Response } from 'express';
import Condominium from '../models/Condominium';
import { AuthRequest } from '../middlewares/auth';

type Plan = 'free' | 'pro' | 'ultra';

export async function requirePlan(
  req: AuthRequest,
  res: Response,
  allowedPlans: Plan[],
  message?: string
): Promise<boolean> {
  if (req.user?.isDemo) return true;
  const condo = await Condominium.findById(req.user!.condominiumId).select('plan');
  const plan = (condo?.plan ?? 'free') as Plan;
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
