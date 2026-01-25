/**
 * Inbox Badge Helper
 * 
 * Utility to refresh the unread messages badge count
 * Call this when messages are marked as read
 */

// Event system for badge refresh
const BADGE_REFRESH_EVENT = 'inbox-badge-refresh';

export function refreshInboxBadge() {
  // Dispatch custom event to trigger badge refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BADGE_REFRESH_EVENT));
  }
}

export function useBadgeRefreshListener(callback: () => void) {
  if (typeof window !== 'undefined') {
    window.addEventListener(BADGE_REFRESH_EVENT, callback);
    return () => window.removeEventListener(BADGE_REFRESH_EVENT, callback);
  }
  return () => {};
}

export { BADGE_REFRESH_EVENT };
