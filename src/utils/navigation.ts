import { router } from 'expo-router';

/**
 * Enter a route that lives inside one of the route-only tab groups
 * (`(admin)`, `(profile)`, `(cycles)`, `(legal)`) from *outside* that group.
 *
 * Those groups are tab screens, so their stacks survive tab switches: whatever
 * the user last opened in `(admin)` is still sitting there days later. A plain
 * `router.push` into the group therefore stacks the destination on top of that
 * stale history, and "back" drops the user on a screen they never opened — e.g.
 * tapping a "Challenge Joined" notification opened Challenges, but going back
 * landed on a user-detail page left over from an earlier admin session.
 *
 * Navigating to the group root first pops that stale history (react-navigation's
 * `navigate` rewinds to a route already in the stack instead of pushing a
 * duplicate), so back always resolves to the group's own home screen.
 */
export function enterGroupRoute(groupRoot: string, target: string) {
  if (target === groupRoot) {
    router.navigate(groupRoot as any);
    return;
  }
  router.navigate(groupRoot as any);
  router.push(target as any);
}

/** Enter an `(admin)` route from outside the admin group. */
export function enterAdminRoute(target: string) {
  enterGroupRoute('/(app)/(admin)', target);
}
