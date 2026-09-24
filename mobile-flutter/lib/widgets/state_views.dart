import 'package:flutter/material.dart';

/// Reusable loading / error / empty states (Member 4 + shared).
class LoadingView extends StatelessWidget {
  final String message;
  const LoadingView({super.key, this.message = 'Loading...'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const ErrorView({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 40, color: Colors.red),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  const EmptyView({super.key, required this.message, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.inbox_outlined, size: 40, color: Colors.grey),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(color: Colors.grey)),
          if (actionLabel != null) ...[
            const SizedBox(height: 8),
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

class VolunteerCard extends StatelessWidget {
  final String name;
  final String subtitle;
  final bool isAvailable;
  final double rating;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;
  const VolunteerCard({
    super.key,
    required this.name,
    required this.subtitle,
    required this.isAvailable,
    required this.rating,
    this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isAvailable ? Colors.green.shade100 : Colors.grey.shade200,
          child: Icon(isAvailable ? Icons.check : Icons.pause,
              color: isAvailable ? Colors.green : Colors.grey, size: 18),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('$subtitle\n${isAvailable ? "Available" : "Off-duty"} • $rating/5.0'),
        isThreeLine: true,
        trailing: onDelete != null
            ? IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: onDelete)
            : null,
        onTap: onTap,
      ),
    );
  }
}
