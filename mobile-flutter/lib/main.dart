import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/select_profile_screen.dart';
import 'screens/shelter_locator_screen.dart';
import 'screens/resource_status_screen.dart';
import 'screens/inventory_overview_screen.dart';
import 'screens/situation_analysis_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.init();

  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider()..init(),
      child: const ERCPApp(),
    ),
  );
}

class ERCPApp extends StatelessWidget {
  const ERCPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ERCP Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (auth.isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                "Initializing ERCP Platform...",
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    if (auth.isAuthenticated) {
      return const HomeScreen();
    }

    return const LoginScreen();
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text("ERCP Mobile Platform"),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: "My Profile",
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: "Sign Out",
            onPressed: () async {
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
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Banner
                if (user != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: Colors.blue.shade700,
                          foregroundColor: Colors.white,
                          child: Text(user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : "U"),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.fullName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              Text(
                                user.email,
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.blue.shade300),
                          ),
                          child: Text(
                            user.role.toUpperCase(),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // Section 1: Responder & Profile Operations
                const Text(
                  "RESPONDER & IDENTITY",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  icon: const Icon(Icons.account_circle),
                  label: const Text("My Profile & Duty Status"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade800,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ProfileScreen()),
                  ),
                ),
                const SizedBox(height: 10),
                if (user?.canCoordinate == true) ...[
                  OutlinedButton.icon(
                    icon: const Icon(Icons.people_outline),
                    label: const Text("Volunteer Directory (Team Roster)"),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(44),
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SelectProfileScreen()),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                OutlinedButton.icon(
                  icon: const Icon(Icons.person_add_alt_1),
                  label: const Text("Register Another Account"),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen()),
                  ),
                ),
                const Divider(height: 32),

                // Section 2: Resource & Logistics Operations
                const Text(
                  "RESOURCES & DISASTER LOGISTICS",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  icon: const Icon(Icons.night_shelter),
                  label: const Text("Find Evacuation Shelters"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ShelterLocatorScreen()),
                  ),
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  icon: const Icon(Icons.airport_shuttle),
                  label: const Text("Resource Fleet Status"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ResourceStatusScreen()),
                  ),
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  icon: const Icon(Icons.inventory_2),
                  label: const Text("Inventory & Medical Supplies"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const InventoryOverviewScreen()),
                  ),
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  icon: const Icon(Icons.psychology),
                  label: const Text("Situation Analysis AI Agent"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SituationAnalysisScreen()),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}