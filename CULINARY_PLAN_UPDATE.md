# 🍽️ Culinary Plan Feature Update

## Overview
Transformed the "Recipe Book" feature into a comprehensive "Culinary Plan" that focuses on planning food experiences at restaurants, cafes, and other culinary destinations instead of just storing recipes.

## What Changed

### Previous Structure (Recipe Book)
- **Purpose**: Store cooking recipes
- **Fields**: name, ingredients, instructions, cooking_time, difficulty
- **Use Case**: Home cooking recipes

### New Structure (Culinary Plan)
- **Purpose**: Plan and track culinary adventures
- **Fields**: place_name, location, cuisine_type, price_range, recommended_menu, notes, status, rating, visit_date
- **Use Case**: Restaurant wishlist, food tours, culinary exploration

## Database Changes

### Table Structure (recipes table - renamed conceptually)
```sql
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_name VARCHAR(255) NOT NULL,           -- Restaurant/cafe name
  location VARCHAR(255) NULL,                 -- Address/area
  cuisine_type VARCHAR(100) NULL,             -- Japanese, Italian, etc.
  price_range ENUM('$', '$$', '$$$', '$$$$'), -- Budget indicator
  recommended_menu TEXT NULL,                 -- Must-try dishes
  notes TEXT NULL,                            -- Additional info
  status ENUM('wishlist', 'planned', 'visited'), -- Planning status
  rating INT NULL CHECK (rating >= 1 AND rating <= 5), -- Your rating (if visited)
  is_favorite BOOLEAN DEFAULT FALSE,
  visit_date DATE NULL,                       -- When you visited
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...indexes
);
```

### Migration Applied
- ✅ Ran migration script: `npm run db:migrate`
- ✅ Old recipe data removed (table structure changed)
- ✅ New culinary plan structure active

## Frontend Changes

### Updated Files

#### 1. **app/recipes/page.tsx** (Complete Rewrite)

**New Features:**
- **Filter Tabs**: Filter by status (All, Wishlist, Planned, Visited)
- **Status Badges**: Visual indicators with emojis
  - ✨ Wishlist (purple)
  - 📅 Planned (blue)
  - ✅ Visited (green)
- **Price Range Display**: $, $$, $$$, $$$$
- **Cuisine Type Tags**: Orange badges
- **Rating Stars**: For visited places (1-5 stars)
- **Location Display**: With map pin icon
- **Conditional Fields**: Visit date and rating only for visited places

**UI Improvements:**
- Blue gradient background matching app theme
- Card-based layout with hover effects
- Detailed view with organized sections
- Empty state with encouraging message

#### 2. **app/api/recipes/route.ts** (Complete Rewrite)

**Updated API Endpoints:**

**GET /api/recipes**
- Returns all culinary plans
- Sorted by favorite first, then by created date

**POST /api/recipes**
- Creates new culinary plan
- Required: `placeName`
- Optional: location, cuisineType, priceRange, recommendedMenu, notes, status, rating, visitDate

**PUT /api/recipes**
- Updates existing plan
- All fields can be updated including status and rating

**DELETE /api/recipes**
- Deletes culinary plan by ID

#### 3. **app/dashboard/page.tsx**
- Feature name: "Culinary Plan"
- Description: "Plan culinary adventures"

## New Form Features

### CulinaryForm Component

**Required Fields:**
- Place Name ✅

**Optional Fields:**
- Location (address, area)
- Cuisine Type (Japanese, Italian, etc.)
- Price Range (dropdown: $, $$, $$$, $$$$)
- Status (dropdown: Wishlist, Planned, Visited)
- Recommended Menu (textarea for must-try dishes)
- Notes (textarea for additional info)

**Conditional Fields (when status = "Visited"):**
- Visit Date (date picker)
- Rating (1-5 stars)

### Form Validation
- Place name is required
- Rating must be 1-5 if provided
- Visit date optional but encouraged for visited places

## Visual Design

### Color Scheme
- **Primary**: Teal (#14B8A6) - matches blue theme
- **Status Colors**:
  - Wishlist: Purple
  - Planned: Blue
  - Visited: Green
- **Price Range**: Emerald green
- **Cuisine Type**: Orange
- **Rating**: Yellow (star)

### Icons
- ChefHat: Main feature icon
- MapPin: Location
- Star: Rating
- Calendar: Visit date
- Heart: Favorite toggle
- Plus: Add new place

## Usage Examples

### Example 1: Adding a Restaurant to Wishlist
```json
{
  "placeName": "Sushi Paradise",
  "location": "123 Main St, Downtown",
  "cuisineType": "Japanese",
  "priceRange": "$$$",
  "recommendedMenu": "Omakase Set\nSpicy Tuna Roll\nSalmon Sashimi",
  "notes": "Reservations required. Best for special occasions.",
  "status": "wishlist",
  "isFavorite": true
}
```

### Example 2: Marking as Visited
```json
{
  "placeName": "Joe's Pizza",
  "location": "456 Oak Ave",
  "cuisineType": "Italian",
  "priceRange": "$",
  "recommendedMenu": "Margherita Pizza\nGarlic Knots",
  "notes": "Cash only. Always crowded on weekends.",
  "status": "visited",
  "visitDate": "2025-10-05",
  "rating": 5,
  "isFavorite": true
}
```

### Example 3: Planning a Future Visit
```json
{
  "placeName": "Café Bleu",
  "location": "Downtown Arts District",
  "cuisineType": "French",
  "priceRange": "$$",
  "recommendedMenu": "Croissants\nCafé au Lait\nQuiche Lorraine",
  "notes": "Perfect for brunch dates. Anniversary plans!",
  "status": "planned",
  "isFavorite": false
}
```

## Benefits of New Structure

1. **More Relevant**: Focus on exploring restaurants together
2. **Better Planning**: Track wishlist, planned visits, and visited places
3. **Price Awareness**: Know budget before visiting
4. **Experience Tracking**: Remember what you ordered and loved
5. **Date Ideas**: Quickly find places for special occasions
6. **Memory Keeping**: Record when and where you ate together

## Migration Guide

### To Run Migration Manually
```bash
npm run db:migrate
```

### What Happens
- Drops old `recipes` table
- Creates new table with culinary plan structure
- **WARNING**: Existing recipe data will be lost

### Rollback (if needed)
```bash
npm run db:init
```
This will recreate the original structure.

## Testing

### Manual Testing Steps
1. ✅ Visit `/recipes` page
2. ✅ Click "Add Place" button
3. ✅ Fill in restaurant details
4. ✅ Test different statuses (wishlist, planned, visited)
5. ✅ Add rating and visit date for visited places
6. ✅ Toggle favorite status
7. ✅ Use filter tabs
8. ✅ Click on card to view details

### API Testing
```bash
# Get all plans
curl http://localhost:3000/api/recipes

# Create new plan
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"placeName":"Test Restaurant","status":"wishlist"}'
```

## Files Changed

### Created:
- ✅ `database/migrations/001_update_recipes_to_culinary_plans.sql`
- ✅ `database/migrate.ts`
- ✅ `CULINARY_PLAN_UPDATE.md` (this file)

### Modified:
- ✅ `app/recipes/page.tsx` - Complete rewrite (290+ lines)
- ✅ `app/api/recipes/route.ts` - Updated for new structure
- ✅ `app/dashboard/page.tsx` - Updated feature name
- ✅ `database/schema.sql` - Updated recipes table definition
- ✅ `package.json` - Added `db:migrate` script
- ✅ `THEME_UPDATE.md` - Updated feature name
- ✅ `RECENT_UPDATES.md` - Documented changes

## Future Enhancements (Optional)

1. **Map Integration**: Show restaurant locations on a map
2. **Photo Upload**: Add photos of dishes
3. **Sharing**: Share recommendations with partner
4. **Calendar Integration**: Schedule visits
5. **Budget Tracking**: Track spending at different places
6. **Tags**: Add custom tags (romantic, quick bite, etc.)
7. **Export**: Export visited places as PDF memory book

## Summary

✅ Database migrated successfully
✅ Frontend completely redesigned
✅ API updated to handle new structure
✅ Form optimized for culinary planning
✅ Blue theme applied throughout
✅ Filter and status system implemented
✅ Ready to use!

Now you can plan your culinary adventures together! 🍽️💙
