#!/bin/sh
# Rebuild the x86 guest on an x86-64 Linux host. Use a clean checkout.
set -eu
cd "$(dirname "$0")"
here=$PWD
temp=$(mktemp -d)
trap 'rm -rf "$temp"' EXIT
cd "$temp"
download() {
    curl --fail --silent --show-error --location "$1" --output "$2"
    printf '%s  %s\n' "$3" "$2" | sha256sum --check
}
alpine=https://dl-cdn.alpinelinux.org/alpine/v3.23
download "$alpine/main/x86_64/apk-tools-static-3.0.9-r0.apk" apk-tools.apk ea77b2533566e70c9566c03748199b79348010c3199ba02d97e0634cf0fa9ef7
download "$alpine/releases/x86/alpine-minirootfs-3.23.8-x86.tar.gz" base.tar.gz 2e8ba8a8801fb74cd0d32ab8ba8bae3f6ba9f271ed6a086f5ce4cb0226ee4ed4
tar --warning=no-unknown-keyword xf apk-tools.apk
mkdir root
tar --no-same-owner --exclude='./dev/*' -xf base.tar.gz -C root
set --
while IFS="$(printf '\t')" read -r name version other; do
    set -- "$@" "$name=$version"
done < "$here/packages.tsv"
sbin/apk.static --root "$PWD/root" --arch x86 --no-scripts --no-chown \
    --repositories-file /dev/null -X "$alpine/main" add "$@"
install -m 755 "$here/init" root/init
python3 "$here/newc.py" root root.cpio
python3 "$here/lz4-legacy.py" < root.cpio > root.cpio.lz4
mkdir -p "$here/files"
install -m 644 root/boot/vmlinuz-virt "$here/files/vmlinuz-virt"
python3 "$here/split-image.py" root.cpio.lz4 "$here/files"
