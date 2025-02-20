import 'dart:async';
import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:telematics/sensor_graph.dart';

import 'email_service.dart';


class BluetoothDevicePage extends StatefulWidget {
  final BluetoothDevice device;

  const BluetoothDevicePage({super.key, required this.device});

  @override
  _BluetoothDevicePageState createState() => _BluetoothDevicePageState();
}

class _BluetoothDevicePageState extends State<BluetoothDevicePage> {
  BluetoothCharacteristic? txCharacteristic;
  BluetoothCharacteristic? rxCharacteristic;
  bool isConnected = false;
  bool _sessionsCreated = false;
  bool _isDisposed = false;
  final EmailService _emailService = EmailService(); // Email Service Instance


  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? _trueSessionId;  // `isprev: true`
  String? _falseSessionId; // `isprev: false`
  Map<String, dynamic> lastReceivedData = {};

  // Graph Data
  List<FlSpot> accelX = [], accelY = [], accelZ = [];
  List<FlSpot> gyroX = [], gyroY = [], gyroZ = [];
  List<FlSpot> mputemp=[];
  int dataIndex = 0;
  double minY = 0, maxY = 0;
  final int maxDataPoints = 30;

  double currentAccelX = 0.0, currentAccelY = 0.0, currentAccelZ = 0.0;
  double currentGyroX = 0.0, currentGyroY = 0.0, currentGyroZ = 0.0;
  double curr=0.0;
  final String serviceUuid = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
  final String txCharacteristicUuid = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
  final String rxCharacteristicUuid = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
  StreamSubscription<List<int>>? _bluetoothSubscription;
  @override
  void initState() {
    super.initState();
    _initializeGeolocator();
    _connectToDevice();
  }

  @override
  void dispose() {
    _isDisposed = true; // ✅ Mark widget as disposed
    _disconnectFromDevice();
    super.dispose();
  }

  /// ✅ **Initialize Location Permissions**
  Future<void> _initializeGeolocator() async {
    await Geolocator.checkPermission();
    await Geolocator.requestPermission();
  }

  /// ✅ **Connect to BLE Device**
  Future<void> _connectToDevice() async {
    try {
      await widget.device.connect();
      if (!mounted) return;
      setState(() => isConnected = true);
      debugPrint("✅ Connected to ${widget.device.name}");

      if (!_sessionsCreated) {
        await _createSessions();
      }

      _discoverServices();
    } catch (e) {
      debugPrint("❌ Failed to connect: $e");
    }
  }

  /// 🔴 **Disconnect from BLE Device**
  Future<void> _disconnectFromDevice() async {
    try {
      await widget.device.disconnect();
      if (!mounted) return;
      setState(() => isConnected = false);
      debugPrint("🔴 Disconnected from ${widget.device.name}");

      // Store last received data before disconnecting
      if (lastReceivedData.isNotEmpty) {
        debugPrint("📥 Storing last received data on disconnect: $lastReceivedData");
        await _storeData(lastReceivedData);
      }
    } catch (e) {
      debugPrint("❌ Error disconnecting: $e");
    }
  }

  /// 🔍 **Discover BLE Services**
  Future<void> _discoverServices() async {
    List<BluetoothService> services = await widget.device.discoverServices();
    for (var service in services) {
      if (service.uuid.toString().toUpperCase() == serviceUuid) {
        for (var characteristic in service.characteristics) {
          if (characteristic.uuid.toString().toUpperCase() == txCharacteristicUuid) {
            txCharacteristic = characteristic;
            await _enableNotifications();
          } else if (characteristic.uuid.toString().toUpperCase() == rxCharacteristicUuid) {
            rxCharacteristic = characteristic;
          }
        }
      }
    }
  }

  /// 📡 **Enable Notifications for Data Reception**
  Future<void> _enableNotifications() async {
    if (txCharacteristic == null) return;
    await txCharacteristic!.setNotifyValue(true);

    _bluetoothSubscription = txCharacteristic!.onValueReceived.listen((value) {
      if (!mounted || _isDisposed) return; // ✅ Prevent updates if widget is disposed

      String receivedString = String.fromCharCodes(value);
      debugPrint("🔔 Data Received: $receivedString");

      try {
        Map<String, dynamic> parsedData = jsonDecode(receivedString);
        lastReceivedData = parsedData;

        if (mounted) {
          setState(() {
            currentAccelX = parsedData["accel_x"] ?? 0.0;
            currentAccelY = parsedData["accel_y"] ?? 0.0;
            currentAccelZ = parsedData["accel_z"] ?? 0.0;
            currentGyroX = parsedData["gyro_x"] ?? 0.0;
            currentGyroY = parsedData["gyro_y"] ?? 0.0;
            currentGyroZ = parsedData["gyro_z"] ?? 0.0;
            curr=parsedData["mpu_temp"]??0.0;
            _storeData(parsedData);
            _updateGraph(parsedData);
          });
        }
      } catch (e) {
        debugPrint("❌ JSON Parsing Error: $e");
      }
    });
  }

  /// ✅ **Create Two Firestore Sessions (`isprev: true`, `isprev: false`)**
  Future<void> _createSessions() async {
    User? user = _auth.currentUser;
    if (user == null) return;

    _falseSessionId = await _createNewSession(user.uid, false);
    _trueSessionId = await _createNewSession(user.uid, true);

    setState(() => _sessionsCreated = true);
  }

  /// ✅ **Create a Firestore Session**
  Future<String> _createNewSession(String userId, bool isPrev) async {
    DocumentReference sessionRef = await _firestore
        .collection("users")
        .doc(userId)
        .collection("sessions")
        .add({
      "created_at": FieldValue.serverTimestamp(),
      "isprev_session": isPrev,
    });

    return sessionRef.id;
  }


  /// ✅ **Store Data in Firestore**
  Future<void> _storeData(Map<String, dynamic> data) async {
    if (!_sessionsCreated) return;
    User? user = _auth.currentUser;
    if (user == null) return;

    bool isPrev = data["isprev"] ?? false;
    String sessionId = isPrev ? _trueSessionId! : _falseSessionId!;

    // Add location only for `isprev: false`
    if (!isPrev) {
      Position? position = await _getCurrentLocation();
      data["latitude"] = position?.latitude ?? 0.0;
      data["longitude"] = position?.longitude ?? 0.0;
      bool accidentOccurred = data["accident"] ?? false;
      if (accidentOccurred && position != null) {
        await _emailService.sendAccidentAlert(position.latitude, position.longitude);
      }
    }

    await _firestore.collection("users")
        .doc(user.uid)
        .collection("sessions")
        .doc(sessionId)
        .collection("session_data")
        .add({
      "timestamp": FieldValue.serverTimestamp(),
      "accel_x": data["accel_x"] ?? 0.0,
      "accel_y": data["accel_y"] ?? 0.0,
      "accel_z": data["accel_z"] ?? 0.0,
      "accel_mag": data["accel_mag"] ?? 0.0,
      "gyro_x": data["gyro_x"] ?? 0.0,
      "gyro_y": data["gyro_y"] ?? 0.0,
      "gyro_z": data["gyro_z"] ?? 0.0,
      "gyro_mag": data["gyro_mag"] ?? 0.0,
      "pitch": data["pitch"] ?? 0.0,
      "roll": data["roll"] ?? 0.0,
      "yaw": data["yaw"] ?? 0.0,
      "jerk_z": data["jerk_z"] ?? 0.0,
      "speed_breaker": data["speed_breaker"] ?? false,
      "accident": data["accident"] ?? false,
      "velocity_x": data["velocity_x"] ?? 0.0,
      "mpu_temp": data["mpu_temp"] ?? 0.0,
      "isprev":data["isprev"]??false,
      "latitude":data["latitude"],
      "longitude":data["longitude"]
    });

    debugPrint("📌 Data stored in Firestore (session: $sessionId)");
  }
  void _updateGraph(Map<String, dynamic> data) {
      double newAccelX = data["accel_x"] ?? 0;
      double newAccelY = data["accel_y"] ?? 0;
      double newAccelZ = data["accel_z"] ?? 0;
      double newGyroX = data["gyro_x"] ?? 0;
      double newGyroY = data["gyro_y"] ?? 0;
      double newGyroZ = data["gyro_z"] ?? 0;
      double mputem=data["mpu_temp"]??0.0;

      const int maxDataPoints = 30; // 5 updates/sec * 30 sec

      // Add new data points
      accelX.add(FlSpot(dataIndex.toDouble(), newAccelX));
      accelY.add(FlSpot(dataIndex.toDouble(), newAccelY));
      accelZ.add(FlSpot(dataIndex.toDouble(), newAccelZ));
      gyroX.add(FlSpot(dataIndex.toDouble(), newGyroX));
      gyroY.add(FlSpot(dataIndex.toDouble(), newGyroY));
      gyroZ.add(FlSpot(dataIndex.toDouble(), newGyroZ));
      mputemp.add(FlSpot(dataIndex.toDouble(), mputem));

      // Remove old data if exceeding maxDataPoints
      if (accelX.length > maxDataPoints) accelX.removeAt(0);
      if (accelY.length > maxDataPoints) accelY.removeAt(0);
      if (accelZ.length > maxDataPoints) accelZ.removeAt(0);
      if (gyroX.length > maxDataPoints) gyroX.removeAt(0);
      if (gyroY.length > maxDataPoints) gyroY.removeAt(0);
      if (gyroZ.length > maxDataPoints) gyroZ.removeAt(0);

      // Update min and max values dynamically
      List<double> allValues = [
        ...accelX.map((e) => e.y),
        ...accelY.map((e) => e.y),
        ...accelZ.map((e) => e.y),
        ...gyroX.map((e) => e.y),
        ...gyroY.map((e) => e.y),
        ...gyroZ.map((e) => e.y),
      ];

      if (allValues.isNotEmpty) {
        minY = allValues.reduce((a, b) => a < b ? a : b);
        maxY = allValues.reduce((a, b) => a > b ? a : b);
      }

      // Adjust X values so that the graph remains continuous
      double firstX = accelX.isNotEmpty ? accelX.first.x : 0;
      accelX = accelX.map((e) => FlSpot(e.x - firstX, e.y)).toList();
      accelY = accelY.map((e) => FlSpot(e.x - firstX, e.y)).toList();
      accelZ = accelZ.map((e) => FlSpot(e.x - firstX, e.y)).toList();
      gyroX = gyroX.map((e) => FlSpot(e.x - firstX, e.y)).toList();
      gyroY = gyroY.map((e) => FlSpot(e.x - firstX, e.y)).toList();
      gyroZ = gyroZ.map((e) => FlSpot(e.x - firstX, e.y)).toList();

      dataIndex++;
    }



    /// ✅ **Get Live Location Data (Only for `isprev: false`)**
  Future<Position?> _getCurrentLocation() async {
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      debugPrint("❌ Location Error: $e");
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.device.name),
        actions: [
          IconButton(
            icon: Icon(isConnected ? Icons.bluetooth_disabled : Icons.bluetooth),
            onPressed: isConnected ? _disconnectFromDevice : _connectToDevice,
          ),
        ],
      ),
      body: Center(
        child: ListView(
            padding: EdgeInsets.all(10),
            children: [
              Text("Current Acceleration", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text("X: $currentAccelX  Y: $currentAccelY  Z: $currentAccelZ", style: TextStyle(fontSize: 16)),

              SizedBox(height: 10),
              Text("Acceleration Graph", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SensorGraph(title: "Acceleration", x: accelX, y: accelY, z: accelZ, minY: minY, maxY: maxY),

              SizedBox(height: 20),
              Text("Current Gyroscope", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text("X: $currentGyroX  Y: $currentGyroY  Z: $currentGyroZ", style: TextStyle(fontSize: 16)),

              SizedBox(height: 10),
              Text("Gyroscope Graph", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),

              SensorGraph(title: "Temperature", x: gyroX, y: gyroY, z: gyroZ, minY: minY, maxY: maxY),
              SizedBox(height: 20),
              Text("Current Temperature", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text("Temp: $curr ", style: TextStyle(fontSize: 16)),

              SizedBox(height: 10),
              Text("Temperature Graph", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SensorGraph(title: "Temperture", x: mputemp, y: [], z: [], minY: minY, maxY: maxY),
            ],
            ),
      ),

    );
  }
}
