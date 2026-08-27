/** CSS module type shim for .module.css imports (unused; kept for parity). */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
