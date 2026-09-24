/// Member 4 — Validation/Safety Agent models.
/// Matches backend DTOs/ValidationDtos.cs + ValidationsController.cs
class ValidationViolation {
  final String code;
  final String message;
  final String severity; // BLOCKER | WARNING

  ValidationViolation({required this.code, required this.message, required this.severity});

  factory ValidationViolation.fromJson(Map<String, dynamic> j) => ValidationViolation(
        code: (j['code'] ?? '').toString(),
        message: (j['message'] ?? '').toString(),
        severity: (j['severity'] ?? '').toString(),
      );
}

class ValidationCheck {
  final String tool;
  final bool passed;
  final String detail;

  ValidationCheck({required this.tool, required this.passed, required this.detail});

  factory ValidationCheck.fromJson(Map<String, dynamic> j) => ValidationCheck(
        tool: (j['tool'] ?? j['Tool'] ?? '').toString(),
        passed: j['passed'] ?? j['Passed'] ?? false,
        detail: (j['detail'] ?? j['Detail'] ?? '').toString(),
      );
}

class ValidationResult {
  final int? dispatchId;
  final int? incidentId;
  final bool isValid;
  final String recommendation; // APPROVE | REVISE | REJECT
  final List<ValidationViolation> violations;
  final List<ValidationViolation> warnings;
  final List<ValidationCheck> checks;
  final String validatedAt;
  final int? auditId;
  final int durationMs;
  final String validatedBy;

  ValidationResult({
    this.dispatchId,
    this.incidentId,
    required this.isValid,
    required this.recommendation,
    required this.violations,
    required this.warnings,
    required this.checks,
    required this.validatedAt,
    this.auditId,
    required this.durationMs,
    required this.validatedBy,
  });

  static List<ValidationViolation> _list(dynamic v) {
    if (v is! List) return [];
    return v.map((e) => ValidationViolation.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  static List<ValidationCheck> _checks(dynamic v) {
    if (v is! List) return [];
    return v.map((e) => ValidationCheck.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  factory ValidationResult.fromJson(Map<String, dynamic> j) => ValidationResult(
        dispatchId: (j['dispatchId'] as num?)?.toInt(),
        incidentId: (j['incidentId'] as num?)?.toInt(),
        isValid: j['isValid'] ?? false,
        recommendation: (j['recommendation'] ?? 'REJECT').toString(),
        violations: _list(j['violations']),
        warnings: _list(j['warnings']),
        checks: _checks(j['checks']),
        validatedAt: (j['validatedAt'] ?? '').toString(),
        auditId: (j['auditId'] as num?)?.toInt(),
        durationMs: (j['durationMs'] as num?)?.toInt() ?? 0,
        validatedBy: (j['validatedBy'] ?? '').toString(),
      );
}

class ValidationHistoryEntry {
  final int auditId;
  final int dispatchId;
  final int? incidentId;
  final bool isValid;
  final String recommendation;
  final int violationCount;
  final int warningCount;
  final int checkCount;
  final String validatedBy;
  final int durationMs;
  final String validatedAt;

  ValidationHistoryEntry({
    required this.auditId,
    required this.dispatchId,
    this.incidentId,
    required this.isValid,
    required this.recommendation,
    required this.violationCount,
    required this.warningCount,
    required this.checkCount,
    required this.validatedBy,
    required this.durationMs,
    required this.validatedAt,
  });

  factory ValidationHistoryEntry.fromJson(Map<String, dynamic> j) => ValidationHistoryEntry(
        auditId: (j['auditId'] as num? ?? 0).toInt(),
        dispatchId: (j['dispatchId'] as num? ?? 0).toInt(),
        incidentId: (j['incidentId'] as num?)?.toInt(),
        isValid: j['isValid'] ?? false,
        recommendation: (j['recommendation'] ?? '').toString(),
        violationCount: (j['violationCount'] as num? ?? 0).toInt(),
        warningCount: (j['warningCount'] as num? ?? 0).toInt(),
        checkCount: (j['checkCount'] as num? ?? 0).toInt(),
        validatedBy: (j['validatedBy'] ?? '').toString(),
        durationMs: (j['durationMs'] as num? ?? 0).toInt(),
        validatedAt: (j['validatedAt'] ?? '').toString(),
      );
}
