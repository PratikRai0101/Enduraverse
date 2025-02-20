import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'auth_service.dart';
import 'auth_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'session_data_screen.dart';
import 'bluetooth_scan_modal.dart';
import 'package:lottie/lottie.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AuthService _authService = AuthService();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  void initState() {
    super.initState();
    _requestBluetoothPermissions();
  }

  Future<void> _requestBluetoothPermissions() async {
    Map<Permission, PermissionStatus> statuses =
        await [
          Permission.bluetooth,
          Permission.bluetoothScan,
          Permission.bluetoothConnect,
          Permission.bluetoothAdvertise,
          Permission.locationWhenInUse,
        ].request();
  }

  Future<void> _openBluetoothModal() async {
    await _requestBluetoothPermissions();
    showScanModal(context);
  }

  Future<void> _manageFamilyDialog() async {
    TextEditingController emailController = TextEditingController();
    User? user = _auth.currentUser;
    if (user == null) return;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Manage Family Members"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              StreamBuilder<QuerySnapshot>(
                stream:
                    _firestore
                        .collection("users")
                        .doc(user.uid)
                        .collection("family")
                        .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Center(child: CircularProgressIndicator());
                  }
                  if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                    return Text("No family members added.");
                  }

                  var familyDocs = snapshot.data!.docs;
                  return Column(
                    children:
                        familyDocs.map((doc) {
                          return ListTile(
                            title: Text(doc["email"]),
                            trailing: IconButton(
                              icon: Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteFamilyMember(doc.id),
                            ),
                          );
                        }).toList(),
                  );
                },
              ),
              SizedBox(height: 10),
              TextField(
                controller: emailController,
                decoration: InputDecoration(
                  hintText: "Enter email",
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("Cancel"),
            ),
            TextButton(
              onPressed: () {
                _addFamilyMember(emailController.text.trim());
                Navigator.pop(context);
              },
              child: Text("Add"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _addFamilyMember(String email) async {
    if (email.isEmpty) return;
    User? user = _auth.currentUser;
    if (user == null) return;

    await _firestore.collection("users").doc(user.uid).collection("family").add(
      {"email": email},
    );
  }

  Future<void> _deleteFamilyMember(String docId) async {
    User? user = _auth.currentUser;
    if (user == null) return;

    await _firestore
        .collection("users")
        .doc(user.uid)
        .collection("family")
        .doc(docId)
        .delete();
  }

  @override
  Widget build(BuildContext context) {
    User? user = _auth.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.dashboard, size: 26),
            SizedBox(width: 8),
            Text("Dashboard", style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () async {
              await _authService.signOut();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => AuthScreen()),
              );
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Welcome, ${user?.email ?? 'User'} 👋",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
            ),
            SizedBox(height: 20),

            // Buttons Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: _openBluetoothModal,
                  icon: Icon(Icons.bluetooth, size: 22),
                  label: Text("Connect"),
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _manageFamilyDialog,
                  icon: Icon(Icons.family_restroom, size: 22),
                  label: Text("Manage Family"),
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),

            SizedBox(height: 20),

            // User Sessions
            Text(
              "Your Sessions",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),

            Expanded(
              child:
                  user == null
                      ? Center(child: Text("User not logged in"))
                      : StreamBuilder<QuerySnapshot>(
                        stream:
                            _firestore
                                .collection("users")
                                .doc(user.uid)
                                .collection("sessions")
                                .orderBy("created_at", descending: true)
                                .snapshots(),
                        builder: (context, snapshot) {
                          if (snapshot.connectionState ==
                              ConnectionState.waiting) {
                            return Center(child: CircularProgressIndicator());
                          }

                          if (!snapshot.hasData ||
                              snapshot.data!.docs.isEmpty) {
                            return Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Lottie.asset(
                                  'assets/no_data.json', // Lottie animation for no sessions
                                  height: 180,
                                  fit: BoxFit.cover,
                                ),
                                SizedBox(height: 10),
                                Text("No sessions found!"),
                              ],
                            );
                          }

                          var sessions = snapshot.data!.docs;

                          return ListView.builder(
                            itemCount: sessions.length,
                            itemBuilder: (context, index) {
                              var session = sessions[index];
                              return Card(
                                margin: EdgeInsets.symmetric(vertical: 8),
                                elevation: 3,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.blue.shade100,
                                    child: Icon(
                                      Icons.history,
                                      color: Colors.blue,
                                    ),
                                  ),
                                  title: Text("Session ${index + 1}"),
                                  subtitle: Text(
                                    session["created_at"] != null
                                        ? session["created_at"]
                                            .toDate()
                                            .toString()
                                        : "No timestamp",
                                  ),
                                  trailing: Icon(
                                    Icons.arrow_forward_ios,
                                    size: 16,
                                  ),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder:
                                            (context) => SessionDataScreen(
                                              user.uid,
                                              session.id,
                                            ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          );
                        },
                      ),
            ),
          ],
        ),
      ),
    );
  }
}
