export default {
  async fetch(request, env) {
    const kv = env.OURA_TOKENS;

    const clientId = "[Client ID]";
    const clientSecret = "[Client Secret]";

    // Fetch stored tokens
    let refreshToken = await kv.get("refresh_token");
    let accessToken = await kv.get("access_token");
    let accessExpires = await kv.get("access_expires");

    // Refresh access token if missing or expired
    if (!accessToken || Date.now() > Number(accessExpires)) {
      const tokenResp = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResp.ok) {
        const errorText = await tokenResp.text();
        return new Response(
          JSON.stringify({ 
            error: "Token refresh failed", 
            status: tokenResp.status,
            details: errorText 
          }),
          { 
            status: tokenResp.status,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const tokenData = await tokenResp.json();

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;

      // Store updated tokens
      await kv.put("refresh_token", refreshToken);
      await kv.put("access_token", accessToken);
      await kv.put(
        "access_expires",
        (Date.now() + tokenData.expires_in * 1000).toString()
      );
    }

    // Parse query parameters from request
    const url = new URL(request.url);
    
    // Default to yesterday through today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    const startDate = url.searchParams.get("start_date") || yesterdayStr;
    const endDate = url.searchParams.get("end_date") || todayStr;

    // Fetch all metrics in parallel
    const [sleepResp, spo2Resp, vo2Resp] = await Promise.all([
      fetch(
        `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
      fetch(
        `https://api.ouraring.com/v2/usercollection/daily_spo2?start_date=${startDate}&end_date=${endDate}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
      fetch(
        `https://api.ouraring.com/v2/usercollection/vO2_max?start_date=${startDate}&end_date=${endDate}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
    ]);

    // Check for errors
    if (!sleepResp.ok) {
      const errorText = await sleepResp.text();
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch sleep data", 
          status: sleepResp.status,
          details: errorText,
          start_date: startDate,
          end_date: endDate
        }),
        { 
          status: sleepResp.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Parse all responses
    const sleepData = await sleepResp.json();
    const spo2Data = spo2Resp.ok ? await spo2Resp.json() : { data: [] };
    const vo2Data = vo2Resp.ok ? await vo2Resp.json() : { data: [] };

    // Create lookup maps for SPO2 and VO2 data by date
    const spo2ByDate = {};
    if (spo2Data?.data) {
      for (const item of spo2Data.data) {
        // Extract average if spo2_percentage is an object, otherwise use the value directly
        const spo2Value = item.spo2_percentage?.average ?? item.spo2_percentage;
        spo2ByDate[item.day] = spo2Value;
      }
    }

    const vo2ByDate = {};
    if (vo2Data?.data) {
      for (const item of vo2Data.data) {
        vo2ByDate[item.day] = item.vo2_max;
      }
    }

    // Extract and merge data for all days in range
    // Use a Map to keep only the most recent entry per date
    const resultsByDate = {};
    if (sleepData?.data?.length > 0) {
      for (const dayData of sleepData.data) {
        // Store by date - last entry wins (most recent)
        resultsByDate[dayData.day] = {
          date: dayData.day,
          hrv: dayData.average_hrv,
          rhr: dayData.lowest_heart_rate,
          spo2: spo2ByDate[dayData.day] || null,
          vo2_max: vo2ByDate[dayData.day] || null
        };
      }
    }
    
    // Convert to array
    const results = Object.values(resultsByDate);

    // Return single object if only one day, array if multiple days
    let response;
    if (results.length === 0) {
      // No data - include debug info
      response = { 
        data: [], 
        count: 0, 
        queried_start: startDate, 
        queried_end: endDate, 
        raw_data_count: sleepData?.data?.length || 0,
        message: "No sleep data found for this date range"
      };
    } else if (results.length === 1) {
      response = { 
        hrv: results[0].hrv, 
        rhr: results[0].rhr, 
        spo2: results[0].spo2,
        vo2_max: results[0].vo2_max,
        date: results[0].date 
      };
    } else {
      response = { data: results, count: results.length };
    }

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
