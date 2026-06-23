import { Response } from 'express';
import Charge from '../models/Charge';
import Unit from '../models/Unit';
import Issue from '../models/Issue';
import Reservation from '../models/Reservation';
import Announcement from '../models/Announcement';
import Expense from '../models/Expense';
import { AuthRequest } from '../middlewares/auth';
import { syncOverdueCharges } from '../utils/charges';
import { notDeleted } from '../utils/softDelete';
import { errorDetails } from '../utils/errorDetails';

export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await syncOverdueCharges(condominiumId!);

    const [
      totalUnits, chargesAgg,
      openIssues, pendingReservations, lateChargesList,
      recentAnnouncements, recentIssues, upcomingReservations,
      expensesAgg,
    ] = await Promise.all([
      Unit.countDocuments({ condominiumId }),
      Charge.aggregate([
        { $match: { condominiumId, ...notDeleted } },
        {
          $group: {
            _id: null,
            paidThisMonth: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'paid'] }, { $eq: ['$referenceMonth', currentMonth] }] }, '$amount', 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, '$amount', 0] } },
          }
        }
      ]),
      Issue.countDocuments({ condominiumId, status: 'open' }),
      Reservation.countDocuments({ condominiumId, status: 'pending' }),
      Charge.find({ condominiumId, status: 'late', ...notDeleted })
        .populate('unitId', 'block number').populate('residentId', 'name phone')
        .sort({ dueDate: 1 }).limit(10),
      Announcement.find({ condominiumId }).sort({ createdAt: -1 }).limit(5),
      Issue.find({ condominiumId, status: { $in: ['open', 'in_progress'] } })
        .populate('unitId', 'block number').sort({ createdAt: -1 }).limit(5),
      Reservation.find({ condominiumId, status: 'pending', date: { $gte: now } })
        .populate('unitId', 'block number').sort({ date: 1 }).limit(5),
      Expense.aggregate([
        { $match: { condominiumId, ...notDeleted } },
        {
          $group: {
            _id: null,
            paidThisMonth: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'paid'] }, { $gte: ['$date', new Date(now.getFullYear(), now.getMonth(), 1)] }, { $lte: ['$date', new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)] }] }, '$amount', 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          }
        }
      ]),
    ]);

    const receivedThisMonth = chargesAgg[0]?.paidThisMonth || 0;
    const expensesPaidThisMonth = expensesAgg[0]?.paidThisMonth || 0;

    res.json({
      stats: {
        receivedThisMonth,
        toReceive: chargesAgg[0]?.pending || 0,
        late: chargesAgg[0]?.late || 0,
        expensesPaidThisMonth,
        expensesPending: expensesAgg[0]?.pending || 0,
        balanceThisMonth: receivedThisMonth - expensesPaidThisMonth,
        totalUnits,
        openIssues,
        pendingReservations,
      },
      tasks: [
        {
          title: 'Cobranças em atraso',
          description: `${lateChargesList.length} cobrança(s) exigem atenção`,
          count: lateChargesList.length,
          link: '/cobrancas',
          type: 'charge',
        },
        {
          title: 'Ocorrências abertas',
          description: `${openIssues} solicitação(ões) aguardam análise`,
          count: openIssues,
          link: '/ocorrencias',
          type: 'issue',
        },
        {
          title: 'Reservas pendentes',
          description: `${pendingReservations} pedido(s) para aprovar ou recusar`,
          count: pendingReservations,
          link: '/reservas',
          type: 'reservation',
        },
      ].filter((task) => task.count > 0),
      lateCharges: lateChargesList,
      recentAnnouncements,
      recentIssues,
      upcomingReservations,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao carregar dashboard', details: errorDetails(error) });
  }
};

export const getResidentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const unitId = req.user!.unitId;
    await syncOverdueCharges(condominiumId!);

    const [pendingCharges, recentAnnouncements, openIssues, upcomingReservations] = await Promise.all([
      Charge.find({ condominiumId, unitId, status: { $in: ['pending', 'late'] }, ...notDeleted }).sort({ dueDate: 1 }).limit(5),
      Announcement.find({ condominiumId }).sort({ isPinned: -1, createdAt: -1 }).limit(5),
      Issue.find({ condominiumId, unitId, status: { $in: ['open', 'in_progress'] } }).sort({ createdAt: -1 }).limit(5),
      Reservation.find({ condominiumId, unitId, date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
    ]);

    res.json({
      stats: {
        pendingCharges: pendingCharges.length,
        recentAnnouncements: recentAnnouncements.length,
        openIssues: openIssues.length,
        upcomingReservations: upcomingReservations.length,
      },
      tasks: [
        {
          title: 'Cobranças pendentes',
          description: `${pendingCharges.length} cobrança(s) para acompanhar`,
          count: pendingCharges.length,
          link: '/morador/cobrancas',
          type: 'charge',
        },
        {
          title: 'Ocorrências em andamento',
          description: `${openIssues.length} solicitação(ões) em aberto`,
          count: openIssues.length,
          link: '/morador/ocorrencias',
          type: 'issue',
        },
      ].filter((task) => task.count > 0),
      pendingCharges,
      recentAnnouncements,
      openIssues,
      upcomingReservations,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao carregar dashboard', details: errorDetails(error) });
  }
};

// ─── Charts ─────────────────────────────────────────────────────────────────
export const getAdminCharts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;

    // Build last 6 months labels: ['2025-01', ..., '2025-06']
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Revenue per month (1 aggregation instead of 3)
    const [chargesByMonth, unitStats, issuesOpen, issuesResolved] =
      await Promise.all([
        Charge.aggregate([
          { $match: { condominiumId, referenceMonth: { $in: months }, ...notDeleted } },
          {
            $group: {
              _id: '$referenceMonth',
              received: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
              pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
              late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, '$amount', 0] } },
            }
          }
        ]),
        // Unit occupancy
        Unit.aggregate([
          { $match: { condominiumId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Issues trend — open (created in last 6 months)
        Issue.aggregate([
          {
            $match: {
              condominiumId,
              createdAt: {
                $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        // Issues resolved (status changed to 'resolved' approximated by updatedAt)
        Issue.aggregate([
          {
            $match: {
              condominiumId,
              status: 'resolved',
              updatedAt: {
                $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m', date: '$updatedAt' },
              },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    // Helper to convert aggregation array to month-indexed map
    const toMapObj = (arr: { _id: string; received?: number; pending?: number; late?: number; count?: number }[], key: 'received'|'pending'|'late'|'count') =>
      Object.fromEntries(arr.map((x) => [x._id, x[key] ?? 0]));

    const receivedMap = toMapObj(chargesByMonth, 'received');
    const pendingMap = toMapObj(chargesByMonth, 'pending');
    const lateMap = toMapObj(chargesByMonth, 'late');
    const issueOpenMap = toMapObj(issuesOpen as any, 'count');
    const issueResolvedMap = toMapObj(issuesResolved as any, 'count');

    // Shape for chart: short label (e.g. "Jan")
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const revenue = months.map((m) => ({
      month: monthLabels[parseInt(m.split('-')[1], 10) - 1],
      received: receivedMap[m] || 0,
      pending: pendingMap[m] || 0,
      late: lateMap[m] || 0,
    }));

    const issuesTrend = months.map((m) => ({
      month: monthLabels[parseInt(m.split('-')[1], 10) - 1],
      open: issueOpenMap[m] || 0,
      resolved: issueResolvedMap[m] || 0,
    }));

    // Unit occupancy
    const occupancyMap = Object.fromEntries(unitStats.map((u: any) => [u._id, u.count]));
    const occupancy = {
      occupied: occupancyMap['occupied'] || 0,
      empty: occupancyMap['empty'] || 0,
      late: occupancyMap['late'] || 0,
      total: (occupancyMap['occupied'] || 0) + (occupancyMap['empty'] || 0) + (occupancyMap['late'] || 0),
    };

    res.json({ revenue, issuesTrend, occupancy });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao carregar gráficos', details: errorDetails(error) });
  }
};
