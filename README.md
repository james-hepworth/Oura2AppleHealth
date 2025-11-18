# Instructions for setting up Oura2AppleHealth

This setup guide and associate code is used for extending the set of health metrics synced by Oura to Apple Health to include HRV, RHR, VO2_max, and SpO2.
A Cloudflare webservice handles the authentication and retreival of data from Oura Cloud, and an Apple Shortcut fetches this data from the webservice endpoint and logs it to Apple Health.

## Step 1: Create an app on developer.ouraring.com
1. Open https://developer.ouraring.com
2. Create an app
    - Name: Oura2AppleHealth
    - Redirect URI: https://example.com
    - Scopes: daily, spo2, heart_health
    - Email, website, privacy policy and terms of service can be set to anything.
3. Get the client ID and client secret
4. Insert your client ID and client secret into the `get_token_simple.py` file at lines 8 and 9 and in the `oura_worker.js` file at lines 5 and 6.
5. Run the `get_token_simple.py` file following instructions that appear in the terminal. You may need to install the `requests` library using `pip install requests`.
6. Copy the refresh token saved to the `refresh_token.txt` file.


## Step 2: Create a Cloudflare webservice to fetch Oura data from the Oura API
This handles the OAuth flow and fetches the data from the Oura API.

1. Create a new Cloudflare account if you don't have one.
2. In the left sidebar, click `Storage & Databases` > `Workers KV` > `Create Instance`. Give it the name `OURA_TOKENS_NAMESPACE` and click `Create`.
3. Add a new key-value pair to the namespace with the key `refresh_token` and the value being the refresh token you copied from the `refresh_token.txt` file.
4. In the left sidebar, select `Compute & AI` > `Workers & Pages` > `Start with Hello World`. Give it any name you want and click `Deploy`.
5. In the resulting overview page, click on the `Bindings` > `Add binding` > `KV Namespace` > `Add binding`. 
6. Set the name to `OURA_TOKENS` and select `OURA_TOKENS_NAMESPACE` as the namespace.
7. Click `Edit code` in the top right corner.
7. Copy the code from the `oura_worker.js` file and paste it into the code editor.
8. Click on the `Save and Deploy` button.
9. You should now be able to fetch Oura data from the Oura API.
10. Return to the overview page and click on the `Settings` tab.
11. Under "Trigger Events", click `Add` > `Cron Triggers` > `Add`. This sets up a cron job to fetch Oura data from the Oura API every 30 minutes.
12. On the overview page, copy the endpoint URL of the worker. This is located directly below the Overview tab heading.

## Step 3: Add the Oura2AppleHealth Shortcut
This shortcut fetches the Oura data returned by the Cloudflare webservice work available at the endpoint URL.
Do these steps on your iPhone.

1. Open: [Oura2AppleHealth_public shortcut](https://www.icloud.com/shortcuts/6ce7ee72d70746b58245d24d299d5699)
2. Tap `Get Shortcut` and follow to the Shorcuts app. There, tap `Add Shortcut`.
3. Tap the `...` on the top right corner of the shortcut to edit it.
4. In the first block, tap the words `URL` and paste in the endpoint URL of the Cloudflare webservice worker.
5. In the bottom right, tape the play icon to run the shortcut. On first run you will be prompted to give read and write access for Apple Heath to the Shortcuts app for each for the four data types: HRV, RHR, Cardio Fitness (VO2 Max) and Blood Oxygen (SPO2). Grant access.
6. The shortcut will run and you should see the Oura data in the Apple Health app.

This shortcut can be run manually to sync data to Apple Health or set up to run automatically at a specified time by returning to the home screen of Shorcuts and moving to the Automation tab.

1. Tap the `+` icon in the top right corner of the Automation tab.
2. Search for "Time of Day" and tap the first option.
3. Choose the time of day you want to run the shortcut and repeat frequency.
4. Select `Run Immediately` and deselect `Notify When Run`.
5. Tap `Next` and then search for the "Oura2AppleHealth_public" shorcut.
6. This will then run the shortcut at the specified time and frequency.


