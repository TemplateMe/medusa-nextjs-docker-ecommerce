# Meilisearch Search UI Testing Checklist

## 🎯 Overview
This checklist covers all features exposed by the interactive search modal that utilizes Meilisearch capabilities.

---

## ✅ Basic Search Functionality

### Search Input & Interaction
- [ ] **Open Search Modal**: Click the search button in the navigation bar (magnifying glass icon)
- [ ] **Close Modal**: 
  - [ ] Click the X close button
  - [ ] Click outside the modal (on overlay)
  - [ ] Press ESC key
- [ ] **Search Input Focus**: Modal should auto-focus on input field when opened
- [ ] **Clear Search**: Click X icon in search input to clear text

### Search Execution
- [ ] **Basic Text Search**: Type a product name (e.g., "shirt", "pants", "hoodie")
- [ ] **Debounce Works**: Verify search only triggers after 300ms of no typing (prevents API spam)
- [ ] **Loading State**: See loading spinner while search is executing
- [ ] **Empty Query**: Confirm no search happens with empty input
- [ ] **Search Results Display**: Results appear with product thumbnails, titles, and categories

---

## 🔍 Meilisearch Core Features

### Typo Tolerance
- [ ] **Single Character Typo**: Search "shrt" → should find "shirt"
- [ ] **Multiple Typos**: Search "t-shrt" → should find "t-shirt"
- [ ] **Common Misspellings**: Test "tshirt", "tee shirt", "teeshirt"
- [ ] **Transposed Letters**: Search "hsitr" → should find "shirt"

### Search Speed & Performance
- [ ] **Response Time Display**: Check the search time shown in results (should be < 100ms)
- [ ] **Large Result Sets**: Search common terms to test many results
- [ ] **Single Result**: Search specific product SKU or unique name
- [ ] **No Lag on Typing**: Verify debounce + fast Meilisearch = smooth UX

### Relevance & Ranking
- [ ] **Exact Match Priority**: Search exact product name → should appear first
- [ ] **Partial Matches**: Search word fragment → relevant products appear
- [ ] **Category Relevance**: Products grouped/ordered by relevance
- [ ] **Empty Results**: Search gibberish (e.g., "xyzabc123") → see "No products found"

---

## 🎨 UI/UX Testing

### Visual Presentation
- [ ] **Product Thumbnails**: Images load correctly for all results
- [ ] **Fallback Images**: Products without images show placeholder
- [ ] **Category Labels**: Category/collection names display under title
- [ ] **Hover Effects**: Result items highlight on hover
- [ ] **Responsive Design**: Test on mobile, tablet, desktop screen sizes

### Navigation & Links
- [ ] **Click Product Result**: Navigate to product detail page
- [ ] **URL Includes Country Code**: Verify LocalizedClientLink works (e.g., `/us/products/...`)
- [ ] **Modal Closes on Selection**: Modal dismisses after clicking a result
- [ ] **Back Button Works**: Can return from product page to previous page

### Loading & Error States
- [ ] **Initial State**: Empty search shows no results message
- [ ] **Loading Spinner**: Appears during search API call
- [ ] **Error Handling**: 
  - [ ] Test with backend down (stop Docker containers)
  - [ ] Verify error message displays
  - [ ] Check network errors are caught gracefully
- [ ] **Empty Results Message**: Shows when valid search returns 0 results

---

## 🧪 Edge Cases & Stress Testing

### Input Validation
- [ ] **Special Characters**: Search `!@#$%^&*()` → handle gracefully
- [ ] **SQL Injection Attempt**: Search `'; DROP TABLE--` → no errors
- [ ] **Very Long Query**: Search 500+ character string → no crash
- [ ] **Unicode Characters**: Search emojis, Chinese/Arabic text → handle properly
- [ ] **Leading/Trailing Spaces**: Search " shirt " → works same as "shirt"

### Search Behavior
- [ ] **Rapid Typing**: Type very fast and verify debounce still works
- [ ] **Multiple Quick Searches**: Search → clear → search again rapidly
- [ ] **Search Same Query Twice**: Verify caching or proper re-fetch
- [ ] **Network Throttling**: Test on slow 3G connection (Chrome DevTools)

### Product Data Quality
- [ ] **All Products Searchable**: Verify all 5 indexed products can be found
- [ ] **Product Titles**: Confirm all display names are correct
- [ ] **Product Categories**: Check category assignments are accurate
- [ ] **Thumbnail URLs**: All image paths resolve correctly

---

## 🔧 Technical Validation

### API Integration
- [ ] **Correct Endpoint**: POST request goes to `/store/products/search`
- [ ] **Request Body**: Verify `{ query: "search term" }` in network tab
- [ ] **Response Format**: Check Meilisearch response structure (hits, processingTimeMs, etc.)
- [ ] **Status Codes**: 200 for success, proper error codes for failures
- [ ] **CORS Headers**: No CORS errors in browser console

### Console & Logs
- [ ] **No JavaScript Errors**: Check browser console for errors
- [ ] **No Warning Messages**: Verify no React warnings or deprecations
- [ ] **Network Tab**: Inspect request/response in DevTools
- [ ] **React DevTools**: Check component state updates properly

### Meilisearch Backend
- [ ] **Index Exists**: Verify `products` index exists in Meilisearch dashboard
- [ ] **Document Count**: Confirm 5 documents are indexed
- [ ] **Searchable Attributes**: Check which fields are searchable (title, description, etc.)
- [ ] **Displayed Attributes**: Verify returned fields match SearchResult interface
- [ ] **Facets/Filters**: (If implemented) Test category filtering

---

## 🌐 Cross-Browser Testing

- [ ] **Chrome**: Latest version
- [ ] **Firefox**: Latest version
- [ ] **Safari**: Latest version (if on macOS)
- [ ] **Edge**: Latest version
- [ ] **Mobile Safari**: iOS device
- [ ] **Mobile Chrome**: Android device

---

## 📊 Advanced Meilisearch Features (Future Enhancements)

### Features to Test If Implemented
- [ ] **Filters**: Filter by category, price range, availability
- [ ] **Facets**: Display faceted search counts (e.g., "Shirts (12), Pants (8)")
- [ ] **Synonyms**: Configure synonyms (e.g., "tee" → "t-shirt")
- [ ] **Stop Words**: Test common words ignored in search
- [ ] **Highlighting**: Search term highlighting in results
- [ ] **Geosearch**: Location-based product search (if applicable)
- [ ] **Multi-Index Search**: Search across products, collections, categories
- [ ] **Autocomplete**: Suggest queries as user types
- [ ] **Sort Options**: Sort by relevance, price, date added

---

## 🐛 Known Issues & Limitations

### Current Limitations
- Search only covers product title and description
- No filtering by price, availability, or attributes
- No search history or recent searches
- No analytics tracking for search queries
- Limited to 5 products in current index (demo data)

### Expected Behavior
- First search after page load may be slower (cold start)
- Searches are case-insensitive by default
- Special characters are handled but may not affect ranking

---

## 📝 Testing Notes Template

Use this template to document your test results:

```
Date: _________
Tester: _________
Environment: Development / Staging / Production

Feature Tested: ___________________________
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Notes:
- 
- 
- 

Screenshot/Recording: [Link]
```

---

## 🚀 Quick Test Script

**5-Minute Smoke Test**:
1. Open web app in browser
2. Click search button in navigation
3. Type "shirt" → verify results appear quickly
4. Type "shrt" (typo) → verify typo tolerance works
5. Click a result → verify navigation to product page
6. Return and test closing modal (X, ESC, overlay click)
7. Check browser console for errors

**Status**: ⬜ Not Started | ✅ Passed | ❌ Failed

---

## 📞 Support & Resources

- **Meilisearch Docs**: https://www.meilisearch.com/docs
- **Backend API**: `POST http://localhost:9000/store/products/search`
- **Meilisearch Dashboard**: `http://localhost:7700` (Master Key: `mK8vQ7nX2pL9wR4tY6hU3jN5mB8cD1fG`)
- **Issue Tracker**: Create GitHub issues for bugs found

---

**Last Updated**: 2025
**Version**: 1.0
