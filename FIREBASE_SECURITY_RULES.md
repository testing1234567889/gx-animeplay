# Firebase RTDB Security Rules — lovable-animestream

Copy the JSON below into **Firebase Console → Realtime Database → Rules → Publish**.

## Yang salah di rules versi kamu

1. **JSON invalid** — beberapa `.write` (payments, comments, reported_comments) ditulis
   multi-baris. JSON tidak boleh ada newline di dalam string; Firebase akan menolak.
   Semua ekspresi harus satu baris.
2. **Privilege escalation (kritis)** — di RTDB, izin `.write` dari node induk **tidak
   bisa dibatalkan** oleh anaknya. Karena `users/$uid` sudah memberi `.write` ke pemilik
   akun, maka `"isAdmin": { ".write": false }`, `"isvip"`, `"banned"`, `"status"`,
   `"vip_until"`, `"isModerator"` dst. **tetap bisa ditulis user sendiri** → user bisa
   menjadikan dirinya VIP/moderator dan meng-unban diri sendiri.
   Solusi: pakai `.validate` (validate berlaku kumulatif) untuk mengunci field itu.
3. **`comments/$cid/pinned` sama masalahnya** — `.write` admin di child tidak menutup
   `.write` di `$cid`. Dikunci lewat `.validate`.
4. **`created_at` wajib number** akan menolak update partial? Tidak — validate hanya
   jalan kalau field ikut ditulis. Tapi ditambahkan `!newData.exists() ||` supaya aman
   saat field dihapus.
5. **`users_public/$uid`** belum membatasi field lain, dan `bio` tak boleh kosong hilang.
6. Catatan: `episodes` sengaja `auth != null` supaya embed URL tidak bisa diambil tamu
   (paywall VIP dijaga server function). Efek sampingnya: preview Open Graph judul
   episode fallback ke data anime — itu wajar.

## Rules final

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "admins": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.uid === 'AVD1M9EMLHhFmmo0j9g55slMW5m2' || root.child('admins').child(auth.uid).val() === true)",
      "$uid": { ".validate": "newData.isBoolean()" }
    },

    "users": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".indexOn": ["created_at"],
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",

        "email": { ".validate": "!newData.exists() || newData.isString()" },
        "displayName": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 40)" },
        "photoURL": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500)" },
        "created_at": { ".validate": "!newData.exists() || newData.isNumber()" },

        "status": { ".validate": "root.child('admins').child(auth.uid).val() === true || (!data.exists() && newData.val() === 'free') || newData.val() === data.val()" },
        "isvip": { ".validate": "newData.isBoolean() && (root.child('admins').child(auth.uid).val() === true || (!data.exists() && newData.val() === false) || newData.val() === data.val())" },
        "vip_until": { ".validate": "root.child('admins').child(auth.uid).val() === true || newData.val() === data.val()" },
        "banned": { ".validate": "newData.isBoolean() && (root.child('admins').child(auth.uid).val() === true || newData.val() === data.val())" },
        "ban_reason": { ".validate": "root.child('admins').child(auth.uid).val() === true || newData.val() === data.val()" },
        "isAdmin": { ".validate": "false" },
        "isModerator": { ".validate": "root.child('admins').child(auth.uid).val() === true || newData.val() === data.val()" },
        "isBeta": { ".validate": "root.child('admins').child(auth.uid).val() === true || newData.val() === data.val()" },
        "payment_status": { ".validate": "root.child('admins').child(auth.uid).val() === true || newData.val() === data.val()" },

        "watchProgress": { ".write": "auth != null && auth.uid === $uid" },
        "bookmarks": { ".write": "auth != null && auth.uid === $uid" }
      }
    },

    "users_public": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        "bio": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 160)" },
        "displayName": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 40)" },
        "photoURL": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500)" },
        "$other": { ".validate": false }
      }
    },

    "payments": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".indexOn": ["uid", "created_at"],
      "$pid": {
        ".read": "auth != null && (data.child('uid').val() === auth.uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && ((!data.exists() && newData.child('uid').val() === auth.uid && newData.child('amount').val() === 50000 && newData.child('status').val() === 'pending') || root.child('admins').child(auth.uid).val() === true)",
        "status": { ".validate": "root.child('admins').child(auth.uid).val() === true || newData.val() === 'pending'" },
        "amount": { ".validate": "newData.val() === 50000" },
        "proof_url": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500 && (newData.val().beginsWith('https://') || newData.val().beginsWith('http://')))" }
      }
    },

    "animes": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$id": {
        "userRatings": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid",
            "score": { ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 5" }
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
          ".write": "auth != null && ((!data.exists() && newData.child('uid').val() === auth.uid && root.child('users').child(auth.uid).child('banned').val() !== true) || (data.child('uid').val() === auth.uid && !newData.exists()) || root.child('admins').child(auth.uid).val() === true)",
          "uid": { ".validate": "newData.val() === data.val() || newData.val() === auth.uid" },
          "text": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500" },
          "pinned": { ".validate": "newData.isBoolean() && (root.child('admins').child(auth.uid).val() === true || newData.val() === data.val())" },
          "reports": {
            "$reporter": {
              ".write": "auth != null && (auth.uid === $reporter || root.child('admins').child(auth.uid).val() === true)",
              ".validate": "newData.isBoolean()"
            }
          }
        }
      }
    },

    "reported_comments": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$rid": {
        ".write": "auth != null && ((!data.exists() && newData.child('reporter_uid').val() === auth.uid) || root.child('admins').child(auth.uid).val() === true)"
      }
    },

    "bookmarks": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && auth.uid === $uid"
      }
    },

    "history": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

Root admin UID `AVD1M9EMLHhFmmo0j9g55slMW5m2` hanya dipakai di dalam rules ini
(bootstrap `/admins`), tidak pernah di kode client.
