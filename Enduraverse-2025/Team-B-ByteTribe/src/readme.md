# DongleViz App

## Overview

DongleViz is an innovative application designed to monitor and analyze real-time data from a vehicle. The system leverages an ESP32 microcontroller and an MPU6050 sensor to collect data, which is then transmitted to the ThingSpeak platform for storage and analysis. The app provides real-time data analytics and uses a Large Language Model (LLM) to summarize and explain any issues detected in the vehicle.

## Architecture

### 1. ESP32 and MPU6050 Sensor

- **ESP32 Microcontroller**: The ESP32 is a powerful microcontroller with built-in WiFi capabilities. It is used to read data from the MPU6050 sensor and transmit it to the ThingSpeak platform.
- **MPU6050 Sensor**: This sensor measures acceleration and gyroscopic data. It provides values for acceleration along the X, Y, and Z axes, as well as gyroscopic data for the same axes.

### 2. Data Transmission

- The ESP32 reads data from the MPU6050 sensor, including acceleration (accX, accY, accZ) and gyroscopic (gyroX, gyroY, gyroZ) values, as well as temperature.
- The collected data is transmitted to ThingSpeak using HTTP requests over WiFi.

### 3. ThingSpeak Platform

- **ThingSpeak**: ThingSpeak is an IoT analytics platform that allows users to aggregate, visualize, and analyze live data streams. It provides APIs to retrieve the stored data for real-time analytics.

### 4. Real-Time Data Analytics

- The DongleViz app reads the collected data from ThingSpeak and performs real-time analytics.
- The app visualizes the data, detects anomalies, and provides insights into the vehicle's performance.

### 5. LLM Integration

- **Large Language Model (LLM)**: The LLM is used to summarize the issues found in the vehicle based on the analyzed data.
- The LLM provides explanations and insights about the detected issues, helping users understand the vehicle's condition and potential problems.

## How It Works

1. **Setup**: The ESP32 is configured to connect to a WiFi network and read data from the MPU6050 sensor.
2. **Data Collection**: The ESP32 collects acceleration, gyroscopic, and temperature data from the MPU6050 sensor.
3. **Data Transmission**: The ESP32 sends the collected data to ThingSpeak using HTTP requests.
4. **Data Analysis**: The DongleViz app retrieves the data from ThingSpeak and performs real-time analytics.
5. **Issue Summarization**: The LLM analyzes the data and provides summaries and explanations of any detected issues.