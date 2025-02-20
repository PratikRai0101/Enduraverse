import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:async';

class GraphCard extends StatefulWidget {
  final String title;
  final List<FlSpot> initialData;
  final Color color;

  const GraphCard({
    super.key,
    required this.title,
    required this.initialData,
    required this.color,
  });

  @override
  _GraphCardState createState() => _GraphCardState();
}

class _GraphCardState extends State<GraphCard> {
  List<FlSpot> data = [];
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    data = List.from(widget.initialData);
  }

  void updateData(double x, double y) {
    setState(() {
      data.add(FlSpot(x, y));
      if (data.length > 20) {
        data.removeAt(0);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.grey[900],
      margin: EdgeInsets.all(10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.title,
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            SizedBox(height: 8),
            SizedBox(
              height: 150,
              child: LineChart(
                LineChartData(
                  lineBarsData: [
                    ChartDataBuilder.buildAreaChartData(data, widget.color),
                  ],
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(),
                    bottomTitles: AxisTitles(),
                    rightTitles: AxisTitles(),
                    topTitles: AxisTitles(),
                  ),
                  borderData: FlBorderData(
                    show: true,
                    border: Border.all(color: Colors.white38),
                  ),
                  gridData: FlGridData(show: true),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ChartDataBuilder {
  static LineChartBarData buildAreaChartData(List<FlSpot> spots, Color color) {
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
}
