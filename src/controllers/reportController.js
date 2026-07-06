const Reservation = require('../models/Reservation');
const Room = require('../models/Room');

async function getSummary(req, res) {
  try {
    const occupancy = await Reservation.occupancyStats();
    const todayCheckIns = await Reservation.todayCheckIns();
    const monthlyRevenue = await Reservation.monthlyRevenue();
    const statusCounts = await Room.countByStatus();

    const revenueThisMonth = monthlyRevenue.find(
      (m) => m.month === new Date().toISOString().slice(0, 7)
    );

    return res.status(200).json({
      total_rooms: occupancy.total_rooms,
      occupied_rooms: occupancy.occupied_rooms,
      available_rooms: occupancy.available_rooms,
      today_check_ins: todayCheckIns.length,
      monthly_revenue: revenueThisMonth ? Number(revenueThisMonth.revenue) : 0,
      revenue_by_month: monthlyRevenue.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
      })),
      room_status_breakdown: statusCounts,
      occupancy_rate:
        occupancy.total_rooms > 0
          ? Math.round((occupancy.occupied_rooms / occupancy.total_rooms) * 100)
          : 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getSummary };
