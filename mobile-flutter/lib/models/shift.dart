class Shift {
  final String id;
  final String startTime;
  final String endTime;
  final String status;

  Shift({
    required this.id,
    required this.startTime,
    required this.endTime,
    required this.status,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      id: json['id'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      status: json['status'].toString(),
    );
  }
}