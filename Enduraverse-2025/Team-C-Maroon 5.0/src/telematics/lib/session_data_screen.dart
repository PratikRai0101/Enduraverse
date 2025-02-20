import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:fl_chart/fl_chart.dart';

class SessionDataScreen extends StatefulWidget {
  final String userId;
  final String sessionId;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  SessionDataScreen(this.userId, this.sessionId, {super.key});

  @override
  _SessionDataScreenState createState() => _SessionDataScreenState();
}

class _SessionDataScreenState extends State<SessionDataScreen> {
  final List<LatLng> _pathCoordinates = [];
  late final MapController _mapController;
  bool _mapVisible = false;
  List<Map<String, dynamic>> sessionData = [];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
  }

  void _updatePath(List<QueryDocumentSnapshot> data) {
    List<LatLng> newPath = [];

    // Store all session data for graph plotting
    sessionData = data.map((e) => e.data() as Map<String, dynamic>).toList();

    // Only filter coordinates but keep all data for graph usage
    for (var entry in sessionData) {
      if (!entry["isprev"] &&
          entry["latitude"] != null &&
          entry["longitude"] != null) {
        newPath.add(LatLng(entry["latitude"], entry["longitude"]));
      }
    }

    if (newPath.length != _pathCoordinates.length) {
      Future.microtask(() {
        setState(() {
          _pathCoordinates.clear();
          _pathCoordinates.addAll(newPath);
          _mapVisible = true;
        });
      });
    }
  }

  Widget _buildGraphCard(String title, List<LineChartBarData> lineBarsData) {
    return Card(
      color: Colors.grey[900],
      margin: EdgeInsets.all(10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(color: Colors.white, fontSize: 16)),
            SizedBox(height: 8),
            SizedBox(
              height: 150,
              child: LineChart(
                LineChartData(
                  lineBarsData: lineBarsData,
                  titlesData: FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(show: false),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  LineChartBarData _buildAreaChartData(List<FlSpot> spots, Color color) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      gradient: LinearGradient(
        colors: [color, color.withOpacity(0.5)],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ),
      barWidth: 2,
      isStrokeCapRound: true,
      belowBarData: BarAreaData(
        show: true,
        gradient: LinearGradient(
          colors: [color.withOpacity(0.3), Colors.transparent],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      dotData: FlDotData(show: false),
    );
  }

  List<FlSpot> _generateSpots(String key) {
    if (sessionData.isEmpty) return [];
    return List.generate(sessionData.length, (index) {
      var value = sessionData[index][key];
      return FlSpot(index.toDouble(), value?.toDouble() ?? 0);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Session Data")),
      body: SingleChildScrollView(
        child: Column(
          children: [
            if (sessionData.isNotEmpty) ...[
              _buildGraphCard("Acceleration", [
                _buildAreaChartData(_generateSpots("accel_x"), Colors.blue),
                _buildAreaChartData(_generateSpots("accel_y"), Colors.green),
                _buildAreaChartData(_generateSpots("accel_z"), Colors.red),
              ]),
              _buildGraphCard("Gyroscope", [
                _buildAreaChartData(_generateSpots("gyro_x"), Colors.blue),
                _buildAreaChartData(_generateSpots("gyro_y"), Colors.green),
                _buildAreaChartData(_generateSpots("gyro_z"), Colors.red),
              ]),
              _buildGraphCard("Velocity", [
                _buildAreaChartData(
                  _generateSpots("velocity_x"),
                  Colors.yellow,
                ),
              ]),
              _buildGraphCard("MPU Temp", [
                _buildAreaChartData(_generateSpots("mpu_temp"), Colors.orange),
              ]),
            ],
            if (_mapVisible)
              SizedBox(
                height: 300,
                child: FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter:
                        _pathCoordinates.isNotEmpty
                            ? _pathCoordinates.first
                            : LatLng(0.0, 0.0),
                    initialZoom: 18,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                    ),
                    if (_pathCoordinates.isNotEmpty)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: _pathCoordinates,
                            strokeWidth: 8.0,
                            color: Colors.blue,
                          ),
                        ],
                      ),
                  ],
                ),
              )
            else
              Container(
                height: 30,
                alignment: Alignment.center,
                child: Text(
                  "No Map Data Available",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            StreamBuilder<QuerySnapshot>(
              stream:
                  widget._firestore
                      .collection("users")
                      .doc(widget.userId)
                      .collection("sessions")
                      .doc(widget.sessionId)
                      .collection("session_data")
                      .orderBy("timestamp", descending: true)
                      .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                }

                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return Center(child: Text("No session data found!"));
                }

                var sessionDocs = snapshot.data!.docs;
                _updatePath(sessionDocs);

                return ListView.builder(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  itemCount: sessionDocs.length,
                  itemBuilder: (context, index) {
                    var data = sessionDocs[index];
                    return Card(
                      elevation: 3,
                      margin: EdgeInsets.symmetric(vertical: 8),
                      child: ListTile(
                        title: Text(
                          "Session Data Record",
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Acceleration Mag: ${data["accel_mag"]}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "Gyro Mag: ${data["gyro_mag"]}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "Jerk Z: ${data["jerk_z"]}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "MPU Temp: ${data["mpu_temp"]}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "Pitch: ${data["pitch"]}, Roll: ${data["roll"]}, Yaw: ${data["yaw"]}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "Velocity X: ${data["velocity_x"]}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "Speed Breaker: ${data["speed_breaker"] ? "Yes" : "No"}",
                              style: TextStyle(color: Colors.black),
                            ),
                            Text(
                              "Accident: ${data["accident"] ? "Yes" : "No"}",
                              style: TextStyle(color: Colors.black),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
