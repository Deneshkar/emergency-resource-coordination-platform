import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/volunteer_provider.dart';
import '../models/volunteer.dart';
import '../services/volunteer_service.dart';
import 'profile_screen.dart';
import 'add_volunteer_screen.dart';
import 'edit_volunteer_screen.dart';

class SelectProfileScreen extends StatefulWidget {
  const SelectProfileScreen({super.key});

  @override
  State<SelectProfileScreen> createState() => _SelectProfileScreenState();
}

class _SelectProfileScreenState extends State<SelectProfileScreen> {
  final _searchCtrl = TextEditingController();
  bool? _availabilityFilter; // null = all
  String _sort = 'name';
  final List<Volunteer> _items = [];
  bool _loading = false;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  static const int _pageSize = 20;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _error = null;
        _page = 1;
        _hasMore = true;
        _items.clear();
      });
    }
    try {
      final batch = await VolunteerService.getVolunteers(
        search: _searchCtrl.text,
        isAvailable: _availabilityFilter,
        page: _page,
        pageSize: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        _items.addAll(batch);
        _hasMore = batch.length >= _pageSize;
        _applySort();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _loading) return;
    setState(() => _loadingMore = true);
    _page++;
    try {
      final batch = await VolunteerService.getVolunteers(
        search: _searchCtrl.text,
        isAvailable: _availabilityFilter,
        page: _page,
        pageSize: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        _items.addAll(batch);
        _hasMore = batch.length >= _pageSize;
        _applySort();
      });
    } catch (e) {
      _page--;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _applySort() {
    if (_sort == 'name') {
      _items.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    } else if (_sort == 'available') {
      _items.sort((a, b) => (b.isAvailable ? 1 : 0).compareTo(a.isAvailable ? 1 : 0));
    } else if (_sort == 'rating') {
      _items.sort((a, b) => b.rating.compareTo(a.rating));
    }
  }

  void _onSearchChanged() {
    _load(reset: true);
  }

  Future<void> _handleDelete(String id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete Volunteer'),
        content: Text('Are you sure you want to delete "$name"? Shifts will also be removed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await VolunteerService.deleteVolunteer(id);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Volunteer deleted')),
        );
        _load(reset: true);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final isCoordinator = user?.canCoordinate ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text("Volunteer Directory")),
      floatingActionButton: isCoordinator
          ? FloatingActionButton(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddVolunteerScreen()),
                );
                if (result == true) _load(reset: true);
              },
              child: const Icon(Icons.person_add),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search name or skills...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          _onSearchChanged();
                        },
                      )
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onSubmitted: (_) => _onSearchChanged(),
              onChanged: (_) {
                // debounce-lite: reload only when cleared or >=3 chars
                if (_searchCtrl.text.isEmpty || _searchCtrl.text.length >= 3) {
                  _onSearchChanged();
                }
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('All'),
                  selected: _availabilityFilter == null,
                  onSelected: (_) {
                    setState(() => _availabilityFilter = null);
                    _load(reset: true);
                  },
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Available'),
                  selected: _availabilityFilter == true,
                  onSelected: (_) {
                    setState(() => _availabilityFilter = true);
                    _load(reset: true);
                  },
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Off-duty'),
                  selected: _availabilityFilter == false,
                  onSelected: (_) {
                    setState(() => _availabilityFilter = false);
                    _load(reset: true);
                  },
                ),
                const Spacer(),
                DropdownButton<String>(
                  value: _sort,
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'name', child: Text('Name')),
                    DropdownMenuItem(value: 'available', child: Text('Availability')),
                    DropdownMenuItem(value: 'rating', child: Text('Rating')),
                  ],
                  onChanged: (v) {
                    if (v != null) {
                      setState(() {
                        _sort = v;
                        _applySort();
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null && _items.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => _load(reset: true),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _items.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text("No volunteers found."),
                                if (isCoordinator)
                                  TextButton(
                                    onPressed: () async {
                                      final r = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) => const AddVolunteerScreen()),
                                      );
                                      if (r == true) _load(reset: true);
                                    },
                                    child: const Text('Add the first volunteer'),
                                  ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _load(reset: true),
                            child: NotificationListener<ScrollNotification>(
                              onNotification: (n) {
                                if (n.metrics.pixels >= n.metrics.maxScrollExtent - 200) {
                                  _loadMore();
                                }
                                return false;
                              },
                              child: ListView.builder(
                                itemCount: _items.length + (_hasMore ? 1 : 0),
                                itemBuilder: (context, index) {
                                  if (index >= _items.length) {
                                    return const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(
                                          child: SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(strokeWidth: 2))),
                                    );
                                  }
                                  final v = _items[index];
                                  return ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor:
                                          v.isAvailable ? Colors.green.shade100 : Colors.grey.shade200,
                                      child: Icon(
                                        v.isAvailable ? Icons.check : Icons.pause,
                                        color: v.isAvailable ? Colors.green : Colors.grey,
                                        size: 18,
                                      ),
                                    ),
                                    title: Text(v.name,
                                        style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text(
                                        '${v.skills} • ${v.email}\n${v.isAvailable ? "Available" : "Off-duty"} • ${v.rating}/5.0'),
                                    isThreeLine: true,
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.edit, color: Colors.blue),
                                          tooltip: isCoordinator
                                              ? 'Edit'
                                              : 'Edit my profile',
                                          onPressed: () async {
                                            final user =
                                                Provider.of<AuthProvider>(context,
                                                        listen: false)
                                                    .user;
                                            final canEdit = isCoordinator ||
                                                (user != null &&
                                                    user.email
                                                            .trim()
                                                            .toLowerCase() ==
                                                        v.email
                                                            .trim()
                                                            .toLowerCase());
                                            if (!canEdit) {
                                              ScaffoldMessenger.of(context)
                                                  .showSnackBar(
                                                const SnackBar(
                                                    content: Text(
                                                        'Volunteers can only edit their own profile.')),
                                              );
                                              return;
                                            }
                                            final ok = await Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) =>
                                                    EditVolunteerScreen(volunteer: v),
                                              ),
                                            );
                                            if (ok == true && context.mounted) {
                                              _load(reset: true);
                                              try {
                                                final vp =
                                                    // ignore: use_build_context_synchronously
                                                    Provider.of<VolunteerProvider>(
                                                        context,
                                                        listen: false);
                                                final fresh =
                                                    await VolunteerService
                                                        .getVolunteerById(v.id);
                                                await vp.refreshAfterEdit(fresh);
                                              } catch (_) {}
                                            }
                                          },
                                        ),
                                        if (isCoordinator)
                                          IconButton(
                                            icon: const Icon(Icons.delete,
                                                color: Colors.red),
                                            onPressed: () =>
                                                _handleDelete(v.id, v.name),
                                          ),
                                      ],
                                    ),
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ProfileScreen(volunteer: v),
                                        ),
                                      );
                                    },
                                  );
                                },
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
