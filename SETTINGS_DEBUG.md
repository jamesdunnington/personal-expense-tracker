# Settings Debug Guide - Profile Name Issue

## Fixes Applied in This Deployment

### 1. **Profile Name Update Fix** ✅
**Problem**: Name was not being saved because `settings-update.js` only updated preferences, not the `users` table.

**Solution**: Updated `settings-update.js` to:
```javascript
// Update user name if provided
if (name !== undefined) {
  await pool.query(
    `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
    [name, userId]
  )
}
```

### 2. **Auto-Reload After Save** ✅
Added `await loadSettings()` after successful profile update to immediately show the saved name.

### 3. **Enhanced Error Logging** ✅
Added console.logs to track the exact error occurring.

## Deployment
- ✅ Build successful
- ✅ Deployed to: https://melodic-florentine-c45b71.netlify.app
- ✅ Deploy ID: 68efc33f05fde32a036ffae9

## Testing Steps

### Step 1: Clear Everything
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Storage** → Click "Clear site data"
3. Close and reopen the browser
4. Navigate to https://melodic-florentine-c45b71.netlify.app

### Step 2: Check Console Logs
1. Open DevTools Console (F12 → Console tab)
2. Navigate to **Settings** page
3. Look for these console messages:
   ```
   Loading settings...
   Settings loaded: {user: {...}, settings: {...}}
   ```

### Step 3: Test Profile Name Update
1. Go to **Settings** → **Profile** tab
2. Enter your name in the Name field
3. Click "Save Profile"
4. You should see alert "Profile updated successfully"
5. **The name should remain after refresh**

### Step 4: Check Network Requests
If errors persist, check Network tab:
1. Open DevTools → Network tab
2. Navigate to Settings page
3. Look for request to `/.netlify/functions/settings-get`
4. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Should show user data with name
   - **Headers**: Should show CORS headers

## Common Issues & Solutions

### Issue 1: "Failed to load settings" popup appears
**Check Console for:**
- `Loading settings...` - If missing, API call isn't being made
- `Settings loaded:` - If missing, API returned error
- Error messages with details

**Possible causes:**
1. **404 Error**: Function not found
   - Check: https://melodic-florentine-c45b71.netlify.app/.netlify/functions/settings-get
   - Should return 401 error (no token) not 404

2. **CORS Error**: 
   ```
   Access to XMLHttpRequest blocked by CORS policy
   ```
   - We added CORS headers, should be fixed now

3. **JWT Token Issue**:
   - Try logging out and logging in again
   - Token might be expired or invalid

### Issue 2: Name saves but disappears after refresh
**This should be fixed now**, but if it still happens:
1. Check Network tab for `settings-update` request
2. Verify it returns 200 status
3. Check `settings-get` response after refresh
4. Verify the response includes your name

### Issue 3: Popup appears but clicking OK makes it work
**This means:**
- Initial load fails (error popup)
- But retry/second attempt succeeds
- Possible cause: Race condition or slow database query

## Debugging Commands

### Check if function exists:
Open browser console and run:
```javascript
fetch('https://melodic-florentine-c45b71.netlify.app/.netlify/functions/settings-get', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Check what's stored in localStorage:
```javascript
console.log('Token:', localStorage.getItem('token'))
console.log('Theme:', localStorage.getItem('theme'))
```

### Check API configuration:
```javascript
import api from './services/api'
console.log('API Base URL:', api.defaults.baseURL)
```

## Expected Behavior After Fix

✅ **Page loads without error popup**
✅ **Name input shows your saved name**
✅ **Saving name shows success message**
✅ **Name persists after page refresh**
✅ **Dark mode toggle works immediately**

## If Issues Persist

Please provide:
1. **Console logs** (all messages in Console tab)
2. **Network requests** (screenshot of failed requests)
3. **Error message details** (exact text of popup)
4. **Response body** (from failed settings-get request)

Then I can provide more specific fixes!
