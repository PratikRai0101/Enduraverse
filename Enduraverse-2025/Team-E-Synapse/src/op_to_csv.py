import serial
import csv
import os
import time

# Initialize serial connection
ser = serial.Serial('COM3', 115200)  # Replace 'COMX' with the correct port

def generate_filename(base_name="mpu6050_data", extension=".csv"):
    i = 1
    while True:
        filename = f"{base_name}_{i}{extension}"
        if not os.path.exists(filename):
            return filename
        i += 1

output_file = generate_filename()

with open(output_file, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Timestamp", "Accel X (m/s^2)", "Accel Y (m/s^2)", "Accel Z (m/s^2)",
                     "Gyro X (rad/s)", "Gyro Y (rad/s)", "Gyro Z (rad/s)", "Temp (C)"])
    print(f"Logging data to {output_file}")

    try:
        while True:
            # Read a line from serial
            line = ser.readline().decode("utf-8").strip()
            print(line)

            # Check if the line starts with "Accel (m/s^2):"
            if line.startswith("Accel (m/s^2):"):
                # Split the line into components
                components = line.split(", ")
                
                # Extract values
                accel_x = components[0].split(": ")[1]
                accel_y = components[1]
                accel_z = components[2]
                gyro_x = components[3].split(": ")[1]
                gyro_y = components[4]
                gyro_z = components[5]
                temperature = components[6].split(": ")[1]

                # Add timestamp
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

                # Write the data to the CSV file
                writer.writerow([timestamp, accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, temperature])
                csvfile.flush()

    except KeyboardInterrupt:
        print("Data logging stopped.")
        ser.close()
