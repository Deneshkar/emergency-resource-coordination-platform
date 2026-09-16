# Architecture Decision Record (ADR)
## ADR 03: State Management in Flutter — Provider (ChangeNotifier) vs setState

- **Status**: Approved
- **Deciders**: Team / Student 4 (Volunteer/Responder Management + Validation/Safety Agent)
- **Date**: 2026-09-16

### Context & Problem Statement
The ERCP Flutter app (`mobile-flutter/`, package `ercp_app`) serves volunteers, citizens and
coordinators from one codebase: login/register, persisted JWT session, role-gated home
(`lib/main.dart` `AuthGate`/`HomeScreen`), profile + duty-status toggle
(`lib/screens/profile_screen.dart`), shifts (`lib/screens/shifts_screen.dart`), shelter/resource/
inventory screens. Auth state is needed in many places at once (gate, app bar, user banner,
role-gated buttons, logout) and must survive app restarts via `shared_preferences`.

### Decision Drivers
1. **Shared auth state**: `isLoading / isAuthenticated / user / token` read by `AuthGate`,
   `HomeScreen`, `ProfileScreen`, `RegisterScreen` without prop-drilling.
2. **Session persistence**: token + user cached in `AuthService` (`shared_preferences`);
   provider rehydrates on launch via `AuthProvider.init()`.
3. **Testability**: widget tests must inject a fake auth state (`ChangeNotifierProvider.value`
   / mock `AuthProvider`) — see `test/widget_test.dart`.
4. **Team skill + scope**: 4-student assignment; must avoid heavy boilerplate (Bloc/Riverpod codegen)
   while staying lint-clean (`flutter analyze` in CI).

### Considered Options
- **Option 1: `setState` only** — local widget state, pass user/token down constructors.
- **Option 2: `Provider` + `ChangeNotifier` (`AuthProvider`)** — single source of truth, `notifyListeners()`.
- **Option 3: `flutter_bloc` / Riverpod** — event/state streams, strongest separation, most boilerplate.

### Decision Outcome
Chosen Option: **Option 2 — Provider + ChangeNotifier**.

#### Justification:
- `lib/providers/auth_provider.dart` centralises `login / register / init / refreshProfile / logout`
  with `_isLoading/_user/_token/_errorMessage` and `notifyListeners()`; `main.dart` wraps the app
  once in `ChangeNotifierProvider(create: (_) => AuthProvider()..init())`.
- `AuthGate` rebuilds automatically on `isLoading → isAuthenticated` transitions; `HomeScreen`
  reads `user.canCoordinate` to gate the Volunteer Directory without threading props.
- Local ephemeral UI state (form controllers, `_obscurePassword`, `_updating`, availability switch)
  intentionally stays as `setState` inside `RegisterScreen`/`ProfileScreen` — Provider is for
  **shared** state, `setState` for **local** state. This hybrid is documented and lint-clean.
- `provider: ^6.1.5+1` is already in `pubspec.yaml`; no codegen, minimal learning curve,
  and widget tests can pump `ERCPApp` under a provided `AuthProvider` with mocked prefs.

### Consequences
- Good: no prop-drilling; one auth mutation path; CI `flutter analyze` + `flutter test` pass.
- Good: role-based UI (`Volunteer` vs `Coordinator/Admin` vs `Citizen`) stays consistent.
- Trade-off: `ChangeNotifier` is not event-sourced; if the app grows to offline-sync queues or
  complex dispatch workflows, migrate that slice to Bloc while keeping `AuthProvider` as-is.
- Mitigation: keep providers granular (one per domain: auth now; shifts/dispatch later) so a
  future Bloc migration is isolated.
