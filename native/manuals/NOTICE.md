# Bundled Linux manual pages

Upstream: Linux man-pages 6.16, https://www.kernel.org/pub/linux/docs/man-pages/man-pages-6.16.tar.xz
Archive SHA256: 8e247abd75cd80809cfe08696c81b8c70690583b045749484b242fb43631d7a3
Rendered with mandoc 1.14.6 (ISC licence; build-time tool only).

Each page retains its original copyright and licence notice in dist/manuals/source/. All
upstream licence texts are in dist/manuals/licenses/. manifest.json identifies each page.
The HTML changes headings and cross-reference links for the course reader;
manual content is otherwise unchanged. Terminal copies only remove overstrike
formatting and wrap at 88 columns. This documentation has its own licences;
it is not relicensed under the course licence.

These manuals describe Linux/glibc contracts and extensions, not a promise of
support in the inline WASI compiler or the musl-based Browser Linux guest.
Use STANDARDS, feature-test requirements and the lesson's target when reading.
