// Only the dedicated reader return skips the opening. A normal visit still
// completes the Framework entrance and starts with the muted film.
export function isWorkflowDocsReturn(location: Pick<Location, 'search' | 'hash'>) {
  return new URLSearchParams(location.search).get('from') === 'workflow-docs'
    && location.hash === '#work-backend';
}
