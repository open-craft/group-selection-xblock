/**
 * Browser navigation helpers.
 *
 * Kept in their own module so tests can mock them: jsdom doesn't implement
 * navigation, and window.location can't be stubbed directly.
 */

export function reloadPage(): void {
  window.location.reload();
}
