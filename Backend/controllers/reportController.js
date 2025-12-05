const Report = require('../models/Report');
const Attack = require('../models/Attack');
const AuditLog = require('../models/AuditLog');

// Get all reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('generated_by', 'username full_name')
      .sort({ generated_at: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generated_by', 'username full_name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update access count
    report.access_count += 1;
    report.last_accessed = new Date();
    await report.save();

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate report
exports.generateReport = async (req, res) => {
  try {
    const {
      title,
      report_type,
      start_date,
      end_date,
      filters = {}
    } = req.body;

    const startTime = Date.now();

    // Build query from filters
    const query = {};
    if (start_date) query.date = { $gte: new Date(start_date) };
    if (end_date) {
      if (!query.date) query.date = {};
      query.date.$lte = new Date(end_date);
    }
    if (filters.attack_types) query.type = { $in: filters.attack_types };
    if (filters.countries) query.target_country = { $in: filters.countries };
    if (filters.severity_levels) query.severity = { $in: filters.severity_levels };
    if (filters.statuses) query.status = { $in: filters.statuses };

    // Get statistics
    const stats = await Attack.aggregate([
      { $match: query },
      {
        $facet: {
          total: [{ $count: 'count' }],
          by_type: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 }
              }
            }
          ],
          by_country: [
            {
              $group: {
                _id: '$target_country',
                count: { $sum: 1 }
              }
            }
          ],
          by_severity: [
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          financial: [
            {
              $group: {
                _id: null,
                total: { $sum: '$financial_impact' },
                avg: { $avg: '$financial_impact' }
              }
            }
          ]
        }
      }
    ]);

    // Get top IPs
    const topIPs = await Attack.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$source_ip',
          count: { $sum: 1 },
          avg_severity: { $avg: '$severity_score' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const generationTime = (Date.now() - startTime) / 1000;

    // Create report
    const report = new Report({
      title,
      report_type,
      report_id: `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      summary: `Report covering ${stats[0].total[0]?.count || 0} attacks`,
      statistics: {
        total_attacks: stats[0].total[0]?.count || 0,
        attacks_by_type: stats[0].by_type,
        attacks_by_country: stats[0].by_country,
        severity_distribution: stats[0].by_severity,
        top_ips: topIPs,
        financial_impact: stats[0].financial[0]?.total || 0
      },
      filters: {
        date_range: {
          start: new Date(start_date),
          end: new Date(end_date)
        },
        ...filters
      },
      generated_by: req.user._id,
      generation_time_seconds: generationTime
    });

    await report.save();

    // Log audit
    await AuditLog.create({
      action: 'CREATE',
      resource_type: 'Report',
      resource_id: report._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Generated report: ${title}`
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await AuditLog.create({
      action: 'DELETE',
      resource_type: 'Report',
      resource_id: report._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Deleted report: ${report.title}`
    });

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

