import 'package:flutter/material.dart';
import 'screens/register_screen.dart';
import 'screens/select_profile_screen.dart';
import 'screens/shelter_locator_screen.dart';
import 'screens/resource_status_screen.dart';
import 'screens/inventory_overview_screen.dart';
import 'screens/situation_analysis_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.init();
  runApp(const ERCPApp());
}

class ERCPApp extends StatelessWidget {
  const ERCPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ERCP',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("ERCP Mobile Platform")),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Existing Student 4 Buttons
              ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                ),
                child: const Text("Register as Volunteer"),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SelectProfileScreen()),
                ),
                child: const Text("My Profile (temporary)"),
              ),
              const Divider(height: 32),

              // Student 2 Component Buttons
              ElevatedButton.icon(
                icon: const Icon(Icons.night_shelter),
                label: const Text("Find Evacuation Shelters"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size(220, 44)),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ShelterLocatorScreen()),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                icon: const Icon(Icons.airport_shuttle),
                label: const Text("Resource Fleet Status"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent, foregroundColor: Colors.white, minimumSize: const Size(220, 44)),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ResourceStatusScreen()),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                icon: const Icon(Icons.inventory_2),
                label: const Text("Inventory & Medical Supplies"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white, minimumSize: const Size(220, 44)),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const InventoryOverviewScreen()),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                icon: const Icon(Icons.psychology),
                label: const Text("Situation Analysis AI Agent"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple, foregroundColor: Colors.white, minimumSize: const Size(220, 44)),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SituationAnalysisScreen()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}