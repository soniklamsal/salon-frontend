# Fallback Data System

This directory contains static fallback data files that allow the frontend to continue displaying salon information even when the backend is unavailable due to maintenance or connectivity issues.

## Files

- **fallback-homepage.json**: Homepage content including hero section, services, gallery, and footer
- **fallback-about.json**: About page content including hero, columns, stats, and team information
- **fallback-booking.json**: Booking configuration including services, barbers, and payment information

## How It Works

When the backend API is unreachable:

1. The API functions in `src/lib/api/` attempt to fetch fresh data from the backend
2. If the request fails (timeout, connection error, or HTTP error), the API logs a warning
3. If `NEXT_PUBLIC_USE_FALLBACK_DATA` is not set to `"false"`, the API returns the static fallback data
4. The frontend renders normally with the fallback data
5. Next.js ISR (Incremental Static Regeneration) continues to attempt fetching fresh data in the background

## Environment Variable

```env
# Enable fallback data (default: enabled)
NEXT_PUBLIC_USE_FALLBACK_DATA=true

# Disable fallback data (will show "Content Unavailable" when backend is down)
NEXT_PUBLIC_USE_FALLBACK_DATA=false
```

## Updating Fallback Data

Fallback data should be updated periodically to reflect current salon information. To update:

### Automatic Update (Recommended)

Run the update script:

```bash
npm run update-fallback
```

### Manual Update

1. Ensure the backend is running
2. Fetch the latest data:

```bash
# From the salon-frontend directory
curl http://127.0.0.1:8000/api/v1/homepage/ > src/lib/data/fallback-homepage.json
curl http://127.0.0.1:8000/api/v1/about/ > src/lib/data/fallback-about.json
curl http://127.0.0.1:8000/api/v1/booking-config/ > src/lib/data/fallback-booking.json
```

Or use PowerShell:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/v1/homepage/ -UseBasicParsing | Select-Object -ExpandProperty Content | Out-File -FilePath src\lib\data\fallback-homepage.json -Encoding UTF8
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/v1/about/ -UseBasicParsing | Select-Object -ExpandProperty Content | Out-File -FilePath src\lib\data\fallback-about.json -Encoding UTF8
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/v1/booking-config/ -UseBasicParsing | Select-Object -ExpandProperty Content | Out-File -FilePath src\lib\data\fallback-booking.json -Encoding UTF8
```

3. Commit and deploy the updated files

## When Fallback Data is Used

Fallback data is served when:

- The backend server is down or unreachable
- Network connectivity issues prevent API requests
- API requests timeout (default: 4 seconds)
- The backend returns HTTP error responses (4xx, 5xx)

## When Fresh Data is Used

Fresh data from the backend is used when:

- The backend API responds successfully
- After Next.js revalidation period (default: 60 seconds)
- When the cache is manually cleared or revalidated

## Benefits

1. **Uptime**: Site remains functional during backend maintenance
2. **Performance**: No loading states or blank pages during outages
3. **User Experience**: Visitors see real salon content, not error messages
4. **SEO**: Search engines can still crawl and index content
5. **Booking Information**: Customers can view services and prices even when booking submissions are temporarily unavailable

## Limitations

When using fallback data:

- **Booking submissions** will fail (handled gracefully by the booking form)
- **Contact form submissions** will fail (form shows appropriate error message)
- **User-specific content** (my bookings) is not available
- **Real-time availability** is not reflected (times slots, barber availability)

The site clearly indicates to users when submission features are temporarily unavailable.

## Testing Fallback Mode

To test the fallback system:

1. Stop the backend server
2. Visit the site - it should display fallback data
3. Check the browser console for fallback messages
4. Verify all pages load correctly (homepage, about, services)

Or set the API URL to an invalid endpoint:

```env
NEXT_PUBLIC_SALON_API_URL=http://localhost:9999/api/v1
```

## Monitoring

Monitor these logs to detect when fallback mode is active:

```
[content] http://localhost:8000/api/v1/homepage/ unavailable — serving fallback data
[about] http://localhost:8000/api/v1/about/ unavailable — serving fallback data
[booking] http://localhost:8000/api/v1/booking-config/ unavailable — serving fallback data
```

Set up alerts when these messages appear in production logs to know when the backend needs attention.
