# Firebase Index Setup

## Required Composite Indexes

Firebase requires composite indexes for queries that filter and order by different fields. You need to create **3 indexes**:

---

## 1. Users Collection Index

### Index Details:
- **Collection**: `users`
- **Fields**:
  1. `organizationId` (Ascending)
  2. `createdAt` (Descending)
  3. `__name__` (Ascending) - automatically added

### How to Create:

**Automatic (Recommended)**: Click this link to create the index:
```
https://console.firebase.google.com/v1/r/project/somoxlean/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9zb21veGxlYW4vZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3VzZXJzL2luZGV4ZXMvXxABGhIKDm9yZ2FuaXphdGlvbklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

**Manual**:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: `somoxlean`
- Navigate to Firestore Database → Indexes
- Click "Create Index"
- Collection ID: `users`
- Add fields:
  - `organizationId` - Ascending
  - `createdAt` - Descending
- Click "Create"

---

## 2. Payroll Collection Index

### Index Details:
- **Collection**: `payroll`
- **Fields**:
  1. `organizationId` (Ascending)
  2. `payPeriod` (Descending)
  3. `__name__` (Ascending) - automatically added

### How to Create:

**Automatic (Recommended)**: Click this link to create the index:
```
https://console.firebase.google.com/v1/r/project/somoxlean/firestore/indexes?create_composite=Cklwcm9qZWN0cy9zb21veGxlYW4vZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3BheXJvbGwvaW5kZXhlcy9fEAEaEgoOb3JnYW5pemF0aW9uSWQQARoNCglwYXlQZXJpb2QQAhoMCghfX25hbWVfXxAC
```

**Manual**:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: `somoxlean`
- Navigate to Firestore Database → Indexes
- Click "Create Index"
- Collection ID: `payroll`
- Add fields:
  - `organizationId` - Ascending
  - `payPeriod` - Descending
- Click "Create"

---

---

## 3. Payments Collection Index

### Index Details:
- **Collection**: `payments`
- **Fields**:
  1. `organizationId` (Ascending)
  2. `createdAt` (Descending)
  3. `__name__` (Ascending) - automatically added

### How to Create:

**Automatic (Recommended)**: Click this link to create the index:
```
https://console.firebase.google.com/v1/r/project/somoxlean/firestore/indexes?create_composite=Ckpwcm9qZWN0cy9zb21veGxlYW4vZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3BheW1lbnRzL2luZGV4ZXMvXxABGhIKDm9yZ2FuaXphdGlvbklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

**Manual**:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: `somoxlean`
- Navigate to Firestore Database → Indexes
- Click "Create Index"
- Collection ID: `payments`
- Add fields:
  - `organizationId` - Ascending
  - `createdAt` - Descending
- Click "Create"

---

## Notes:
- Index creation may take a few minutes to complete
- Once created, the errors will disappear automatically
- You can check index status in Firebase Console → Firestore → Indexes
- All three indexes are required for the application to function properly
