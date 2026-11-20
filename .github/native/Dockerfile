FROM node:24-trixie-slim AS node
FROM gcc:14.3.0-trixie
# Slim images can exclude manual files; restore them before installing help.
RUN if [ -f /etc/dpkg/dpkg.cfg.d/docker ]; then sed -i '\|path-exclude /usr/share/man/|d' /etc/dpkg/dpkg.cfg.d/docker; fi
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang clang-format gdb cmake ninja-build python3 git ca-certificates man-db manpages-dev less \
    && apt-get install -y --no-install-recommends --reinstall coreutils \
    && mandb -q \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
