# IoT-Device-Management-Platform-in-Node.js-
IoT Device Management Platform in Node.js 


# IoT Device Management Platform

A comprehensive IoT Device Management Platform built with Node.js using traditional JavaScript (ES5 syntax).

## Features

- **Device Registration & Management**: Register, update, and delete IoT devices
- **Real-time Telemetry**: Collect and monitor device telemetry data (temperature, humidity, battery, signal strength)
- **Device Status Tracking**: Track online, offline, and warning status of devices
- **Alert System**: Automatic alerts for critical conditions (low battery, high temperature)
- **Activity Logging**: Complete audit trail of all device activities
- **Web Dashboard**: Interactive HTML dashboard for device management
- **RESTful API**: Complete REST API for device integration

## Requirements

- Node.js (v10 or higher)
- No external dependencies required (uses only built-in Node.js modules)

## Installation

1. Save the `server.js` file to your project directory
2. No npm install needed - uses only native Node.js modules

## Running the Server

```bash
node server.js
```

The server will start on `http://localhost:3000`

## Accessing the Platform

### Web Dashboard
Open your browser and navigate to:
```
http://localhost:3000/dashboard
```

The dashboard provides:
- Device statistics overview
- Device registration form
- List of all registered devices
- Recent alerts
- Interactive device management (send telemetry, delete devices)

### API Endpoints

#### Device Management

**Register Device**
```bash
POST /api/devices/register
Content-Type: application/json

{
  "name": "Temperature Sensor",
  "type": "sensor",
  "location": "Building A",
  "metadata": {}
}
```

**Get All Devices**
```bash
GET /api/devices
```

**Get Single Device**
```bash
GET /api/devices/{deviceId}
```

**Update Device**
```bash
PUT /api/devices/{deviceId}
Content-Type: application/json

{
  "name": "Updated Name",
  "location": "New Location",
  "status": "online"
}
```

**Delete Device**
```bash
DELETE /api/devices/{deviceId}
```

#### Telemetry

**Send Telemetry Data**
```bash
POST /api/devices/{deviceId}/telemetry
Content-Type: application/json

{
  "temperature": 25.5,
  "humidity": 60,
  "battery": 85,
  "signalStrength": -70
}
```

**Get Device Logs**
```bash
GET /api/devices/{deviceId}/logs
```

#### Alerts

**Get All Alerts**
```bash
GET /api/alerts
```

#### System

**Get System Status**
```bash
GET /api/status
```

## Testing with cURL

### Register a Device
```bash
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Sensor","type":"sensor","location":"Lab"}'
```

### Send Telemetry Data
```bash
curl -X POST http://localhost:3000/api/devices/{deviceId}/telemetry \
  -H "Content-Type: application/json" \
  -d '{"temperature":25.5,"humidity":60,"battery":85,"signalStrength":-70}'
```

### Get All Devices
```bash
curl http://localhost:3000/api/devices
```

## Using the Test Client

A test client script is provided to simulate an IoT device:

```bash
node test-client.js
```

This will:
1. Register a test device
2. Start sending random telemetry data every 5 seconds
3. Demonstrate the complete device lifecycle

## Device Types

The platform supports various device types:
- **sensor**: Environmental sensors, motion detectors, etc.
- **actuator**: Motors, switches, relays
- **gateway**: IoT gateways, hubs
- **controller**: Microcontrollers, PLCs

## Alert Conditions

The platform automatically generates alerts for:
- Battery level below 20%
- Temperature above 80°C
- Device offline (not implemented in basic version)

## Data Storage

- All data is stored in-memory
- Data is lost when the server restarts
- For production use, implement database integration (MongoDB, PostgreSQL, etc.)

## Code Style

This implementation uses:
- Traditional function declarations (no arrow functions)
- `var` declarations (no `const` or `let`)
- ES5 JavaScript syntax
- Callback-based asynchronous operations
- Native Node.js modules only

## Architecture

```
server.js
├── HTTP Server (Node.js http module)
├── In-memory Data Store
│   ├── devices
│   ├── deviceLogs
│   └── alerts
├── API Routes Handler
├── Business Logic Functions
│   ├── registerDevice()
│   ├── updateDevice()
│   ├── deleteDevice()
│   ├── updateTelemetry()
│   └── Alert Management
└── HTML Dashboard Generator
```

## Security Notes

This is a basic implementation for learning purposes. For production use, add:
- Authentication & Authorization
- HTTPS/TLS encryption
- Input validation & sanitization
- Rate limiting
- CORS configuration
- Database integration
- Error handling improvements

## Troubleshooting

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Change the PORT variable in server.js or kill the process using port 3000

**Cannot connect to server:**
- Ensure the server is running
- Check firewall settings
- Verify the correct host and port

## License

This is a demonstration project. Feel free to use and modify as needed.

## Support

For issues or questions about this implementation, please review the code comments and API documentation above.

