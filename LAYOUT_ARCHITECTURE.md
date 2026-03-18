# 📐 Layout Architecture - Seller Profile

## BEFORE (Old Layout)

```
┌─────────────────────────────────────────────────┐
│ Full Page (scrolls together)                     │
├─────────────────────┬───────────────────────────┤
│   LEFT SIDEBAR      │                           │
│  (scrolls away)     │   RIGHT CONTENT           │
│                     │  (scrolls away)           │
│  ◌ Store Logo      │   Personal Info Form      │
│  ◌ Store Name      │   Store Info Form         │
│  ◌ Navigation      │   Social Links Form       │
│  ◌ Stats           │                           │
│  ◌ Tabs            │   ...more forms below     │
│  ◌ ...scrolls      │   (entire page scrolls)   │
│                     │                           │
└─────────────────────┴───────────────────────────┘
     ↓ Problem: Context lost when scrolling
```

## AFTER (New Layout)

```
┌──────────────────────────────────────────────────────┐
│ Screen 100vh                                         │
├─────────────────────┬────────────────────────────────┤
│  LEFT SIDEBAR       │                                │
│  (STICKY - Fixed)   │  RIGHT CONTENT AREA           │
│  ☆ FIXED HEIGHT    │  (SCROLLABLE - Only this)     │
│                     │                                │
│  ◌ Store Logo      │  ┌─────────────────────────┐  │
│  ◌ Store Name      │  │ Personal Info Form      │  │
│  ◌ Stats Grid      │  │ • Full Name             │  │
│  ◌ Navigation      │  │ • Display Name          │  │
│  ◌ View Store      │  │ • Phone                 │  │
│  ◌ Share Link      │  │ • Date of Birth         │  │
│                     │  │ • Bio                   │  │
│                     │  │ • City                  │  │
│  (no scroll)       │  │ [Save Button]           │  │
│                     │  ↓                         │  │
│                     │  Store Info Form          │  │
│                     │  Social Links Form        │  │
│                     │  Account Settings         │  │
│                     │  Danger Zone              │  │
│                     │  └─────────────────────────┘  │
│                     │  (scrolls independently) ✓    │
│                     │                                │
└─────────────────────┴────────────────────────────────┘
     ✓ Context always visible!
```

## CSS Classes Used

### Left Column (Fixed)
```css
lg:w-[280px]              /* 280px wide on desktop */
lg:sticky                 /* Sticks to top */
lg:top-6                  /* 24px from top */
lg:h-fit                  /* Fits content height */
flex-shrink-0             /* Doesn't shrink */
space-y-4                 /* 16px gap between cards */
```

### Right Column (Scrollable)
```css
flex-1                    /* Takes remaining space */
min-w-0                   /* Prevents overflow */
overflow-y-auto           /* Vertical scroll only */
pr-2                      /* Padding for scrollbar */
```

### Main Container
```css
min-h-screen              /* Full screen minimum */
flex flex-col             /* Vertical stack */
lg:flex-row               /* Row on desktop */
gap-6                     /* 24px between columns */
```

---

## Component Hierarchy

```
ProfilePageClient (Main)
├── Main Container (sticky + scrollable layout)
│
├── LEFT SIDEBAR (lg:sticky, does not scroll)
│   ├── MacCard (Summary)
│   │   └── SellerAvatarUpload ✨ NEW
│   │       └── Store Logo (square, interactive)
│   │       └── Camera icon on hover
│   │   └── Store Name
│   │   └── Stats Grid
│   │   └── View/Share Buttons
│   │
│   └── MacCard (Navigation)
│       └── Tab Buttons
│           ├── Personal Info
│           ├── Store Info
│           ├── Social Links
│           ├── Account Settings
│           └── Danger Zone
│
└── RIGHT CONTENT (overflow-y-auto, scrollable only)
    └── Dynamic Tab Content
        ├── PersonalForm (selected)
        ├── StoreInfoForm
        ├── SellerSocialLinksForm
        ├── SellerAccountSettingsForm
        └── SellerDangerZonePanel
```

---

## Responsive Behavior

### Mobile (< 1024px)
```
┌──────────────────────┐
│  LEFT SIDEBAR        │
│  (full width)        │
│  ┌────────────────┐  │
│  │ Store Logo     │  │
│  │ Store Name     │  │
│  │ Navigation     │  │
│  └────────────────┘  │
└──────────────────────┘
        ↓ (scroll)
┌──────────────────────┐
│  RIGHT CONTENT       │
│  (full width)        │
│  ┌────────────────┐  │
│  │ Personal Info  │  │
│  │ Form           │  │
│  └────────────────┘  │
└──────────────────────┘
Entire page scrolls (stacked layout)
```

### Desktop (≥ 1024px)
```
┌────────────────┬──────────────────────────┐
│ LEFT SIDEBAR   │ RIGHT CONTENT            │
│ (sticky)       │ (scrollable)             │
│                │                          │
│ Fixed          │ Can scroll               │
│ 280px          │ While sidebar is fixed   │
│ height         │                          │
│                │                          │
└────────────────┴──────────────────────────┘
```

---

## Avatar Upload Integration

### Before
```
<div className="w-20 h-20">
  <img src={logoUrl} />
  {/* Static display only */}
</div>
```

### After
```
<SellerAvatarUpload
  userId={userId}
  currentUrl={logoUrl}
  storeName={storeName}
  onUploadComplete={(url) => { /* ... */ }}
/>
```

**Features**:
- ✅ Hover animation (camera icon appears)
- ✅ Click to upload
- ✅ Automatic save to database
- ✅ Square shape (24x24px)
- ✅ Initials fallback
- ✅ Progress indicator while uploading

---

## Scrollbar Behavior

```
┌─ Title Bar (navigation breadcrumb)
│
├─ Content Container
│  ├─ Left Sidebar (STICKY)
│  │  └─ No scrollbar
│  │
│  └─ Right Content Area (SCROLLABLE)
│     ├─ Has vertical scrollbar on overflow
│     ├─ Smooth scrolling (native)
│     └─ Padding-right for scrollbar gap
│
└─ Footer (optional)
```

---

## Performance Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Navigation Visibility** | Lost on scroll | Always visible |
| **Form Clarity** | Context disappears | Context always shown |
| **Mobile Experience** | Responsive | Better UX |
| **Desktop Experience** | Page scrolls whole | Only form scrolls |
| **Avatar Upload** | Not available | ✅ New feature |

---

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ Touch devices

**Note**: Uses standard CSS `position: sticky` which is widely supported.
