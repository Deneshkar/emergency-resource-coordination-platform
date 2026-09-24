import 'package:flutter/material.dart';
import '../models/volunteer.dart';
import '../models/shift.dart';
import '../services/volunteer_service.dart';

/// Member 4 — Volunteer state management (Provider/ChangeNotifier).
/// Centralises directory search/filter/pagination + duty state so
/// SelectProfile/Profile/Shifts screens stay in sync.
class VolunteerProvider with ChangeNotifier {
  final List<Volunteer> _volunteers = [];
  bool _loading = false;
  String? _error;
  String _search = '';
  bool? _availabilityFilter;
  int _page = 1;
  bool _hasMore = true;
  static const int pageSize = 20;

  List<Volunteer> get volunteers => List.unmodifiable(_volunteers);
  bool get loading => _loading;
  String? get error => _error;
  bool get hasMore => _hasMore;
  String get search => _search;
  bool? get availabilityFilter => _availabilityFilter;

  Future<void> load({bool reset = false}) async {
    if (_loading) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _volunteers.clear();
    }
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final batch = await VolunteerService.getVolunteers(
        search: _search,
        isAvailable: _availabilityFilter,
        page: _page,
        pageSize: pageSize,
      );
      _volunteers.addAll(batch);
      _hasMore = batch.length >= pageSize;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_loading || !_hasMore) return;
    _page++;
    _loading = true;
    notifyListeners();
    try {
      final batch = await VolunteerService.getVolunteers(
        search: _search,
        isAvailable: _availabilityFilter,
        page: _page,
        pageSize: pageSize,
      );
      _volunteers.addAll(batch);
      _hasMore = batch.length >= pageSize;
    } catch (_) {
      _page--;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void setSearch(String v) {
    _search = v;
    load(reset: true);
  }

  void setAvailabilityFilter(bool? v) {
    _availabilityFilter = v;
    load(reset: true);
  }

  void updateLocalAvailability(String id, bool value) {
    final i = _volunteers.indexWhere((v) => v.id == id);
    if (i != -1) {
      _volunteers[i] = _volunteers[i].copyWith(isAvailable: value);
      notifyListeners();
    }
  }

  void removeLocal(String id) {
    _volunteers.removeWhere((v) => v.id == id);
    notifyListeners();
  }

  Future<List<Shift>> shiftsOf(String volunteerId) =>
      VolunteerService.getShifts(volunteerId);

  Future<Volunteer> getById(String id) =>
      VolunteerService.getVolunteerById(id);

  Future<List<Volunteer>> availableBySkill(String skill) =>
      VolunteerService.getAvailableBySkill(skill);

  Future<void> refreshAfterEdit(Volunteer updated) async {
    final i = _volunteers.indexWhere((v) => v.id == updated.id);
    if (i != -1) {
      _volunteers[i] = updated;
      notifyListeners();
    } else {
      await load(reset: true);
    }
  }
}
