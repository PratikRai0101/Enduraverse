import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class SensorGraph extends StatelessWidget {
  final String title;
  final List<FlSpot> x, y, z;
  final double minY, maxY;

  const SensorGraph({
    super.key,
    required this.title,
    required this.x,
    required this.y,
    required this.z,
    required this.minY,
    required this.maxY,
  });

  @override
  Widget build(BuildContext context) {
    if (x.isEmpty || y.isEmpty || z.isEmpty) {
      return Center(
        child: Text(
          "Waiting for data...",
          style: TextStyle(color: Colors.white),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(color: Colors.white, fontSize: 18)),
        SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white24),
          ),
          padding: EdgeInsets.all(10),
          child: SizedBox(
            height: 180,
            child: AspectRatio(
              aspectRatio: 1.8,
              child: LineChart(
                LineChartData(
                  minX: x.first.x,
                  maxX: x.last.x,
                  minY: minY - 1,
                  maxY: maxY + 1,
                  gridData: FlGridData(show: false),
                  titlesData: FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    _buildAreaChartData(x, Colors.red),
                    _buildAreaChartData(y, Colors.green),
                    _buildAreaChartData(z, Colors.blue),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
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
      barWidth: 1,
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
