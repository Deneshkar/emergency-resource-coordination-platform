import 'package:flutter/material.dart';
import 'screens/register_screen.dart';
import 'screens/select_profile_screen.dart';
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
      appBar: AppBar(title: const Text("ERCP")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const RegisterScreen()),
              ),
              child: const Text("Register as Volunteer"),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SelectProfileScreen()),
              ),
              child: const Text("My Profile (temporary)"),
            ),
          ],
        ),
      ),
    );
  }
}