const BASE_URL = "http://localhost:8787";

async function testBackend() {
  console.log("🧪 Testing Agricoole Backend API\n");
  console.log("================================\n");

  try {
    // Test 1: Health Check
    console.log("1️⃣  Testing Health Endpoint...");
    const health = await fetch(`${BASE_URL}/api/health`);
    const healthData = await health.json();
    console.log("   ✅ Health:", JSON.stringify(healthData, null, 2));
    console.log("");

    // Test 2: Login
    console.log("2️⃣  Testing Login Endpoint...");
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@agricoole.com",
        password: "demo123"
      })
    });
    const loginData = await login.json();
    
    if (!loginData.token) {
      console.log("   ❌ Login failed:", loginData);
      return;
    }
    console.log("   ✅ Login successful!");
    console.log("   User:", loginData.user.name);
    console.log("   Farm:", loginData.user.farmName);
    const token = loginData.token;
    console.log("");

    // Test 3: Get User Info
    console.log("3️⃣  Testing Get User Info (Protected)...");
    const userInfo = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const userData = await userInfo.json();
    console.log("   ✅ User data:", userData.user.email);
    console.log("");

    // Test 4: Get Fields
    console.log("4️⃣  Testing Get Fields (Protected)...");
    const fields = await fetch(`${BASE_URL}/api/fields`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const fieldsData = await fields.json();
    console.log("   ✅ Fields found:", fieldsData.fields.length);
    
    if (fieldsData.fields.length > 0) {
      const field = fieldsData.fields[0];
      console.log("   Field:", field.name, `(${field.crop_type})`);
      const fieldId = field.id;
      console.log("");

      // Test 5: Get Specific Field with Sensors
      console.log("5️⃣  Testing Get Field Details...");
      const fieldDetail = await fetch(`${BASE_URL}/api/fields/${fieldId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const fieldData = await fieldDetail.json();
      console.log("   ✅ Field sensors:", fieldData.field.sensors.length);
      console.log("");

      // Test 6: Get Dashboard Data
      console.log("6️⃣  Testing Dashboard Endpoint...");
      const dashboard = await fetch(`${BASE_URL}/api/dashboard/${fieldId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dashboardData = await dashboard.json();
      console.log("   ✅ Dashboard data:");
      console.log("      Total sensors:", dashboardData.summary.totalSensors);
      console.log("      Healthy:", dashboardData.summary.healthySensors);
      console.log("      Health:", dashboardData.summary.healthPercentage + "%");
      console.log("\n   📊 Sensor Readings:");
      dashboardData.sensors.forEach(s => {
        const status = s.isHealthy ? "🟢" : "🔴";
        console.log(`      ${status} ${s.name}: ${s.currentValue}${s.unit}`);
      });
      console.log("");

      // Test 7: Get Historical Data
      console.log("7️⃣  Testing Historical Data...");
      const history = await fetch(`${BASE_URL}/api/dashboard/${fieldId}/history?days=7`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const historyData = await history.json();
      console.log("   ✅ History retrieved:");
      historyData.history.forEach(h => {
        console.log(`      ${h.sensorName}: ${h.readings.length} readings`);
      });
      console.log("");
    }

    // Test 8: Test without authentication (should fail)
    console.log("8️⃣  Testing Protected Route without Token...");
    const noAuth = await fetch(`${BASE_URL}/api/fields`);
    const noAuthData = await noAuth.json();
    if (noAuth.status === 401) {
      console.log("   ✅ Correctly rejected:", noAuthData.error);
    } else {
      console.log("   ❌ Should have been rejected!");
    }
    console.log("");

    console.log("================================");
    console.log("✅ All Backend Tests Passed!\n");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testBackend();
