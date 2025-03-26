# Deprecated Components

This directory contains components that were identified as unused or redundant in the codebase and moved here for preservation before eventual deletion.

## Mobile Components
- Most components from `src/components/mobile/` directory
- Bottom tab navigation was redundant with `layout/MobileNavigation.tsx`
- Only `ResponsiveContainer.tsx` was kept in place with a deprecation notice since its `Breakpoint` type was used in `useViewport.ts`

## Monitoring Components
- `PerformanceMonitor.tsx` and `MonitoringProvider.tsx` were not imported anywhere

## Profile Components
- `WalletBadge.tsx` was unused but may contain reusable wallet-related UI patterns

## Animation Components
- Various animation components that weren't imported in active code
- `StaggeredContainer.tsx` and other animation utilities might be useful for future features

## Navigation Components
- `Topbar.tsx` was redundant with `layout/TopBar.tsx`

## Note on Import Updates
- `useViewport.ts` was updated to define the `Breakpoint` type directly instead of importing it

These components were preserved here rather than immediately deleted to:
1. Allow for reference of the implementations
2. Ensure no unexpected dependencies exist
3. Enable recovery of specific functionality if needed 