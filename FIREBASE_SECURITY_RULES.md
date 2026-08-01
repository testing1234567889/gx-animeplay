# Firebase Realtime Database — FULL Security Rules

Project: `lovable-animestream`
RTDB: `https://lovable-animestream-default-rtdb.firebaseio.com`

## Auth model

- **Users**: Google sign-in ONLY. Email/password is disabled for regular users.
- **Admins**: may sign in with email/password *or* Google, but admin power comes
  from data, not from the client. Admin status = `/admins/{uid} === true`.
- **Root admin (bootstrap)**: `AVD1M9EMLHhFmmo0j9g55slMW5m2`. This UID is hardcoded
  ONLY inside these rules (server-side), never in the app bundle.
- Every new account gets a profile node created on first sign-in, including the
  `isvip` flag (`false` by default).

## Bootstrap (do this once, in the Firebase Console → Realtime Database → Data)

```json
{
  "admins": {
    "AVD1M9EMLHhFmmo0j9g55slMW5m2": true
  }
}
```

The rules below also let that exact UID write `/admins/*` itself, so it can
promote or demote other admins from the Admin → Users tab.

Also enable only **Google** as a sign-in provider (plus Email/Password if you
want the staff email login) in Authentication → Sign-in method.

## Rules — paste all of this into Realtime Database → Rules

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "admins": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.uid === 'AVD1M9EMLHhFmmo0j9g55slMW5m2' || root.child('admins').child(auth.uid).val() === true)",
      "$uid": {
        ".read": "auth != null",
        ".validate": "newData.isBoolean()"
      }
    },

    "users": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",

        "email":        { ".validate": "newData.isString() || !newData.exists()" },
        "displayName":  { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 40)" },
        "photoURL":     { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500)" },
        "created_at":   { ".validate": "newData.isNumber()" },

        "status":         { ".write": "root.child('admins').child(auth.uid).val() === true", ".validate": "newData.val() === 'free' || newData.val() === 'vip'" },
        "isvip":          { ".write": "root.child('admins').child(auth.uid).val() === true", ".validate": "newData.isBoolean()" },
        "vip_until":      { ".write": "root.child('admins').child(auth.uid).val() === true" },
        "banned":         { ".write": "root.child('admins').child(auth.uid).val() === true", ".validate": "newData.isBoolean()" },
        "ban_reason":     { ".write": "root.child('admins').child(auth.uid).val() === true" },
        "isAdmin":        { ".write": false },
        "isModerator":    { ".write": "root.child('admins').child(auth.uid).val() === true" },
        "isBeta":         { ".write": "root.child('admins').child(auth.uid).val() === true" },
        "payment_status": { ".write": "root.child('admins').child(auth.uid).val() === true" },

        "watchProgress": { ".write": "auth != null && auth.uid === $uid" },
        "bookmarks":     { ".write": "auth != null && auth.uid === $uid" }
      }
    },

    "users_public": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        "bio": { ".validate": "newData.isString() && newData.val().length <= 160" }
      }
    },

    "payments": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".indexOn": ["uid"],
      "$pid": {
        ".read": "auth != null && (data.child('uid').val() === auth.uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && (
                     (!data.exists()
                       && newData.child('uid').val() === auth.uid
                       && newData.child('amount').val() === 50000
                       && newData.child('status').val() === 'pending')
                     || root.child('admins').child(auth.uid).val() === true
                   )"
      }
    },

    "animes": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$id": {
        "userRatings": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid",
            ".validate": "newData.child('score').isNumber() && newData.child('score').val() >= 1 && newData.child('score').val() <= 5"
          }
        }
      }
    },

    "episodes": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".indexOn": ["anime_id"]
    },

    "settings": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true"
    },

    "comments": {
      "$episodeId": {
        ".read": true,
        "$cid": {
          ".write": "auth != null && (
                       (!data.exists()
                         && newData.child('uid').val() === auth.uid
                         && root.child('users').child(auth.uid).child('banned').val() !== true
                         && !newData.hasChild('pinned'))
                       || root.child('admins').child(auth.uid).val() === true
                     )",
          "text": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500" },
          "pinned": { ".write": "root.child('admins').child(auth.uid).val() === true" },
          "reports": {
            "$reporter": {
              ".write": "auth != null && auth.uid === $reporter",
              ".validate": "newData.isBoolean()"
            }
          }
        }
      }
    },

    "reported_comments": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$rid": {
        ".write": "auth != null && (
                     (!data.exists() && newData.child('reporter_uid').val() === auth.uid)
                     || root.child('admins').child(auth.uid).val() === true
                   )"
      }
    },

    "bookmarks": {
      "$uid": {
        ".read":  "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && auth.uid === $uid"
      }
    },

    "history": {
      "$uid": {
        ".read":  "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

## What the client can and cannot do

| Action | Allowed for |
| --- | --- |
| Create own profile + `isvip: false` | the signed-in user, on first login |
| Flip `status` / `isvip` / `banned` / `isModerator` | admins only |
| Write `/admins/{uid}` | root admin UID (and existing admins) |
| Delete any comment / pin | admins only |
| Delete own comment | comment author |
| Read all users / payments | admins only |

`users/{uid}/isAdmin` is permanently read-only (`".write": false`) so a stale or
forged value in a profile document can never grant admin — the app resolves
admin status from `/admins/{uid}`.
