const Attack = require('../models/Attack');
const IP = require('../models/IP');
const Alert = require('../models/Alert');
const User = require('../models/User');

// Get dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0); // Set to start of day for consistent date comparison

    // Debug logging
    console.log(`[Dashboard] Querying dashboard data for last ${days} days`);
    console.log(`[Dashboard] Start date: ${startDate.toISOString()}`);
    console.log(`[Dashboard] End date: ${new Date().toISOString()}`);

    // Get statistics from multiple collections
    const [
      attackStats,
      ipStats,
      alertStats,
      userStats,
      recentAttacks,
      topIPs
    ] = await Promise.all([
      // Attack statistics - show ALL attacks (no date filter for overall stats)
      Attack.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            by_type: [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ],
            by_severity: [
              {
                $group: {
                  _id: '$severity',
                  count: { $sum: 1 }
                }
              }
            ],
            by_status: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            financial_impact: [
              {
                $group: {
                  _id: null,
                  total: { $sum: '$financial_impact' },
                  avg: { $avg: '$financial_impact' }
                }
              }
            ],
            // Also get stats for last 30 days for comparison
            recent_period: [
              {
                $match: {
                  date: { $gte: startDate }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),

      // IP statistics
      IP.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            blacklisted: [
              {
                $match: { is_blacklisted: true }
              },
              { $count: 'count' }
            ],
            high_threat: [
              {
                $match: { threat_score: { $gte: 70 } }
              },
              { $count: 'count' }
            ],
            top_threats: [
              {
                $match: { threat_score: { $gte: 70 } }
              },
              { $sort: { threat_score: -1 } },
              { $limit: 5 },
              {
                $project: {
                  ip_address: 1,
                  threat_score: 1,
                  country: 1,
                  attack_count: 1
                }
              }
            ]
          }
        }
      ]),

      // Alert statistics
      Alert.aggregate([
        {
          $facet: {
            active: [
              {
                $match: { status: 'Active' }
              },
              { $count: 'count' }
            ],
            by_severity: [
              {
                $group: {
                  _id: '$severity',
                  count: { $sum: 1 }
                }
              }
            ],
            recent: [
              {
                $match: {
                  created_at: { $gte: startDate }
                }
              },
              { $sort: { created_at: -1 } },
              { $limit: 5 }
            ]
          }
        }
      ]),

      // User statistics
      User.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [
              {
                $match: { is_active: true }
              },
              { $count: 'count' }
            ],
            by_role: [
              {
                $group: {
                  _id: '$role',
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Recent attacks - show 10 most recent attacks regardless of date
      Attack.find({})
        .populate('reported_by', 'username')
        .populate('source_ip_ref', 'ip_address country')
        .sort({ date: -1, created_at: -1 })
        .limit(10)
        .lean(),

      // Top dangerous IPs
      IP.find({ is_active: true, threat_score: { $gte: 70 } })
        .sort({ threat_score: -1 })
        .limit(10)
        .select('ip_address country threat_score attack_count is_blacklisted')
        .lean()
    ]);

    // Debug logging for query results
    const totalAttacksAllTime = attackStats[0].total[0]?.count || 0;
    const totalAttacksInPeriod = attackStats[0].recent_period[0]?.count || 0;
    const totalUsers = userStats[0].total[0]?.count || 0;
    const recentAttacksCount = recentAttacks.length;
    
    console.log(`[Dashboard] Total attacks (all time): ${totalAttacksAllTime}`);
    console.log(`[Dashboard] Total attacks (last ${days} days): ${totalAttacksInPeriod}`);
    console.log(`[Dashboard] Total users: ${totalUsers}`);
    console.log(`[Dashboard] Recent attacks returned: ${recentAttacksCount}`);
    
    // Log some sample attack dates for debugging
    if (recentAttacks.length > 0) {
      console.log(`[Dashboard] Sample recent attack dates:`, recentAttacks.slice(0, 3).map(a => ({
        id: a._id,
        date: a.date,
        type: a.type
      })));
    }

    // Format response
    const dashboard = {
      period: {
        days: parseInt(days),
        start_date: startDate,
        end_date: new Date()
      },
      attacks: {
        total: attackStats[0].total[0]?.count || 0,
        by_type: attackStats[0].by_type,
        by_severity: attackStats[0].by_severity,
        by_status: attackStats[0].by_status,
        financial_impact: attackStats[0].financial_impact[0] || { total: 0, avg: 0 }
      },
      ips: {
        total: ipStats[0].total[0]?.count || 0,
        blacklisted: ipStats[0].blacklisted[0]?.count || 0,
        high_threat: ipStats[0].high_threat[0]?.count || 0,
        top_threats: ipStats[0].top_threats
      },
      alerts: {
        active: alertStats[0].active[0]?.count || 0,
        by_severity: alertStats[0].by_severity,
        recent: alertStats[0].recent
      },
      users: {
        total: userStats[0].total[0]?.count || 0,
        active: userStats[0].active[0]?.count || 0,
        by_role: userStats[0].by_role
      },
      recent_attacks: recentAttacks,
      top_dangerous_ips: topIPs
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attack trends over time
exports.getAttackTrends = async (req, res) => {
  try {
    const { days = 30, group_by = 'day' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0); // Set to start of day for consistent date comparison

    let dateFormat;
    switch (group_by) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const trends = await Attack.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$date' }
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$severity', 'High'] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$severity', 'Medium'] }, 1, 0] }
          },
          low: {
            $sum: { $cond: [{ $eq: ['$severity', 'Low'] }, 1, 0] }
          },
          avg_severity_score: { $avg: '$severity_score' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top countries by attacks
exports.getTopCountries = async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0); // Set to start of day for consistent date comparison

    const countries = await Attack.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$target_country',
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] }
          },
          total_financial_impact: { $sum: '$financial_impact' },
          avg_severity_score: { $avg: '$severity_score' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

