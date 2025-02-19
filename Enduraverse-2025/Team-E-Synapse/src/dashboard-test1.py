import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt


st.title("Accelerometer and Gyroscope Data Dashboard")


uploaded_file = st.file_uploader("Choose a CSV file", type="csv")

if uploaded_file is not None:

    df = pd.read_csv(uploaded_file)
    

    st.subheader("Data Overview")
    st.write(df.head())


    st.subheader("Data Summary")
    st.write(df.describe())
    

    st.subheader("Accelerometer Data (a_x, a_y, a_z)")
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(df['a_x'], label="a_x")
    ax.plot(df['a_y'], label="a_y")
    ax.plot(df['a_z'], label="a_z")
    ax.set_xlabel("Index")
    ax.set_ylabel("Acceleration")
    ax.set_title("Accelerometer Data")
    ax.legend()
    st.pyplot(fig)


    st.subheader("Gyroscope Data (g_x, g_y, g_z)")
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(df['g_x'], label="g_x")
    ax.plot(df['g_y'], label="g_y")
    ax.plot(df['g_z'], label="g_z")
    ax.set_xlabel("Index")
    ax.set_ylabel("Gyroscope Reading")
    ax.set_title("Gyroscope Data")
    ax.legend()
    st.pyplot(fig)

   
