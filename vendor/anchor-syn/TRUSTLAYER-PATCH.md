# Anchor 0.30.1 IDL compatibility patch

Source: `https://github.com/coral-xyz/anchor/tree/v0.30.1/lang/syn`
License: upstream Apache-2.0, included in LICENSE.

This directory preserves the upstream crate with exactly one Rust source change:
`src/idl/defined.rs` uses `Span::local_file().expect(...)` instead of the removed
`Span::source_file().path()` API. This retains real filesystem-path lookup for
IDL alias/external-type resolution and fails explicitly if unavailable. It does
not substitute a display filename, skip resolution, or disable IDL generation.

The root Cargo patch applies consistently to transitive Anchor macro crates.
Anchor remains 0.30.1; proc-macro2 remains locked to 1.0.107. Remove this patch
only when a separately validated Anchor upgrade incorporates compatible code.

This is build tooling, not an on-chain program upgrade. Validate with locked
Cargo metadata, Anchor build (including IDL), and the isolated validator tests.

An upstream trailing space in a comment in `src/codegen/accounts/try_accounts.rs`
was also removed to satisfy the repository diff whitespace check.
