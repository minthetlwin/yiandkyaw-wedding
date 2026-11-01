interface ImportMetaEnv {
  /** Google Apps Script web-app URL for shared RSVPs. Optional. */
  readonly VITE_RSVP_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
