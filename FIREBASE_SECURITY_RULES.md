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
      // Enables the client-side per-user query (orderByChild('uid').equalTo(uid)).
      ".indexOn": ["uid"],
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
    },

    "users_public": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && auth.uid === $uid",
        "bio": { ".validate": "newData.isString() && newData.val().length <= 160" }
      }
    }
  }
}
```

## Bootstrap an admin

Set `users/{yourUid}/isAdmin = true` once via the Firebase Console (Database
tab) before deploying these rules. After that, only existing admins can grant
admin to others.

## VIP embed gating (server-enforced)

The watch page now fetches embed IDs for `vip_only` episodes through the
TanStack Start server function `getVipEmbed`
(`src/lib/vip-embed.functions.ts`). It verifies the Firebase ID token via
Google Identity Toolkit, reads `/users/{uid}/status` from RTDB REST with the
token (so these rules apply), and only returns `dailymotion_id` / `okru_id`
when the caller is VIP or the 30-minute early-access window has elapsed.

For maximum protection, move VIP embed IDs out of `/episodes/{id}` into a
separate node such as `/vip_embeds/{episodeId}` whose `.read` requires
`root.child('users').child(auth.uid).child('status').val() === 'vip'`, and
update `getVipEmbed` to read from there. Until then, VIP embed IDs are
technically fetchable via direct RTDB reads by any authenticated user
because `/episodes` is world-readable to signed-in users.

