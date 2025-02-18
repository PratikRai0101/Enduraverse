import serial
import csv
import re
import os
import time

ser = serial.Serial('COM3', 115200)

def generate_filename(base_name="mpu6050_data", extension=".csv"):
    i = 1
    while True:
        filename = f"{base_name}_{i}{extension}"
        if not os.path.exists(filename):
            return filename
        i += 1

output_file = generate_filename()

data_pattern = re.compile(r"[-+]?\d*\.?\d+")

with open(output_file, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Timestamp", "Acceleration X (m/s^2)", "Acceleration Y (m/s^2)", "Acceleration Z (m/s^2)",
                     "Rotation X (rad/s)", "Rotation Y (rad/s)", "Rotation Z (rad/s)", "Temperature (°C)"])
    print(f"Logging data to {output_file}")
    
    try:
        while True:
            line = ser.readline().decode("utf-8").strip()
            print(line)
            
            if line.startswith("Acceleration X:"):
                accel_data = data_pattern.findall(line)
                accel_x, accel_y, accel_z = accel_data[0:3]

            elif line.startswith("Rotation X:"):
                gyro_data = data_pattern.findall(line)
                gyro_x, gyro_y, gyro_z = gyro_data[0:3]

            elif line.startswith("Temperature:"):
                temp_data = data_pattern.findall(line)
                temperature = temp_data[0]
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                writer.writerow([timestamp, accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, temperature])
                csvfile.flush()

    except KeyboardInterrupt:
        print("Data logging stopped.")
        ser.close()
