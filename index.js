// IoT Device Management Platform - Main Server
// Traditional JavaScript Implementation

var http = require('http');
var url = require('url');
var querystring = require('querystring');

// In-memory database for devices
var devices = {};
var deviceLogs = {};
var alerts = [];

// Device status tracking
var deviceStatus = {
  online: 0,
  offline: 0,
  warning: 0
};

// Helper function to generate unique IDs
function generateId() {
  return 'device_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// Helper function to get current timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Function to update device status counts
function updateStatusCounts() {
  deviceStatus.online = 0;
  deviceStatus.offline = 0;
  deviceStatus.warning = 0;
  
  var keys = Object.keys(devices);
  for (var i = 0; i < keys.length; i++) {
    var device = devices[keys[i]];
    if (device.status === 'online') {
      deviceStatus.online++;
    } else if (device.status === 'offline') {
      deviceStatus.offline++;
    } else if (device.status === 'warning') {
      deviceStatus.warning++;
    }
  }
}

// Function to add log entry
function addLog(deviceId, action, details) {
  if (!deviceLogs[deviceId]) {
    deviceLogs[deviceId] = [];
  }
  
  var logEntry = {
    timestamp: getTimestamp(),
    action: action,
    details: details
  };
  
  deviceLogs[deviceId].push(logEntry);
  
  // Keep only last 100 logs per device
  if (deviceLogs[deviceId].length > 100) {
    deviceLogs[deviceId].shift();
  }
}

// Function to create alert
function createAlert(deviceId, message, severity) {
  var alert = {
    id: 'alert_' + Date.now(),
    deviceId: deviceId,
    message: message,
    severity: severity,
    timestamp: getTimestamp(),
    acknowledged: false
  };
  
  alerts.push(alert);
  
  // Keep only last 50 alerts
  if (alerts.length > 50) {
    alerts.shift();
  }
  
  return alert;
}

// Handle device registration
function registerDevice(data, callback) {
  try {
    var deviceId = generateId();
    var device = {
      id: deviceId,
      name: data.name || 'Unnamed Device',
      type: data.type || 'sensor',
      location: data.location || 'Unknown',
      status: 'online',
      lastSeen: getTimestamp(),
      registeredAt: getTimestamp(),
      metadata: data.metadata || {},
      telemetry: {
        temperature: null,
        humidity: null,
        battery: 100,
        signalStrength: null
      }
    };
    
    devices[deviceId] = device;
    addLog(deviceId, 'REGISTERED', 'Device registered successfully');
    updateStatusCounts();
    
    callback(null, {
      success: true,
      device: device,
      message: 'Device registered successfully'
    });
  } catch (error) {
    callback(error, null);
  }
}

// Handle device update
function updateDevice(deviceId, data, callback) {
  try {
    if (!devices[deviceId]) {
      callback(new Error('Device not found'), null);
      return;
    }
    
    var device = devices[deviceId];
    
    if (data.name) device.name = data.name;
    if (data.location) device.location = data.location;
    if (data.status) device.status = data.status;
    if (data.metadata) device.metadata = data.metadata;
    
    device.lastSeen = getTimestamp();
    
    addLog(deviceId, 'UPDATED', 'Device information updated');
    updateStatusCounts();
    
    callback(null, {
      success: true,
      device: device,
      message: 'Device updated successfully'
    });
  } catch (error) {
    callback(error, null);
  }
}

// Handle telemetry data
function updateTelemetry(deviceId, data, callback) {
  try {
    if (!devices[deviceId]) {
      callback(new Error('Device not found'), null);
      return;
    }
    
    var device = devices[deviceId];
    var telemetry = device.telemetry;
    
    if (data.temperature !== undefined) telemetry.temperature = data.temperature;
    if (data.humidity !== undefined) telemetry.humidity = data.humidity;
    if (data.battery !== undefined) telemetry.battery = data.battery;
    if (data.signalStrength !== undefined) telemetry.signalStrength = data.signalStrength;
    
    device.lastSeen = getTimestamp();
    device.status = 'online';
    
    // Check for alerts
    if (telemetry.battery < 20) {
      createAlert(deviceId, 'Low battery: ' + telemetry.battery + '%', 'warning');
    }
    if (telemetry.temperature && telemetry.temperature > 80) {
      createAlert(deviceId, 'High temperature: ' + telemetry.temperature + '°C', 'critical');
    }
    
    addLog(deviceId, 'TELEMETRY', 'Telemetry data received');
    updateStatusCounts();
    
    callback(null, {
      success: true,
      telemetry: telemetry,
      message: 'Telemetry updated successfully'
    });
  } catch (error) {
    callback(error, null);
  }
}

// Handle device deletion
function deleteDevice(deviceId, callback) {
  try {
    if (!devices[deviceId]) {
      callback(new Error('Device not found'), null);
      return;
    }
    
    delete devices[deviceId];
    delete deviceLogs[deviceId];
    updateStatusCounts();
    
    callback(null, {
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    callback(error, null);
  }
}

// Get all devices
function getAllDevices(callback) {
  var deviceList = [];
  var keys = Object.keys(devices);
  
  for (var i = 0; i < keys.length; i++) {
    deviceList.push(devices[keys[i]]);
  }
  
  callback(null, {
    success: true,
    devices: deviceList,
    count: deviceList.length,
    status: deviceStatus
  });
}

// Get single device
function getDevice(deviceId, callback) {
  if (!devices[deviceId]) {
    callback(new Error('Device not found'), null);
    return;
  }
  
  callback(null, {
    success: true,
    device: devices[deviceId],
    logs: deviceLogs[deviceId] || []
  });
}

// Get device logs
function getDeviceLogs(deviceId, callback) {
  if (!devices[deviceId]) {
    callback(new Error('Device not found'), null);
    return;
  }
  
  callback(null, {
    success: true,
    logs: deviceLogs[deviceId] || []
  });
}

// Get all alerts
function getAllAlerts(callback) {
  callback(null, {
    success: true,
    alerts: alerts,
    count: alerts.length
  });
}

// Acknowledge alert
function acknowledgeAlert(alertId, callback) {
  var found = false;
  
  for (var i = 0; i < alerts.length; i++) {
    if (alerts[i].id === alertId) {
      alerts[i].acknowledged = true;
      found = true;
      break;
    }
  }
  
  if (!found) {
    callback(new Error('Alert not found'), null);
    return;
  }
  
  callback(null, {
    success: true,
    message: 'Alert acknowledged'
  });
}

// Generate HTML Dashboard
function generateDashboard() {
  var html = '<!DOCTYPE html><html><head><title>IoT Device Management Platform</title>';
  html += '<style>';
  html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }';
  html += '.container { max-width: 1200px; margin: 0 auto; }';
  html += 'h1 { color: #333; }';
  html += '.stats { display: flex; gap: 20px; margin: 20px 0; }';
  html += '.stat-card { background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }';
  html += '.stat-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }';
  html += '.stat-card .number { font-size: 32px; font-weight: bold; }';
  html += '.online { color: #4caf50; }';
  html += '.offline { color: #f44336; }';
  html += '.warning { color: #ff9800; }';
  html += '.section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }';
  html += 'table { width: 100%; border-collapse: collapse; }';
  html += 'th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }';
  html += 'th { background: #f8f9fa; font-weight: bold; }';
  html += '.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }';
  html += '.status-online { background: #e8f5e9; color: #4caf50; }';
  html += '.status-offline { background: #ffebee; color: #f44336; }';
  html += '.status-warning { background: #fff3e0; color: #ff9800; }';
  html += 'button { background: #2196f3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }';
  html += 'button:hover { background: #1976d2; }';
  html += '.form-group { margin: 15px 0; }';
  html += 'label { display: block; margin-bottom: 5px; font-weight: bold; }';
  html += 'input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }';
  html += '</style></head><body>';
  html += '<div class="container">';
  html += '<h1>IoT Device Management Platform</h1>';
  
  // Statistics
  html += '<div class="stats">';
  html += '<div class="stat-card"><h3>Online Devices</h3><div class="number online">' + deviceStatus.online + '</div></div>';
  html += '<div class="stat-card"><h3>Offline Devices</h3><div class="number offline">' + deviceStatus.offline + '</div></div>';
  html += '<div class="stat-card"><h3>Warnings</h3><div class="number warning">' + deviceStatus.warning + '</div></div>';
  html += '<div class="stat-card"><h3>Total Devices</h3><div class="number">' + Object.keys(devices).length + '</div></div>';
  html += '</div>';
  
  // Device Registration Form
  html += '<div class="section"><h2>Register New Device</h2>';
  html += '<form id="registerForm">';
  html += '<div class="form-group"><label>Device Name:</label><input type="text" id="deviceName" required></div>';
  html += '<div class="form-group"><label>Device Type:</label><select id="deviceType">';
  html += '<option value="sensor">Sensor</option>';
  html += '<option value="actuator">Actuator</option>';
  html += '<option value="gateway">Gateway</option>';
  html += '<option value="controller">Controller</option>';
  html += '</select></div>';
  html += '<div class="form-group"><label>Location:</label><input type="text" id="deviceLocation"></div>';
  html += '<button type="submit">Register Device</button>';
  html += '</form></div>';
  
  // Devices List
  html += '<div class="section"><h2>Registered Devices</h2>';
  if (Object.keys(devices).length === 0) {
    html += '<p>No devices registered yet. Register your first device above!</p>';
  } else {
    html += '<table><thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th><th>Last Seen</th><th>Battery</th><th>Actions</th></tr></thead><tbody>';
    
    var keys = Object.keys(devices);
    for (var i = 0; i < keys.length; i++) {
      var device = devices[keys[i]];
      var statusClass = 'status-' + device.status;
      html += '<tr>';
      html += '<td>' + device.id + '</td>';
      html += '<td>' + device.name + '</td>';
      html += '<td>' + device.type + '</td>';
      html += '<td>' + device.location + '</td>';
      html += '<td><span class="status-badge ' + statusClass + '">' + device.status + '</span></td>';
      html += '<td>' + new Date(device.lastSeen).toLocaleString() + '</td>';
      html += '<td>' + (device.telemetry.battery || 'N/A') + '%</td>';
      html += '<td><button onclick="sendTelemetry(\'' + device.id + '\')">Send Data</button> ';
      html += '<button onclick="deleteDevice(\'' + device.id + '\')">Delete</button></td>';
      html += '</tr>';
    }
    
    html += '</tbody></table>';
  }
  html += '</div>';
  
  // Alerts Section
  html += '<div class="section"><h2>Recent Alerts (' + alerts.length + ')</h2>';
  if (alerts.length === 0) {
    html += '<p>No alerts yet.</p>';
  } else {
    html += '<table><thead><tr><th>Time</th><th>Device ID</th><th>Message</th><th>Severity</th><th>Status</th></tr></thead><tbody>';
    
    for (var j = alerts.length - 1; j >= 0 && j >= alerts.length - 10; j--) {
      var alert = alerts[j];
      html += '<tr>';
      html += '<td>' + new Date(alert.timestamp).toLocaleString() + '</td>';
      html += '<td>' + alert.deviceId + '</td>';
      html += '<td>' + alert.message + '</td>';
      html += '<td><span class="status-badge status-' + alert.severity + '">' + alert.severity + '</span></td>';
      html += '<td>' + (alert.acknowledged ? 'Acknowledged' : 'Active') + '</td>';
      html += '</tr>';
    }
    
    html += '</tbody></table>';
  }
  html += '</div>';
  
  // JavaScript
  html += '<script>';
  html += 'document.getElementById("registerForm").addEventListener("submit", function(e) {';
  html += '  e.preventDefault();';
  html += '  var data = {';
  html += '    name: document.getElementById("deviceName").value,';
  html += '    type: document.getElementById("deviceType").value,';
  html += '    location: document.getElementById("deviceLocation").value';
  html += '  };';
  html += '  fetch("/api/devices/register", {';
  html += '    method: "POST",';
  html += '    headers: {"Content-Type": "application/json"},';
  html += '    body: JSON.stringify(data)';
  html += '  }).then(function(res) { return res.json(); })';
  html += '    .then(function(data) {';
  html += '      alert("Device registered: " + data.device.id);';
  html += '      location.reload();';
  html += '    }).catch(function(err) { alert("Error: " + err); });';
  html += '});';
  html += 'function sendTelemetry(id) {';
  html += '  var temp = Math.floor(Math.random() * 50) + 20;';
  html += '  var humidity = Math.floor(Math.random() * 60) + 30;';
  html += '  var battery = Math.floor(Math.random() * 100);';
  html += '  var data = { temperature: temp, humidity: humidity, battery: battery, signalStrength: -70 };';
  html += '  fetch("/api/devices/" + id + "/telemetry", {';
  html += '    method: "POST",';
  html += '    headers: {"Content-Type": "application/json"},';
  html += '    body: JSON.stringify(data)';
  html += '  }).then(function(res) { return res.json(); })';
  html += '    .then(function() { alert("Telemetry sent!"); location.reload(); })';
  html += '    .catch(function(err) { alert("Error: " + err); });';
  html += '}';
  html += 'function deleteDevice(id) {';
  html += '  if(confirm("Delete this device?")) {';
  html += '    fetch("/api/devices/" + id, {method: "DELETE"})';
  html += '      .then(function() { location.reload(); })';
  html += '      .catch(function(err) { alert("Error: " + err); });';
  html += '  }';
  html += '}';
  html += '</script>';
  
  html += '</div></body></html>';
  return html;
}

// HTTP Server Request Handler
function handleRequest(req, res) {
  var parsedUrl = url.parse(req.url, true);
  var pathname = parsedUrl.pathname;
  var method = req.method;
  
  console.log('[' + getTimestamp() + '] ' + method + ' ' + pathname);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(generateDashboard());
    return;
  }
  
  // API Routes
  if (pathname.startsWith('/api/')) {
    
    // GET all devices
    if (pathname === '/api/devices' && method === 'GET') {
      getAllDevices(function(err, result) {
        if (err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, error: err.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
      });
      return;
    }
    
    // POST register device
    if (pathname === '/api/devices/register' && method === 'POST') {
      var body = '';
      req.on('data', function(chunk) {
        body += chunk.toString();
      });
      req.on('end', function() {
        var data = JSON.parse(body);
        registerDevice(data, function(err, result) {
          if (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({success: false, error: err.message}));
            return;
          }
          res.writeHead(201, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(result));
        });
      });
      return;
    }
    
    // GET single device
    var deviceMatch = pathname.match(/^\/api\/devices\/([^\/]+)$/);
    if (deviceMatch && method === 'GET') {
      var deviceId = deviceMatch[1];
      getDevice(deviceId, function(err, result) {
        if (err) {
          res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, error: err.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
      });
      return;
    }
    
    // PUT update device
    if (deviceMatch && method === 'PUT') {
      var deviceId = deviceMatch[1];
      var body = '';
      req.on('data', function(chunk) {
        body += chunk.toString();
      });
      req.on('end', function() {
        var data = JSON.parse(body);
        updateDevice(deviceId, data, function(err, result) {
          if (err) {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({success: false, error: err.message}));
            return;
          }
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(result));
        });
      });
      return;
    }
    
    // DELETE device
    if (deviceMatch && method === 'DELETE') {
      var deviceId = deviceMatch[1];
      deleteDevice(deviceId, function(err, result) {
        if (err) {
          res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, error: err.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
      });
      return;
    }
    
    // POST telemetry
    var telemetryMatch = pathname.match(/^\/api\/devices\/([^\/]+)\/telemetry$/);
    if (telemetryMatch && method === 'POST') {
      var deviceId = telemetryMatch[1];
      var body = '';
      req.on('data', function(chunk) {
        body += chunk.toString();
      });
      req.on('end', function() {
        var data = JSON.parse(body);
        updateTelemetry(deviceId, data, function(err, result) {
          if (err) {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({success: false, error: err.message}));
            return;
          }
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(result));
        });
      });
      return;
    }
    
    // GET device logs
    var logsMatch = pathname.match(/^\/api\/devices\/([^\/]+)\/logs$/);
    if (logsMatch && method === 'GET') {
      var deviceId = logsMatch[1];
      getDeviceLogs(deviceId, function(err, result) {
        if (err) {
          res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, error: err.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
      });
      return;
    }
    
    // GET alerts
    if (pathname === '/api/alerts' && method === 'GET') {
      getAllAlerts(function(err, result) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
      });
      return;
    }
    
    // GET system status
    if (pathname === '/api/status' && method === 'GET') {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        success: true,
        status: 'running',
        deviceCount: Object.keys(devices).length,
        deviceStatus: deviceStatus,
        alertCount: alerts.length,
        timestamp: getTimestamp()
      }));
      return;
    }
  }
  
  // 404 Not Found
  res.writeHead(404, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({success: false, error: 'Endpoint not found'}));
}

// Create HTTP Server
var server = http.createServer(handleRequest);

// Start Server
var PORT = 3000;
server.listen(PORT, function() {
  console.log('=====================================');
  console.log('IoT Device Management Platform');
  console.log('=====================================');
  console.log('Server running on http://localhost:' + PORT);
  console.log('Dashboard: http://localhost:' + PORT + '/dashboard');
  console.log('API Base URL: http://localhost:' + PORT + '/api');
  console.log('=====================================');
  console.log('');
  console.log('Available API Endpoints:');
  console.log('  GET    /api/devices           - List all devices');
  console.log('  POST   /api/devices/register  - Register new device');
  console.log('  GET    /api/devices/:id       - Get device details');
  console.log('  PUT    /api/devices/:id       - Update device');
  console.log('  DELETE /api/devices/:id       - Delete device');
  console.log('  POST   /api/devices/:id/telemetry - Send telemetry data');
  console.log('  GET    /api/devices/:id/logs  - Get device logs');
  console.log('  GET    /api/alerts            - Get all alerts');
  console.log('  GET    /api/status            - Get system status');
  console.log('=====================================');
});

// Handle server errors
server.on('error', function(error) {
  console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGINT', function() {
  console.log('\nShutting down server...');
  server.close(function() {
    console.log('Server closed');
    process.exit(0);
  });
});
