# Use an official Python runtime as a parent image
FROM node:6.10-slim

# Set the working directory to /app
WORKDIR /Telco-RnD

# Copy the current directory contents into the container at /app
COPY . /Telco-RnD

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World

# Run app.py when the container launches
CMD ["node", "app.js"]