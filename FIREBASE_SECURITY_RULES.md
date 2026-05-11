# Firebase Realtime Database Security Rules

The client-side fixes alone cannot stop a malicious user from calling the
Firebase SDK directly. You MUST deploy these rules in the Firebase Console
(Realtime Database → Rules) for the security model to hold.

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "users": {
      // Only admins can list all users.
      ".read": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        // Users may create/update their own profile, but never their own
        // status / banned / isAdmin / payment_status — only admins can.
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        "status":         { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" },
        "banned":         { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" },
        "ban_reason":     { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" },
        "isAdmin":        { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" },
        "payment_status": { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" }
      }
    },

    "payments": {
      // Only admins can list all payments.
      ".read": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      "$pid": {
        ".read":  "auth != null && (data.child('uid').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".write": "auth != null && (
                     // user creates their own pending payment with the fixed price
                     (!data.exists()
                       && newData.child('uid').val() === auth.uid
                       && newData.child('amount').val() === 50000
                       && newData.child('status').val() === 'pending')
                     || root.child('users').child(auth.uid).child('isAdmin').val() === true
                   )"
      }
    },

    "animes":   { ".read": "auth != null", "$id": { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" } },
    "episodes": { ".read": "auth != null", "$id": { ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" } },
    "settings": { ".read": true,           ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true" },

    "comments": {
      "$episodeId": {
        ".read": "auth != null",
        "$cid": {
          ".write": "auth != null && (
                       (!data.exists() && newData.child('uid').val() === auth.uid && !newData.hasChild('status'))
                       || root.child('users').child(auth.uid).child('isAdmin').val() === true
                     )"
        }
      }
    },

    "bookmarks": {
      "$uid": {
        ".read":  "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "history": {
      "$uid": {
        ".read":  "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

## Bootstrap an admin

Set `users/{yourUid}/isAdmin = true` once via the Firebase Console (Database
tab) before deploying these rules. After that, only existing admins can grant
admin to others.

## VIP embed gating (recommended hardening)

Client-side `vip_only` checks can be bypassed in DevTools. For full
enforcement, move embed-URL generation to a TanStack Start server function
that verifies the Firebase ID token and reads the user's `status` server-side
before returning the embed ID. Keep `dailymotion_id` / `okru_id` out of any
client payload for locked episodes.
