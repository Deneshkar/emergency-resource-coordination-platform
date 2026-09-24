/// Shift model — backend returns StartTime/EndTime as ISO DateTime strings
/// and Status as int (0-3) or string. This parser accepts both.
class Shift {
  final String id;
  final String volunteerId;
  final DateTime? startTime;
  final DateTime? endTime;
  final String status;
  final String rawStart;
  final String rawEnd;

  Shift({
    required this.id,
    required this.volunteerId,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.rawStart,
    required this.rawEnd,
  });

  static const List<String> allowedStatuses = [
    'Scheduled',
    'Active',
    'Completed',
    'Cancelled'
  ];

  static String _parseStatus(dynamic v) {
    if (v == null) return 'Scheduled';
    if (v is int) {
      if (v >= 0 && v < allowedStatuses.length) return allowedStatuses[v];
      return 'Scheduled';
    }
    final s = v.toString().trim();
    // backend may send "0".."3" as string
    final asInt = int.tryParse(s);
    if (asInt != null && asInt >= 0 && asInt < allowedStatuses.length) {
      return allowedStatuses[asInt];
    }
    for (final a in allowedStatuses) {
      if (a.toLowerCase() == s.toLowerCase()) return a;
    }
    return s.isEmpty ? 'Scheduled' : s;
  }

  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    try {
      return DateTime.parse(v.toString());
    } catch (_) {
      return null;
    }
  }

  factory Shift.fromJson(Map<String, dynamic> json) {
    final rawStart = (json['startTime'] ?? json['StartTime'] ?? '').toString();
    final rawEnd = (json['endTime'] ?? json['EndTime'] ?? '').toString();
    return Shift(
      id: (json['id'] ?? json['Id'] ?? '').toString(),
      volunteerId:
          (json['volunteerId'] ?? json['VolunteerId'] ?? '').toString(),
      startTime: _parseDate(json['startTime'] ?? json['StartTime']),
      endTime: _parseDate(json['endTime'] ?? json['EndTime']),
      status: _parseStatus(json['status'] ?? json['Status']),
      rawStart: rawStart,
      rawEnd: rawEnd,
    );
  }

  /// Human-readable range, falls back to raw ISO when unparsable.
  String get displayRange {
    if (startTime != null && endTime != null) {
      String f(DateTime d) =>
          '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} '
          '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
      return '${f(startTime!)} → ${f(endTime!)}';
    }
    return '$rawStart → $rawEnd';
  }
}
