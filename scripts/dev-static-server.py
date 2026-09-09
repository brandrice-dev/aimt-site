#!/usr/bin/env python3
"""Local static file server for previewing aimt-site, with caching
disabled on every response.

Dev-only tooling -- not part of the deployed site (Cloudflare Pages
serves the real thing on push to main). Plain stdlib, no dependencies.

Plain `python3 -m http.server` sends no Cache-Control header, so Chrome
falls back to heuristic caching keyed off Last-Modified. In a long-lived
local preview session (repeatedly reloading the same URL while iterating
on headspa-mastery.html / assets/js/*.js) this can silently serve a
stale copy of a file that was just edited on disk, making a real fix
look like it "isn't working" in the browser. Sending an explicit
no-store on every response prevents new staleness -- but it cannot undo
a copy Chrome already cached from BEFORE this server started sending
that header (e.g. from an earlier `python3 -m http.server` with no
caching headers at all, in the same long-lived browser profile). So
every response also sends Clear-Site-Data: "cache", which tells the
browser to proactively purge whatever it already has cached for this
origin -- the one reliable way to evict a pre-existing stale entry
without the developer having to manually clear browser data.
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    http.server.test(HandlerClass=NoCacheHandler, port=port)
