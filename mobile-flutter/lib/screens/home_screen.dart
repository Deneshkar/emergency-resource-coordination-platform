import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';

// Services
import '../services/incident_service.dart';
import '../services/dispatch_service.dart';
import '../services/volunteer_service.dart';
import '../services/resource_service.dart';

// Models
import '../models/incident.dart';
import '../models/dispatch.dart';
import '../models/volunteer.dart';
import '../models/resource.dart';
import '../models/shelter.dart';
import '../models/inventory_item.dart';

// Screens
import 'situation_analysis_screen.dart';
import 'shelter_locator_screen.dart';
import 'resource_status_screen.dart';
import 'inventory_overview_screen.dart';
import 'profile_screen.dart';
import 'select_profile_screen.dart';
import 'register_screen.dart';
import 'report_incident_screen.dart';
import 'incident_list_screen.dart';
import 'dispatch_list_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      const _HomeTabWrapper(),
      const ShelterLocatorScreen(),
      const _ResourcesTab(),
      const _SettingsTab(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SituationAnalysisScreen()),
          );
        },
        icon: const Icon(Icons.psychology),
        label: const Text("AI Agent"),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.night_shelter_outlined),
            selectedIcon: Icon(Icons.night_shelter),
            label: 'Shelters',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Resources',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

class _HomeTabWrapper extends StatelessWidget {
  const _HomeTabWrapper();

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (user.role.toLowerCase() == 'citizen') {
      return _CitizenDashboard(user: user);
    } else {
      return _CoordinatorDashboard(user: user);
    }
  }
}

// ==========================================
// CITIZEN DASHBOARD
// ==========================================
class _CitizenDashboard extends StatelessWidget {
  final dynamic user;
  const _CitizenDashboard({required this.user});

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Citizen Emergency Hub', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.teal.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.teal.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.teal.shade700, borderRadius: BorderRadius.circular(4)),
                    child: const Text("🛡️ Public Safety & Citizen Portal", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 12),
                  Text("Welcome, ${user.fullName}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text("Access rapid incident reporting, live response tracking, and verified regional emergency advisories.", style: TextStyle(color: Colors.black87)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Hotlines
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _HotlineButton(icon: "🚨", label: "Police: 119", color: Colors.red, onTap: () => _makePhoneCall("119")),
                  const SizedBox(width: 8),
                  _HotlineButton(icon: "🚑", label: "Ambulance: 1990", color: Colors.green, onTap: () => _makePhoneCall("1990")),
                  const SizedBox(width: 8),
                  _HotlineButton(icon: "🌊", label: "DMC: 117", color: Colors.blue, onTap: () => _makePhoneCall("117")),
                  const SizedBox(width: 8),
                  _HotlineButton(icon: "👤", label: "My Profile", color: Colors.purple, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()))),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action Cards
            _buildActionCard(
              context,
              title: "Report Emergency",
              desc: "Encountering flash floods, landslides, fallen trees, or trapped citizens? Submit a rapid report directly to command.",
              icon: "🚨",
              color: Colors.red,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportIncidentScreen())),
              btnLabel: "+ Report Incident Now",
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              title: "My Incident Reports",
              desc: "Track the real-time status of your submissions, AI triage classifications, and responding unit dispatch progress.",
              icon: "📋",
              color: Colors.blue,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const IncidentListScreen())),
              btnLabel: "View My Reports Status",
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              title: "Emergency Shelters",
              desc: "Locate safe evacuation shelters in your district, verified capacity, facilities, and current occupancy levels.",
              icon: "🏠",
              color: Colors.green,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ShelterLocatorScreen())),
              btnLabel: "Find Safe Shelters",
            ),
            const SizedBox(height: 24),

            const Text("⚠️ Severe Weather & Emergency Safety Guidelines", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildSafetyGuide("🌊 Flash Flood Precautions", "Never drive or walk through moving water. 6 inches of fast-moving water can knock you down, and 12 inches can float a vehicle.", Colors.blue),
            const SizedBox(height: 8),
            _buildSafetyGuide("⚡ Downed Electrical Lines", "Assume all downed wires are energized. Maintain a minimum perimeter distance of 30 feet and report immediately.", Colors.amber.shade900),
            const SizedBox(height: 8),
            _buildSafetyGuide("🎒 Emergency Go-Bag", "Prepare drinking water, non-perishable food, essential prescription medications, phone chargers, and national identity documents.", Colors.purple),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, {required String title, required String desc, required String icon, required MaterialColor color, required VoidCallback onTap, required String btnLabel}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(15),
        border: Border.all(color: color.withAlpha(100)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 32)),
          const SizedBox(height: 8),
          Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color.shade800)),
          const SizedBox(height: 8),
          Text(desc, style: const TextStyle(fontSize: 13, height: 1.4)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onTap,
            style: ElevatedButton.styleFrom(backgroundColor: color, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(40)),
            child: Text(btnLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyGuide(String title, String desc, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(desc, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
        ],
      ),
    );
  }
}

class _HotlineButton extends StatelessWidget {
  final String icon;
  final String label;
  final MaterialColor color;
  final VoidCallback onTap;

  const _HotlineButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: color),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(icon),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: color.shade700)),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// COORDINATOR DASHBOARD
// ==========================================
class _CoordinatorDashboard extends StatefulWidget {
  final dynamic user;
  const _CoordinatorDashboard({required this.user});

  @override
  State<_CoordinatorDashboard> createState() => _CoordinatorDashboardState();
}

class _CoordinatorDashboardState extends State<_CoordinatorDashboard> {
  bool _isLoading = true;
  List<Incident> _incidents = [];
  List<Dispatch> _dispatches = [];
  List<Volunteer> _volunteers = [];
  List<ResourceModel> _resources = [];
  List<ShelterModel> _shelters = [];
  List<InventoryItemModel> _inventory = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        IncidentService.getIncidents().catchError((_) => <Incident>[]),
        DispatchService.getDispatches().catchError((_) => <Dispatch>[]),
        VolunteerService.getVolunteers().catchError((_) => <Volunteer>[]),
        ResourceService.fetchResources().catchError((_) => <ResourceModel>[]),
        ResourceService.fetchShelters().catchError((_) => <ShelterModel>[]),
        ResourceService.fetchInventory().catchError((_) => <InventoryItemModel>[]),
      ]);

      if (mounted) {
        setState(() {
          _incidents = results[0] as List<Incident>;
          _dispatches = results[1] as List<Dispatch>;
          _volunteers = results[2] as List<Volunteer>;
          _resources = results[3] as List<ResourceModel>;
          _shelters = results[4] as List<ShelterModel>;
          _inventory = results[5] as List<InventoryItemModel>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Coordinator Dashboard')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final activeIncidents = _incidents.where((i) => i.status != 'Resolved' && i.status != 'Closed').toList();
    final criticalIncidents = _incidents.where((i) => i.priority == 'Critical').toList();
    final availableVolunteers = _volunteers.where((v) => v.isAvailable).toList();
    final availableResources = _resources.where((r) => r.status == 'Available').toList();
    final lowStockItems = _inventory.where((i) => i.status == 'LowStock' || i.status == 'OutOfStock').toList();
    
    int totalCapacity = 0;
    int totalOccupancy = 0;
    for (var s in _shelters) {
      totalCapacity += s.totalCapacity;
      totalOccupancy += s.currentOccupancy;
    }
    final shelterPct = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).round() : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Coordinator Dashboard'),
        backgroundColor: Colors.blue.shade900,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
          IconButton(
            icon: const Icon(Icons.account_circle),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 80),
          children: [
            // Stat Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _StatCard(
                  icon: "⚠️",
                  label: "Active Incidents",
                  value: "${activeIncidents.length}",
                  sub: "${criticalIncidents.length} critical",
                  color: criticalIncidents.isNotEmpty ? Colors.red : Colors.orange,
                ),
                _StatCard(
                  icon: "🚛",
                  label: "Dispatches",
                  value: "${_dispatches.length}",
                  sub: "active tasks",
                  color: Colors.blue,
                ),
                _StatCard(
                  icon: "👤",
                  label: "Volunteers",
                  value: "${_volunteers.length}",
                  sub: "${availableVolunteers.length} available",
                  color: Colors.green,
                ),
                _StatCard(
                  icon: "📦",
                  label: "Resources",
                  value: "${_resources.length}",
                  sub: "${availableResources.length} ready",
                  color: Colors.cyan,
                ),
                _StatCard(
                  icon: "🏠",
                  label: "Shelter Cap",
                  value: "$shelterPct%",
                  sub: "$totalOccupancy / $totalCapacity",
                  color: shelterPct > 80 ? Colors.red : Colors.green,
                ),
                _StatCard(
                  icon: "📋",
                  label: "Low Stock",
                  value: "${lowStockItems.length}",
                  sub: "items need restock",
                  color: lowStockItems.isNotEmpty ? Colors.orange : Colors.green,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Quick Actions
            const Text("QUICK ACTIONS", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.add_alert, size: 16),
                  label: const Text("New Incident"),
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportIncidentScreen())),
                ),
                ActionChip(
                  avatar: const Icon(Icons.person_add, size: 16),
                  label: const Text("Add Volunteer"),
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SelectProfileScreen())),
                ),
                ActionChip(
                  avatar: const Icon(Icons.person_add_alt_1, size: 16),
                  label: const Text("Register User"),
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final String sub;
  final MaterialColor color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.sub, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color.shade700)),
            ],
          ),
          const Spacer(),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(sub, style: TextStyle(fontSize: 10, color: Colors.grey.shade700), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

// ==========================================
// EXISTING TABS
// ==========================================

class _ResourcesTab extends StatelessWidget {
  const _ResourcesTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resources & Logistics'),
      ),
      body: ListView(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 80),
        children: [
          _buildResourceCard(
            context,
            title: "Resource Fleet Status",
            subtitle: "View available vehicles and equipment",
            icon: Icons.airport_shuttle,
            color: Colors.blueAccent,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResourceStatusScreen())),
          ),
          const SizedBox(height: 16),
          _buildResourceCard(
            context,
            title: "Inventory & Medical Supplies",
            subtitle: "Check stock levels across all hubs",
            icon: Icons.inventory_2,
            color: Colors.indigo,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryOverviewScreen())),
          ),
          const SizedBox(height: 16),
          _buildResourceCard(
            context,
            title: "Active Dispatches",
            subtitle: "View and manage current dispatch operations",
            icon: Icons.local_shipping,
            color: Colors.deepOrange,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DispatchListScreen())),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceCard(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap}) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(26),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsTab extends StatelessWidget {
  const _SettingsTab();

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);
    final auth = Provider.of<AuthProvider>(context, listen: false);

    final List<Map<String, String>> displayModes = [
      {'name': 'Dark (Default)', 'value': 'dark', 'icon': '🌙'},
      {'name': 'Light Mode', 'value': 'light', 'icon': '☀️'},
      {'name': 'Midnight', 'value': 'midnight', 'icon': '🌌'},
      {'name': 'Hacker', 'value': 'hacker', 'icon': '💻'},
      {'name': 'Sunset', 'value': 'sunset', 'icon': '🌅'},
      {'name': 'Ocean', 'value': 'ocean', 'icon': '🌊'},
      {'name': 'OLED Black', 'value': 'oled', 'icon': '⬛'},
      {'name': 'Purple Royal', 'value': 'purple', 'icon': '🔮'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              "PREFERENCES",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          SwitchListTile(
            title: const Text("System Notifications"),
            subtitle: const Text("Receive critical alerts and AI updates"),
            secondary: const Icon(Icons.notifications_active),
            value: settings.notificationsEnabled,
            onChanged: (val) {
              settings.setNotificationsEnabled(val);
              if (val) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("System notifications enabled")),
                );
              }
            },
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              "DISPLAY MODES",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Wrap(
              spacing: 8.0,
              runSpacing: 8.0,
              children: displayModes.map((mode) {
                final isSelected = settings.themeMode == mode['value'];
                return ChoiceChip(
                  label: Text('${mode['icon']} ${mode['name']}'),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) settings.setThemeMode(mode['value']!);
                  },
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 32),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text("Sign Out", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text("Sign Out"),
                  content: const Text("Do you wish to log out of ERCP operations?"),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text("Sign Out"),
                    ),
                  ],
                ),
              );
              if (confirm == true) {
                await auth.logout();
              }
            },
          ),
        ],
      ),
    );
  }
}
