# Postback Debugging Report

## Investigation Findings

I have investigated the issue where "Install postback is NOT received" and the status remains "Pending".

### 1. Code Verification ✅
I analyzed the server code (`server/routes/postback.js`) and ran a local simulation script (`server/scripts/test_postback_flow.js`). 
**The code is working correctly.**
- When a postback is received, the server correctly identifies the Click record.
- It updates the status from "Pending" to "Converted".
- It adds the cashback to the user's wallet.

### 2. The Root Cause ❌
Since the code works perfectly when it receives a request, the issue is that **Trackier is unable to send the postback to your server**.

This usually happens for one of two reasons:

1.  **Localhost Issue**: If you are running the server on your computer (`localhost`), Trackier (which is on the internet) cannot see your computer. It cannot send a request to `http://localhost:5000/api/postback`.
2.  **Incorrect URL**: If you are deployed on a server, the Postback URL in Trackier might be incorrect or the server might be blocking the request.

## Solution

### If you are testing locally (on your computer)

You must use a tunneling service like **ngrok** to expose your local server to the internet.

1.  **Install ngrok**: Download from [ngrok.com](https://ngrok.com).
2.  **Start ngrok**: Run `ngrok http 5000` (assuming your server is on port 5000).
3.  **Get Public URL**: ngrok will give you a URL like `https://abcd-123-45-67-89.ngrok-free.app`.
4.  **Update Trackier**: Go to your Campaign/Offer settings in Trackier and update the Postback URL to:
    ```
    https://abcd-123-45-67-89.ngrok-free.app/api/postback
    ```
5.  **Test Again**: Now when you generate a conversion, Trackier will send the postback to the ngrok URL, which forwards it to your localhost.

### If you are deployed (on a VPS/Cloud)

1.  **Check URL**: Ensure the Postback URL in Trackier matches your actual domain:
    ```
    https://your-domain.com/api/postback
    ```
2.  **Check Firewall**: Ensure your server allows incoming POST requests to `/api/postback`.
3.  **Check Logs**: Look at your server logs (`pm2 logs` or similar) to see if any request is reaching the server.

## How to Verify

I have created a test script `server/scripts/test_postback_flow.js` that you can run to verify the internal logic is working.

Run it with:
```bash
node server/scripts/test_postback_flow.js
```

If this script prints "SUCCESS", it confirms your server code is fine, and you just need to fix the connection from Trackier.
