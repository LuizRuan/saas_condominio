import { IUserDoc } from '../models/User';
import Resident from '../models/Resident';

export const findResidentForUser = async (user: IUserDoc) => {
  if (user.role !== 'resident' || !user.condominiumId || !user.unitId) {
    return null;
  }

  return Resident.findOne({
    userId: user._id,
    condominiumId: user.condominiumId,
    unitId: user.unitId,
  });
};
