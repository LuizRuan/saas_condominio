import { Response } from 'express';
import Reservation from '../models/Reservation';
import ReservationBlock from '../models/ReservationBlock';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import { AuthRequest } from '../middlewares/auth';
import { findResidentForUser } from '../utils/residentContext';
import { notify } from '../utils/notifications';
import { audit } from '../utils/audit';

const hasTimeConflict = (startTime: string, endTime: string) => ({
  $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
});

export const createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { area, date, startTime, endTime, notes } = req.body;
    const condominiumId = req.user!.condominiumId;
    const reservationDate = new Date(date);

    if (!area?.trim() || !date || !startTime || !endTime) {
      res.status(400).json({ error: 'Área, data e horários são obrigatórios' });
      return;
    }

    if (Number.isNaN(reservationDate.getTime()) || startTime >= endTime) {
      res.status(400).json({ error: 'Data ou intervalo de horário inválido' });
      return;
    }

    const unitId = req.user!.role === 'resident' ? req.user!.unitId : req.body.unitId;
    const unit = await Unit.findOne({ _id: unitId, condominiumId });
    if (!unit) {
      res.status(400).json({ error: 'Unidade inválida para este condomínio' });
      return;
    }

    const resident = await findResidentForUser(req.user!);
    if (req.user!.role === 'resident' && !resident) {
      res.status(409).json({ error: 'Conta de morador sem cadastro vinculado' });
      return;
    }

    // Check for conflicting approved reservations
    const [conflict, blocked] = await Promise.all([
      Reservation.findOne({
        condominiumId, area: area.trim(), date: reservationDate, status: 'approved',
        ...hasTimeConflict(startTime, endTime),
      }),
      ReservationBlock.findOne({
        condominiumId, area: area.trim(), date: reservationDate,
        ...hasTimeConflict(startTime, endTime),
      }),
    ]);

    if (conflict || blocked) {
      res.status(409).json({ error: 'Já existe uma reserva aprovada para este horário e área' });
      return;
    }

    const reservation = await Reservation.create({
      condominiumId,
      unitId: unit._id,
      residentId: resident?._id,
      area: area.trim(),
      date: reservationDate,
      startTime,
      endTime,
      notes: notes || '',
    });

    if (req.user!.role === 'resident') {
      await notify({
        condominiumId: reservation.condominiumId,
        targetRole: 'admin',
        type: 'reservation',
        title: `${req.user!.name} solicitou uma reserva`,
        message: `${reservation.area} em ${reservationDate.toLocaleDateString('pt-BR')}`,
        link: '/reservas',
      });
    }

    await audit(req, {
      action: 'create',
      entity: 'reservation',
      entityId: reservation._id as any,
      message: `Reserva criada para ${reservation.area}`,
      metadata: { date, startTime, endTime },
    });

    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar reserva', details: error.message });
  }
};

export const getReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { condominiumId: req.user!.condominiumId };
    if (req.user!.role === 'resident') filter.unitId = req.user!.unitId;
    if (req.query.status) filter.status = req.query.status;

    const reservations = await Reservation.find(filter)
      .populate('unitId', 'block number')
      .populate('residentId', 'name')
      .sort({ date: -1 });
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar reservas', details: error.message });
  }
};

export const getReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id, condominiumId: req.user!.condominiumId,
      ...(req.user!.role === 'resident' ? { unitId: req.user!.unitId } : {}),
    }).populate('unitId', 'block number').populate('residentId', 'name');
    if (!reservation) { res.status(404).json({ error: 'Reserva não encontrada' }); return; }
    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar reserva', details: error.message });
  }
};

export const approveReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (
      !reservation ||
      !req.user!.condominiumId ||
      reservation.condominiumId.toString() !== req.user!.condominiumId.toString()
    ) {
      res.status(404).json({ error: 'Reserva não encontrada' }); return;
    }

    // Re-check for conflicts before approving
    const [conflict, blocked] = await Promise.all([
      Reservation.findOne({
        condominiumId: reservation.condominiumId, area: reservation.area,
        date: reservation.date, status: 'approved', _id: { $ne: reservation._id },
        ...hasTimeConflict(reservation.startTime, reservation.endTime),
      }),
      ReservationBlock.findOne({
        condominiumId: reservation.condominiumId, area: reservation.area,
        date: reservation.date,
        ...hasTimeConflict(reservation.startTime, reservation.endTime),
      }),
    ]);

    if (conflict || blocked) {
      res.status(409).json({ error: 'Conflito de horário com outra reserva aprovada ou bloqueada' }); return;
    }

    reservation.status = 'approved';
    await reservation.save();

    if (reservation.residentId) {
      const resident = await Resident.findById(reservation.residentId);
      if (resident?.userId) {
        await notify({
          condominiumId: reservation.condominiumId,
          userId: resident.userId,
          type: 'reservation',
          title: 'Reserva aprovada',
          message: `${reservation.area} em ${reservation.date.toLocaleDateString('pt-BR')}`,
          link: '/morador/reservas',
        });
      }
    }

    await audit(req, {
      action: 'approve',
      entity: 'reservation',
      entityId: reservation._id as any,
      message: `Reserva de ${reservation.area} aprovada`,
    });

    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao aprovar reserva', details: error.message });
  }
};

export const rejectReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = await Reservation.findOneAndUpdate(
      { _id: req.params.id, condominiumId: req.user!.condominiumId },
      { status: 'rejected' }, { new: true }
    );
    if (!r) { res.status(404).json({ error: 'Reserva não encontrada' }); return; }
    if (r.residentId) {
      const resident = await Resident.findById(r.residentId);
      if (resident?.userId) {
        await notify({
          condominiumId: r.condominiumId,
          userId: resident.userId,
          type: 'reservation',
          title: 'Reserva recusada',
          message: `${r.area} em ${r.date.toLocaleDateString('pt-BR')}`,
          link: '/morador/reservas',
        });
      }
    }
    await audit(req, {
      action: 'reject',
      entity: 'reservation',
      entityId: r._id as any,
      message: `Reserva de ${r.area} recusada`,
    });
    res.json(r);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao recusar reserva', details: error.message });
  }
};

export const cancelReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: any = {
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    };

    // Residents can only cancel their OWN reservations (not other unit members')
    if (req.user!.role === 'resident') {
      const resident = await Resident.findOne({ userId: req.user!._id, condominiumId: req.user!.condominiumId });
      if (!resident) {
        res.status(403).json({ error: 'Cadastro de morador não encontrado' });
        return;
      }
      query.residentId = resident._id;
    }

    const r = await Reservation.findOneAndUpdate(
      query,
      { status: 'cancelled' }, { new: true, runValidators: true }
    );
    if (!r) { res.status(403).json({ error: 'Você não tem permissão para cancelar esta reserva' }); return; }
    await audit(req, {
      action: 'cancel',
      entity: 'reservation',
      entityId: r._id as any,
      message: `Reserva de ${r.area} cancelada`,
    });
    res.json(r);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cancelar reserva', details: error.message });
  }
};

export const deleteReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findOneAndDelete({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reserva não encontrada' });
      return;
    }

    await audit(req, {
      action: 'delete',
      entity: 'reservation',
      entityId: reservation._id as any,
      message: `Reserva de ${reservation.area} excluída`,
    });

    res.json({ message: 'Reserva excluída com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir reserva', details: error.message });
  }
};

export const getReservationBlocks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { condominiumId: req.user!.condominiumId };
    if (req.query.area) filter.area = req.query.area;
    if (req.query.date) filter.date = new Date(String(req.query.date));

    const blocks = await ReservationBlock.find(filter).sort({ date: 1, startTime: 1 });
    res.json(blocks);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar bloqueios', details: error.message });
  }
};

export const createReservationBlock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { area, date, startTime, endTime, reason } = req.body;
    const reservationDate = new Date(date);

    if (!area?.trim() || !date || !startTime || !endTime || startTime >= endTime || Number.isNaN(reservationDate.getTime())) {
      res.status(400).json({ error: 'Área, data e horários válidos são obrigatórios' });
      return;
    }

    const conflict = await Reservation.findOne({
      condominiumId: req.user!.condominiumId,
      area: area.trim(),
      date: reservationDate,
      status: 'approved',
      ...hasTimeConflict(startTime, endTime),
    });

    if (conflict) {
      res.status(409).json({ error: 'Já existe uma reserva aprovada neste horário' });
      return;
    }

    const block = await ReservationBlock.create({
      condominiumId: req.user!.condominiumId,
      area: area.trim(),
      date: reservationDate,
      startTime,
      endTime,
      reason: reason || 'Bloqueio administrativo',
      createdBy: req.user!._id,
    });

    await audit(req, {
      action: 'create',
      entity: 'reservation_block',
      entityId: block._id as any,
      message: `Bloqueio criado para ${block.area}`,
      metadata: { date, startTime, endTime },
    });

    res.status(201).json(block);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar bloqueio', details: error.message });
  }
};

export const deleteReservationBlock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const block = await ReservationBlock.findOneAndDelete({
      _id: req.params.id,
      condominiumId: req.user!.condominiumId,
    });

    if (!block) {
      res.status(404).json({ error: 'Bloqueio não encontrado' });
      return;
    }

    await audit(req, {
      action: 'delete',
      entity: 'reservation_block',
      entityId: block._id as any,
      message: `Bloqueio de ${block.area} removido`,
    });

    res.json({ message: 'Bloqueio removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao remover bloqueio', details: error.message });
  }
};
