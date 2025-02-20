import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class EmailService {
  static const String senderEmail = "wixpolo@gmail.com"; // Your Email
  static const String senderName = "Telematics App";
  static const String appPassword = "bwbz nkfq inbb fjxw"; // App Password

  // ✅ Fetch Family Emails from Firestore
  Future<List<String>> _getFamilyEmails() async {
    User? user = FirebaseAuth.instance.currentUser;
    if (user == null) return [];

    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection("users")
        .doc(user.uid)
        .collection("family")
        .get();

    return snapshot.docs.map((doc) => doc["email"].toString()).toList();
  }

  // ✅ Send Custom Email to Family Members
  Future<void> sendCustomEmail(String subject, String messageText) async {
    List<String> recipients = await _getFamilyEmails();

    if (recipients.isEmpty) {
      print("❌ No family members found. Cannot send email.");
      return;
    }

    final smtpServer = gmail(senderEmail, appPassword);

    final message = Message()
      ..from = Address(senderEmail, senderName)
      ..recipients.addAll(recipients)
      ..subject = subject
      ..text = messageText;

    try {
      await send(message, smtpServer);
      print("✅ Email Sent Successfully");
    } catch (e) {
      print("❌ Email Sending Failed: $e");
    }
  }

  // ✅ Send Accident Alert Email
  Future<void> sendAccidentAlert(double latitude, double longitude) async {
    String googleMapsLink =
        "https://www.google.com/maps/search/?api=1&query=$latitude,$longitude";
    String messageText = "🚨 Emergency Alert: Possible Accident Detected!\n\n"
        "Location: $googleMapsLink\n\n"
        "Please check on the user immediately.";

    await sendCustomEmail("🚑 Accident Alert!", messageText);
  }
}
