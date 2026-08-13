import 'package:flutter/material.dart';
import 'screens/register_screen.dart';

void main() {
  runApp(const ERCPApp());
}

class ERCPApp extends StatelessWidget {
  const ERCPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ERCP',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const RegisterScreen(),
    );
  }
}